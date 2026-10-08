# Teggly: auditoria de WhatsApp, voz e contexto

Fase H, revisada em 2026-10-08 (revisão independente do PR #36). Fontes: workflows e **execuções reais** no n8n (somente leitura, sem disparo de teste, sem WhatsApp real), definição da função de gatilho no banco de produção e dados de configuração da empresa. Dados pessoais de clientes não são reproduzidos aqui.

> **Correção desta revisão.** A primeira versão deste documento atribuiu a saudação "Olá, tudo bem?" ao template padrão do n8n. Os dados reais mostram outra coisa: o texto vem do **template de confirmação cadastrado na empresa** (`tenants.mensagem_confirmacao`). A mudança de copy que publiquei no n8n não afeta a confirmação do Iracema. Ver seções 3 e 5.

## 1. Mapa

| Workflow                            | Gatilho                                                        | O que envia                                                                                                   | Estado                                                |
| ----------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Atendimento WhatsApp (Dona Iracema) | Mensagem recebida (EvolutionAPI)                               | Resposta do agente (Gemini, memória Postgres por telefone, janela 8) ou, para "sim" curto, agradecimento fixo | Ativo, não alterado                                   |
| Confirmação de Reserva (cliente)    | Webhook do banco (`notificar_confirmacao_cliente`, via pg_net) | Pedido de confirmação, confirmação, cancelamento                                                              | Ativo, ajustes de copy publicados (versão `9baadcbf`) |
| Lembrete de Reserva                 | A cada 30 min e 1x/dia às 10h                                  | Lembrete 24 h, aviso 7 dias, aviso 2 dias                                                                     | Ativo, não alterado                                   |
| Avisos de Reserva (dono)            | Webhook do banco                                               | Aviso ao dono                                                                                                 | Ativo, não alterado                                   |

Gatilho no banco: `AFTER INSERT OR UPDATE` em `reservas`. Gera três operações e só elas: `pedir_confirmacao` (INSERT com status pendente), `confirmada` (UPDATE para confirmada) e `cancelada` (UPDATE para cancelada). Respeita `app.skip_cliente_notify`.

## 2. Rastreamento do caso "sim" (final 3303), com execuções reais

Linha do tempo observada em três pares de execuções (20:37, 21:47 e 23:48 de 2026-10-07), sempre o mesmo padrão. Exemplo do último, em milissegundos a partir do "sim":

| t       | Quem                         | O que                                                                                                          |
| ------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 0       | n8n, workflow de atendimento | Recebe "Sim". O regex de resposta curta desvia para o caminho sem IA                                           |
| +0,4 s  | n8n                          | `Confirmar reserva direto` chama `confirmar_reserva_por_codigo`. Status vira `confirmada`                      |
| +0,5 s  | **banco**                    | O UPDATE dispara `notificar_confirmacao_cliente` e o `pg_net` chama o webhook do workflow de confirmação       |
| +0,5 s  | n8n, atendimento             | Envia o **agradecimento fixo** ("Obrigada pela reserva, Nome! ... Ela está confirmada para dd/mm/aa às HH:MM") |
| +0,55 s | n8n, confirmação             | Execução inicia, monta a mensagem com o **template da empresa** e envia                                        |

Resultado: duas mensagens para um "sim", com menos de 1 segundo de diferença, a segunda abrindo com "Olá {nome}, tudo bem?".

## 3. Separação dos problemas

| Problema                      | Veredito                                                                                 | Evidência                                                                                                                                                                                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Copy**                      | Real. A saudação "Olá {nome}, tudo bem?" abre uma mensagem que é continuação de conversa | O payload do webhook traz `mensagem_confirmacao_template` com o texto da empresa: "Olá {nome}, tudo bem? Sua reserva no {empresa} está CONFIRMADA ... Ate breve."                                                                                                 |
| **Origem da copy**            | Dado da empresa, não código                                                              | Coluna `tenants.mensagem_confirmacao` do Iracema (editável em Configurações). O n8n só tem texto padrão para quando a coluna vem vazia, e a coluna tem valor padrão no banco, então o texto padrão do n8n praticamente não é usado em confirmações                |
| **Duplicidade de mensagens**  | Real                                                                                     | Duas mensagens por um "sim": agradecimento (n8n, atendimento) e confirmação (banco para n8n, confirmação). Conteúdo repetido (data e horário nas duas)                                                                                                            |
| **Perda de contexto**         | Real, nas duas pontas                                                                    | A confirmação é um template estático, sem saber que acabou de haver uma resposta do cliente. Nenhuma das duas mensagens entra na conversa do agente                                                                                                               |
| **Memória do agente**         | Real                                                                                     | Nem agradecimento nem confirmação são gravados em `n8n_chat_histories_iracema`. Se o cliente responder "obrigada", o agente não tem histórico. A chave da memória é o telefone de `data.sender`, que pode chegar como `@lid`                                      |
| **Concorrência de workflows** | Existe, sem erro                                                                         | Dois workflows disparados pelo mesmo evento, com início separado por ~0,5 s. A **ordem de chegada não é garantida** (hoje o agradecimento sai primeiro; pode inverter se o webhook do banco for mais rápido). Não há duplicidade de gatilho nem execução repetida |
| **Banco versus n8n**          | Responsabilidades misturadas                                                             | O **banco** dispara confirmação, cancelamento e pedido; o **n8n** responde ao cliente e também confirma por conta própria. A mesma ação (confirmar) tem dois emissores independentes                                                                              |

Descartado com evidência: gatilho duplicado, retry, delay, classificação errada (o regex acertou), janela de contexto do agente (o caminho do "sim" nem passa pelo agente), segredo do webhook (validado nas duas execuções).

## 4. O que a PR #36 já mudou no n8n

Workflow `Confirmação de Reserva (cliente)`. Versões: `019144b5` (original) para `78c0bf73` para **`9baadcbf` (ativa)**.

- `78c0bf73` mudou `{data}` para "Domingo, 11 de outubro" **para todos os templates**. Isso alterou o texto dos templates personalizados do Iracema e de outra empresa (Mambaia: "para Domingo, 11 de outubro as 14:00"). **Era uma regressão**, detectada nesta revisão.
- `9baadcbf` corrige: `{data}` volta a ser exatamente `dd/mm/aa`; o formato por extenso fica em `{data_extenso}` e só os textos padrão do workflow o usam. Verificado com 5 cargas comparando saída antiga e nova: **templates personalizados (Iracema, Mambaia) são byte a byte iguais ao original**; mudam apenas os textos padrão (confirmação padrão, cancelamento padrão, pedido de confirmação).
- Efeito real: **cancelamento** (a coluna `mensagem_cancelamento` é nula, usa o texto padrão): agora "{nome}, sua reserva no X foi cancelada." sem saudação, data por extenso. **Pedido de confirmação**: a linha "Recebemos sua reserva no X." deixa de ser apagada pelo filtro de rótulos vazios (bug antigo) e a data fica por extenso. **Confirmação do Iracema: sem efeito**, porque usa o template da empresa.
- Operação preservada: gatilho, segredo, rotas, credenciais, lógica de escolha de template, normalização de telefone e envio, intactos. Rollback: restaurar `019144b5`.

## 5. Pendente de decisão (residual)

1. **Saudação na confirmação do Iracema.** Está no dado da empresa. Mudança proposta, não aplicada (é texto que a casa escreveu): trocar a abertura por "{nome}, sua reserva no {empresa} está confirmada." mantendo o resto. Comando pronto, com rollback guardado, se o proprietário aprovar:
   `UPDATE tenants SET mensagem_confirmacao = replace(replace(mensagem_confirmacao, 'Olá {nome}, tudo bem?' || E'\n\n' || 'Sua reserva no {empresa} está CONFIRMADA.', '{nome}, sua reserva no {empresa} está confirmada.'), 'Ate breve.', 'Até breve.') WHERE slug = 'iracema';`
2. **Duas mensagens por um "sim".** Remover a conexão `Confirmar reserva direto` para `Enviar agradecimento` deixa só a confirmação do banco. Alternativa: manter o agradecimento e encurtar a confirmação. `confirmar_reserva_sem_notificar` não serve ao n8n (desde a F3 exige usuário autenticado).
3. **Texto padrão do banco para novas empresas** ("Ola {nome}, sua reserva ... foi confirmada ...") e o placeholder de Configurações têm tom de formulário e abrem com "Ola" sem acento. Rever junto com o item 1.
4. **Memória do agente:** gravar agradecimento e confirmação em `n8n_chat_histories_iracema` e normalizar a chave do telefone (dígitos com DDI).
5. **Canal:** a EvolutionAPI usa HTTP por IP e não é a API oficial do WhatsApp Business. Segredo do webhook ainda em texto no nó de validação; webhook de entrada sem autenticação (pendências da F3).

## 6. Voz (Brand System: maître que resolve)

| Mensagem               | Estado                                                            | Ajuste proposto                                                                  |
| ---------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Lembrete 24 h          | "Oi, Nome! 💛 ... Te esperamos! 🙂", "amanhã" fixo, data dd/mm/aa | 1 emoji no máximo, data por extenso                                              |
| Aviso 7 e 2 dias       | "Olá Nome, tudo bem?" abre mensagem que o cliente não pediu       | Abrir pelo assunto ("Sua reserva no X está chegando e ainda não foi confirmada") |
| Agradecimento do "sim" | "Obrigada pela reserva, Nome! 💛 ..."                             | Se mantido, 1 frase                                                              |
| Agente                 | Persona Dona Iracema                                              | Preservada. No Teggly padrão, "Assistente" com ponto azul                        |

Regras de contexto sugeridas: mensagem automática dentro de 10 minutos de uma resposta do cliente não abre com saudação; mensagens automáticas entram no histórico do agente; no máximo 1 emoji por mensagem; datas por extenso; o cliente nunca recebe duas mensagens com o mesmo conteúdo para o mesmo evento.

## 7. Itens verificados sem alteração

Regras de reserva, triggers, RPCs, credenciais, EvolutionAPI, workflows de lembrete e do dono: nenhum foi apagado, substituído ou executado.

## 8. Decisão aplicada: uma mensagem por "sim" (2026-10-08)

Princípio: **a confirmação oficial vem só do banco** (gatilho `notificar_confirmacao_cliente`, com template do tenant, idempotente e por empresa). O atendimento no n8n confirma a reserva e não envia segunda mensagem.

- Workflow `nAlZi521cF2d41xs`, nova versão ativa `4780b6d0` (anterior `93bf32db`, rollback por restauração de versão):
  - removida a ligação `Confirmar reserva direto` para `EvolutionAPI - Enviar agradecimento` (o nó ficou solto, sem uso);
  - quando o agente confirma ou cancela por ferramenta com sucesso, a resposta fixa passou a ser vazia e o novo nó `Tem resposta para enviar?` impede o envio, pois o gatilho do banco já avisa o cliente;
  - demais respostas do agente seguem o mesmo caminho de antes. Erro na confirmação direta continua caindo no agente.
- Dado do Iracema (`tenants.mensagem_confirmacao`): a abertura "Olá {nome}, tudo bem? / Sua reserva no {empresa} está CONFIRMADA." virou "Obrigada pela confirmação, {nome}! 💛 / Sua reserva no {empresa} está confirmada." e "Ate breve." virou "Até breve.". Texto anterior, para rollback: `Olá {nome}, tudo bem?` + linha em branco + `Sua reserva no {empresa} está CONFIRMADA.` e `Ate breve.`
- A versão `9baadcbf` do workflow de confirmação não foi alterada.
- **Não validado com WhatsApp real** (sem disparo de teste). Validar com um "sim" real: deve chegar uma única mensagem.
- Risco conhecido: se o webhook do banco falhar, o cliente fica sem resposta (antes o agradecimento cobria). A execução do workflow de confirmação fica visível no n8n para monitorar.
