# Teggly: auditoria de WhatsApp, voz e contexto

Fase H. Data: 2026-10-08. Leitura dos workflows no n8n (somente leitura, nenhum disparo de teste, nenhum WhatsApp real) e dos gatilhos do banco (`docs/database/LIVE_STATE.md`).

## 1. Mapa

| Workflow | Gatilho | O que envia | Estado |
|---|---|---|---|
| Atendimento WhatsApp (Dona Iracema) | Mensagem recebida (EvolutionAPI) | Resposta do agente (Gemini, memória Postgres por telefone, janela 8) ou, para "sim" curto, agradecimento fixo | Ativo, não alterado |
| Confirmação de Reserva (cliente) | Webhook do banco (`notificar_confirmacao_cliente`) | Pedido de confirmação, confirmação, cancelamento | Ativo, **copy corrigida hoje** |
| Lembrete de Reserva | A cada 30 min e 1x/dia às 10h | Lembrete 24 h, aviso 7 dias, aviso 2 dias (pendentes) | Ativo, não alterado |
| Avisos de Reserva (dono) | Webhook do banco | Aviso ao dono | Ativo, não alterado |

## 2. O caso do "sim" (final 3303): rastreamento

Sequência real, reconstruída a partir dos nós:

1. A cliente responde "sim". O nó `Resposta curta de confirmação?` casa a mensagem por regex (sim, ok, confirmo, etc.) e **não passa pelo agente**.
2. `Buscar reservas pendentes` consulta `reserva_por_telefone_do_tenant`. `Escolher pendente` exige exatamente uma pendente a partir de hoje.
3. `Confirmar reserva direto` chama `confirmar_reserva_por_codigo`. A reserva vira `confirmada`.
4. `Enviar agradecimento` manda: "Obrigada pela reserva, Nome! ... Ela está confirmada para dd/mm/aa às HH:MM. Te esperamos no Iracema!". Essa é a mensagem que "veio certa".
5. **Em paralelo**, o UPDATE disparou o gatilho `trg_reserva_confirmacao_cliente`, que chama o workflow `Confirmação de Reserva (cliente)`. Ele montava o template padrão, que **sempre abria com "Olá {nome}, tudo bem?"**, e enviava.

### Causa raiz

Não é concorrência, nem gatilho duplicado, nem memória do agente. São **dois caminhos independentes** que respondem ao mesmo evento sem saber um do outro. O segundo é um template estático: não sabe que a cliente acabou de responder e abre como se fosse o primeiro contato.

Verificações feitas e descartadas: duplicidade de trigger (há um gatilho de confirmação por UPDATE), delay (o envio é imediato), classificação (a regex acertou), payload (o webhook entrega `op = confirmada`), janela de contexto (o caminho do "sim" nem usa o agente).

### Agravantes encontrados

1. **Mensagens automáticas não entram na memória do agente.** Nem o agradecimento nem a confirmação são gravados em `n8n_chat_histories_iracema`. Se a cliente responder "obrigada", o agente não tem histórico e pode se apresentar de novo ("Oi! Eu sou a Dona Iracema").
2. **Chave da memória.** O telefone vem de `data.sender`, que pode chegar como `@lid`. A mesma pessoa pode ter dois históricos.
3. **Filtro de rótulos vazios.** O nó remove linhas só com letras terminadas em ":" (para limpar "Tipo:" vazio). Isso apagava "Recebemos sua reserva no Iracema:" do pedido de confirmação. Pré-existente.
4. Datas em `dd/mm/aa`, fora do padrão da marca ("Sábado, 20 de janeiro").

## 3. O que foi alterado (somente copy, publicado)

Workflow `Confirmação de Reserva (cliente)`, versão `78c0bf73`. Rollback: restaurar `019144b5`.

- Confirmação padrão: de "Olá {nome}, tudo bem? Sua reserva no {empresa} está CONFIRMADA." para "{nome}, sua reserva no {empresa} está confirmada." Continua a conversa em vez de recomeçar.
- Cancelamento padrão: mesmo princípio ("{nome}, sua reserva no {empresa} (código X) foi cancelada.").
- Datas por extenso: "Terça-feira, 20 de janeiro".
- "Recebemos sua reserva no {empresa}." deixa de ser removida pelo filtro.
- O pedido de confirmação (primeiro contato, cliente acabou de reservar pelo site) mantém a saudação, porque ali ela faz sentido.
- Intactos: templates personalizados da empresa (`mensagem_confirmacao_template`, `mensagem_cancelamento_template`), gatilhos, segredo do banco, rotas, credenciais, regras de reserva.

Testado localmente com o código do nó em Node, com seis cargas (confirmada completa, sem endereço e tipo, pedido, cancelada com motivo, template da empresa, data fora do padrão). Nada foi enviado.

## 4. Propostas que mudam estrutura (não aplicadas, precisam de decisão)

1. **Uma resposta só ao "sim".** Hoje saem duas (agradecimento e confirmação com dados). Opção recomendada: desligar a conexão `Confirmar reserva direto` para `Enviar agradecimento` e deixar apenas a confirmação do banco, agora sem saudação. Alternativa: manter o agradecimento e encurtar a confirmação. `confirmar_reserva_sem_notificar` não serve ao n8n: desde a F3 exige usuário autenticado.
2. **Gravar as mensagens automáticas na memória.** Inserir agradecimento e confirmação em `n8n_chat_histories_iracema` com a chave do telefone, para o agente ter o contexto da conversa.
3. **Normalizar a chave da memória** para dígitos com DDI, resolvendo `@lid`.
4. **Reconfirmar o canal.** A EvolutionAPI usa HTTP por IP e não é a API oficial do WhatsApp Business. Risco de bloqueio de número e de tráfego sem criptografia.
5. **Segredo do webhook** ainda comparado em texto no nó "Validar segredo do banco". Mover para credencial Header Auth.
6. **Webhook de entrada do WhatsApp** sem autenticação (pendência da F3).

## 5. Voz (Brand System: maître que resolve)

| Mensagem | Estado | Ajuste proposto |
|---|---|---|
| Lembrete 24 h | "Oi, Nome! 💛 ... Te esperamos! 🙂", texto fixo "amanhã", data em dd/mm/aa | 1 emoji no máximo; data por extenso; manter "não precisa responder" |
| Aviso 7 dias e 2 dias | "Olá Nome, tudo bem?" abre uma mensagem que o cliente não pediu; usa o rótulo de "confirmação" | Abrir com o assunto ("Sua reserva no X está chegando e ainda não foi confirmada"); pedir "SIM" |
| Agradecimento do "sim" | "Obrigada pela reserva, Nome! 💛 Ela está confirmada..." | Se for mantido, 1 frase |
| Agente | Persona Dona Iracema, "Oi! 💛 Eu sou a Dona Iracema" | Persona da casa, preservada; no Teggly-padrão, "Assistente" (ponto azul) |

Regras de contexto sugeridas (WhatsApp):

1. Mensagem automática enviada dentro de 10 minutos de uma resposta do cliente não abre com saudação.
2. Mensagem automática vira parte do histórico do agente.
3. Máximo de 1 emoji por mensagem; nenhum no painel e no site.
4. Datas por extenso ("Sábado, 20 de janeiro, às 20:00").
5. O cliente nunca recebe duas mensagens com o mesmo conteúdo para o mesmo evento.

## 6. Itens verificados sem alteração

Regras de reserva, triggers, RPCs, credenciais, EvolutionAPI, workflows de lembrete e do dono: nenhum foi apagado, substituído ou executado.
