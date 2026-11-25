# WhatsApp do Iracema (n8n): cópia de referência e procedimento de edição

Workflow de produção: **Iracema - Atendimento WhatsApp (Dona Iracema)**, id `nAlZi521cF2d41xs`
(`https://n8n.bauerlab.com.br/workflow/nAlZi521cF2d41xs`).

Em 24 a 26/10/2026 uma edição concorrente sobrescreveu, sem aviso, a ferramenta de eventos em
destaque e a base de conhecimento que já estavam publicadas. A causa foi uma sessão que editou a
partir de uma cópia antiga do workflow. Este documento existe para que isso não se repita e, se
repetir, para restaurar em minutos.

## Procedimento obrigatório para editar o workflow

1. **Ler o estado atual imediatamente antes de editar** (`get_workflow_details`) e conferir
   `versionId`. Não reaproveitar uma leitura feita antes de outra sessão ter mexido.
2. **Editar com operações pontuais** (`update_workflow` com `addNode`, `setNodeParameter`,
   `addConnection`). Nunca recriar o workflow inteiro nem restaurar uma versão antiga por cima.
3. **Publicar** (`publish_workflow`) e conferir no `get_workflow_history` que a versão mais
   recente é a mesma de `activeVersionId`.
4. **Reler o workflow depois de publicar** e conferir os itens da lista de invariantes abaixo.
5. Se a mudança alterar a base de conhecimento ou um nó listado aqui, **atualizar este arquivo
   no mesmo PR**. Ele é a cópia de recuperação; a fonte em produção é o n8n.
6. Nunca usar "restaurar versão" sem comparar antes com a versão ativa
   (`get_workflow_versions_diff`): restaurar apaga tudo que foi feito depois.

## Invariantes (conferir após qualquer edição)

- O agente **Dona Iracema (Agente)** tem estas ferramentas ligadas (`ai_tool`):
  Base de conhecimento do Iracema, Consultar reservas do cliente, Confirmar reserva (sistema),
  Cancelar reserva (sistema), **Alterar reserva (sistema)**, Consultar agenda (bloqueios e
  lotacao), **Consultar eventos em destaque**, Avisar dono: cupom de aniversariante e
  **Avisar equipe (pedido que o sistema nao resolve)**.
- Entre "É mensagem válida?" e "Pedido claro de cancelamento?" existe a cadeia do Teggly:
  Registrar mensagem (buffer) → IA ligada e mensagem nova? → Aguarda agrupar mensagens (6 s) →
  Coletar mensagens agrupadas → Sou a ultima mensagem? → Mensagem agrupada. Ela faz duas coisas:
  respeita o botão de **ligar/desligar a IA** do painel (geral ou por conversa) e junta mensagens
  seguidas da mesma pessoa em **uma** resposta (antes cada mensagem disparava uma execução e uma
  resposta, e elas se repetiam). O texto do agente vem de `$('Mensagem agrupada')`.
- Base de conhecimento, seção 20: todo sábado tem música ao vivo a partir das 13h30, casa abre
  às 12h e funciona até 19h (desde 29/10/2026), e a escalação de cada sábado fica no Instagram `@iracemabh`.
- Horário-limite de reserva **não é mais texto fixo na base** (18/11/2026): a seção 5 manda usar o
  bloco `DADOS AO VIVO DO TEGGLY`, que `base_conhecimento_final()` anexa ao fim da base lendo
  `tenants.horario_limite_semana`, `horario_limite_sabado`, `horario_limite_fim_semana` e os
  feriados. Mudou o horário no painel, a Iracema já responde certo. Nunca escrever horário-limite
  na base.
- Almoço de sábado e domingo: 12h às 15h, exceto em dias de evento ou com a casa fechada.
- **Sem almoço em 20/11/2026 (Roda da Boua) e 28/11/2026 (Pagode do Sonic)** (20/11/2026): a casa
  abre só para o evento, sem almoço nem funcionamento comum, mesmo sendo sexta e sábado. A regra
  está na seção 5 e nos blocos de 20/11 e 28/11 da seção 23 (migration
  `20261120120000_b7e3a1c5-9d24-4f68-8a0e-3c5d7f9b1e26.sql`). Ao remover esses blocos depois dos
  eventos, remover também a frase da seção 5.
- Linktree **não é mais usado**: delivery e links vão pelo link hub `/iracema/links`.
- O nó "Carregar base de conhecimento" chama `base_conhecimento_final('iracema')` e devolve também
  `dominio` (`ia_agente_config.dominio_publico`). Todos os links teggly da base e o link de
  acompanhamento do prompt usam esse domínio. Desde 21/11/2026 é `https://teggly.com.br`; para trocar de novo
  basta `UPDATE ia_agente_config SET dominio_publico = ... WHERE
  tenant_slug = 'iracema'`, sem editar o workflow.
- Base de conhecimento não contém evento com data fixa já vencida (ex.: Baticum de 11/10/2026).
  Eventos com data vêm da ferramenta, não do texto. Exceção deliberada: a seção 23 traz datas
  específicas (14/11/2026 e Roda da Boua em 20/11/2026) a pedido da equipe. Cada bloco tem a
  data no título e deve ser removido depois do evento; o mesmo evento também precisa estar
  cadastrado em "Destacar no site" (painel, Atrações) para a ferramenta trazer.
- `REGRA DE SAUDACAO` no texto do agente (não repetir saudação na mesma conversa).
- Nós que dependem do telefone usam `$('Extrair mensagem').first().json.telefone`.

## Ferramenta "Consultar eventos em destaque"

Nó `n8n-nodes-base.postgresTool` (typeVersion 2.7), credencial `Postgres account`
(id `3SqHeTZFR2TlbbtY`), ligado ao agente como `ai_tool`.

```sql
SELECT COALESCE(json_agg(t), '[]'::json) AS eventos
FROM (
  SELECT titulo, descricao, data::text AS data, horario::text AS horario,
         horario_fim::text AS horario_fim, tipo
  FROM public.eventos_em_destaque_do_tenant('iracema')
) t
```

`toolDescription`: atrações e eventos especiais futuros cadastrados pela equipe (os mesmos da
página de reservas); retorna até 10 eventos em ordem de data; lista vazia significa que não há
evento especial cadastrado (a música ao vivo de todo sábado continua valendo); usar somente o que
vier da ferramenta, converter datas para DD/MM/AA e nunca inventar artista, horário ou couvert.

A função `eventos_em_destaque_do_tenant` está em
`supabase/migrations/20261024150000_b8e2c4a6-7d1f-4a93-8c5e-6f3a9d1b2e47.sql`. Ela lê
`eventos_destaque`, alimentada pelo botão **Destacar no site** da página Atrações do painel.

## Base de conhecimento (cópia de referência em 26/10/2026)

Conteúdo do nó **Base de conhecimento do Iracema** (`toolCode`, retorna o texto abaixo).

### Identidade e dados permanentes

- Iracema Bistrô Bar: restaurante, bar e espaço para eventos em um casarão dos anos 50, no
  coração de Santa Tereza. Conceito: comida, encontros e história no Santa Tereza.
- Endereço: Rua Almandina, 56, Santa Tereza, Belo Horizonte - MG, CEP 31010-080.
- Horário: segunda a sexta 11h às 15h; sábado 12h às 19h (com música ao vivo a partir das 13h30);
  domingo 12h às 17h. Almoço de sábado e domingo: 12h às 15h, exceto em dia de evento ou casa fechada. Sujeito a alteração por eventos e feriados
  (seção 23).

### Pratos da semana

Segunda: parmegiana de frango, arroz branco e batata chips. Terça: costelinha ao molho
barbecue, batatas rústicas e arroz branco. Quarta e sábado: filé de tilápia, arroz branco,
brócolis na manteiga e purê de batatas. Quinta: sobrecoxa desossada, tutu de feijão, maionese de
batata e arroz branco. Sexta: feijoada, arroz branco, farofa, couve com alho, vinagrete e
laranja. Domingo: rabada, batata cozida, agrião, salada e arroz, R$ 37,90. Também: PF Iracema,
salada Caesar, talharim na manteiga e outras opções do cardápio. Não inventar prato, acompanhamento
ou preço; em feriado com horário especial, não presumir o prato.

### Regras da casa

- Cardápio: `https://teggly.com.br/iracema/cardapio`. Reservas: `https://teggly.com.br/iracema`.
  Perguntar antes de enviar qualquer link. Nunca afirmar disponibilidade sem confirmação.
- Espaços: Salão, Fundos, Corredor e Varanda; preferência não é garantia.
- Grupos a partir de 15 pessoas: comanda individual; não confundir com evento particular.
- Aniversário: aniversariante da semana ganha 1 drink ou 1 sobremesa; 10% da comanda vira
  cashback; pode levar bolo.
- Eventos particulares: mínimo 50, máximo 180 pessoas, 5 horas; petiscos (carne de panela com
  pãozinho, bolinho de linguiça, chips de jiló, batata frita, harumaki de carne de panela) e
  bebidas (água mineral, água gasosa, Eisenbahn, Guaraná, Coca-Cola normal/zero); pacotes de
  R$ 110, 160, 180 e 200 por pessoa; couvert artístico de banda R$ 10/pessoa quando aplicável;
  pagamento 50% na reserva e 50% no dia. Mínimo de 50 pessoas não é negociável pela IA (atualizado
  em 25/11/2026, removido o item "coxinha de moranga com rabada" dos petiscos). Grandes eventos:
  Simone, +55 31 98801-0243 (não passar para reserva comum).
- Pets: bem-vindos na varanda ou no fim do corredor (não garantir). Crianças: espaço na varanda.
  Casa acessível. Mesas externas existem (sem garantia). Wi-Fi disponível.
- Estacionamento: sem próprio, vagas na rua em frente (não garantir).
- Pagamento: VR, débito e crédito; comanda individual. Couvert R$ 10,00, opcional.
- Vegetariano e vegano: há opções; proteína vegana informada é a linguiça de cogumelos defumada
  da Cogumelado.
- Delivery: iFood e 99Food, reunidos no link hub `/iracema/links` (Linktree aposentado em 18/11/2026).
- Artistas: formulário `https://forms.gle/ZWDVHa6W7NeTx5Dr8`; a equipe responde se houver interesse.

### Seção 20: música e agenda

Todo sábado tem música ao vivo no Iracema, a partir das 13h30, e aos sábados a casa abre às 12h.
A agenda de artistas é divulgada no Instagram `@iracemabh`: indicar o Instagram e nunca inventar
artista, banda ou estilo de um sábado específico. Samba é um dos gêneros que mais toca. Atrações
e eventos especiais com data vêm da ferramenta **Consultar eventos em destaque**; se ela trouxer
algo para a data perguntada, informar também, sem inventar couvert, duração ou horário.

### Seção 23: horários especiais

Feriado de 12/10/2026: a casa abre com horário de fim de semana, 12h às 17h (informação válida só
para essa data). Eventos com data passada nunca são apresentados como futuros. Qualquer outro dado
que mude (pratos especiais, promoções, condições comerciais) segue a informação mais recente da
equipe; sem registro, não inventar.

Sábado 14/11/2026 (atualizado em 29/10/2026): casamento às 16h, sem reservas (agenda já bloqueada
no sistema) e sem almoço no salão: o almoço desse dia é somente por delivery (iFood e 99Food), das
12h às 15h. A casa não recebe clientes para sentar, com ou sem reserva. Iracema explica isso com
gentileza, oferece o link hub (perguntando antes), não envia link de reserva para essa data, não
fala de detalhes do casamento nem de música ao vivo nesse dia. A seção 20 e a seção "Atrações e
eventos especiais" citam a exceção. Depois de 14/11/2026 esse bloco pode ser removido da base.

Sexta 20/11/2026 (feriado, atualizado em 04/11/2026): Roda da Boua. Condição especial de
aniversariante: aniversariante off; +10 nomes na lista amiga, off até as 15:30h; +2 Xeque-Mates
para o aniversariante; 20% de desconto na compra de ingresso para os demais convidados (cupom próprio pedido no
Instagram do evento). A Iracema não inventa horário de início, atração, preço de ingresso nem line-up. Depois de
20/11/2026 esse bloco sai da base.

Sábado 28/11/2026: Pagode do Sonic, só com ingresso e sem reservas (início 16h). Condição especial
de aniversariante: aniversariante off; +10 nomes na lista amiga, off até as 17:30h; +2 Xeque-Mates
para o aniversariante; 20% de desconto na compra de ingresso para os demais convidados (cupom
próprio pedido no Instagram do evento). Depois de 28/11/2026 esse bloco sai da base.

Nota (11/11/2026): o texto da base não vive no n8n, e sim na tabela `ia_base_conhecimento`
(`tenant_slug = 'iracema'`), lida pela função `base_conhecimento_do_tenant`. Alterações de conteúdo
são `UPDATE` nessa tabela (ver `supabase/migrations/20261111120000_*.sql`); não exigem republicar
o workflow.

Limpeza automática (11/11/2026): a função `ia_base_limpar_blocos_vencidos()` roda todo dia às
00:10 de Brasília (job pg_cron `ia-base-limpar-blocos-vencidos`; migration
`supabase/migrations/20261111140000_*.sql`). Ela apaga da base todo bloco `## ...` cujo título
traga uma data DD/MM/AAAA já passada e, depois de 14/11/2026, as menções soltas ao fechamento
desse dia nas seções 20 e "Atrações". Para um bloco sair sozinho, **o título precisa ter a data
completa** (ex.: `## Sábado 28/11/2026 - ...`). Não é preciso remover blocos de data à mão.

Roda da Boua e Pagode do Sonic também estão em "Destacar no site" (`eventos_destaque`), com os
links de ingresso e da lista amiga na descrição; a página de reservas transforma URLs da descrição
em links clicáveis.

Regra de mesa em evento com ingresso (12/11/2026): a seção 5 e os blocos de 20/11 e 28/11 dizem que
nesses dias não existe mesa garantida, reservada ou separada, nem para quem tem ingresso. Motivo:
a Dona Iracema chegou a dizer a uma cliente que ela tinha mesa garantida em 20/11. Migration
`supabase/migrations/20261112120000_*.sql`. A frase da seção 5 é genérica e permanece depois dos
eventos.

Aplicado em produção em 12/11/2026. Existem 2 reservas confirmadas de aniversário em 20/11 (criadas
antes do bloqueio da agenda); por isso a regra manda o agente nem negar nem garantir mesa quando a
consulta mostrar reserva nesses dias, e passar para a equipe.

## Teggly manda na Iracema (18/11/2026)

Migration `supabase/migrations/20261118200000_*.sql`.

- **Liga/desliga a IA**: tabelas `ia_agente_config` (geral) e `ia_conversa_pausa` (por telefone,
  chave = últimos 8 dígitos). Painel: Configurações > Atendente de WhatsApp e tela Clientes (chave
  geral e botão por cliente). Desligada, ela não responde nada, nem confirmação ou cancelamento por
  mensagem; avisos automáticos do sistema continuam. Funções: `ia_whatsapp_estado`,
  `ia_whatsapp_definir_global`, `ia_whatsapp_definir_conversa` (painel) e
  `ia_whatsapp_deve_responder` (n8n).
- **Agrupar mensagens**: `ia_msg_buffer`, `ia_buffer_add` e `ia_buffer_coletar`. Só a execução da
  mensagem mais recente do telefone responde, levando todas juntas. Webhook duplicado (mesmo
  `key.id`) é descartado.
- **Alterar reserva pela Iracema**: `agente_alterar_reserva(slug, telefone, codigo, data, horario,
  quantidade, area, observacoes)`. O telefone vem do WhatsApp (só altera reserva do próprio
  número), com as mesmas regras do site (limite de horário, agenda bloqueada, lotação). Evento,
  casamento e grupo acima de 30 pessoas devolvem `PRECISA_EQUIPE`, e a Iracema chama "Avisar equipe".
  Ao mudar a data, os avisos e lembretes automáticos da reserva são reiniciados. O gatilho
  `notificar_mudanca_reserva` continua avisando o dono.
- Repetição de resposta: causa era uma execução por mensagem em paralelo (5 mensagens em 33 s
  geraram 5 respostas, todas com o contato da Simone e a mesma pergunta). Resolvida pelo buffer.
- Não dá para detectar "um humano respondeu no WhatsApp" pelo webhook: mensagens enviadas pela API
  também chegam com `fromMe` e `source: web`. Por isso a pausa é manual.

## Auditoria e correções de 25/11/2026

- **Brecha fechada: reserva grande fora do horário sem revisão da equipe.** Um cliente
  conseguiu reservar mesa (não evento) para 70 pessoas fora do horário de funcionamento e a
  própria Dona Iracema confirmou pelo WhatsApp sem nenhuma revisão humana. A causa era
  `criar_reserva`: o corte de horário só valia para `quantidade <= 30`. Agora qualquer reserva
  (mesa, aniversário etc., não só evento) com **mais de 30 pessoas fora do horário normal do
  dia** continua sendo aceita (para não perder o cliente), mas entra como `tipo_evento =
  'Evento - A negociar'` e `reservas.confirmacao_manual_necessaria = true`.
  `confirmar_reserva_por_codigo` (usada pelo cliente e pela IA) passa a rejeitar a confirmação
  dessa reserva com o erro `RESERVA_PRECISA_CONFIRMACAO_MANUAL_DA_EQUIPE` — só a equipe confirma,
  direto no Teggly (update de status ali não passa por essa função, continua liberado).
  Migration `supabase/migrations/20261125120000_*.sql`.
- **Horários especiais por data** (`public.horarios_especiais`): nova tabela reaproveitável
  para substituir o horário-limite normal numa data específica. Primeiro uso: quarta-feira
  23/12/2026, funcionamento estendido até as 18h (último dia antes da pausa entre Natal e
  Réveillon). `criar_reserva`, `agente_alterar_reserva` e o bloco `DADOS AO VIVO DO TEGGLY`
  (`ia_contexto_ao_vivo`) já leem essa tabela.
- **Base de conhecimento (seção 9, eventos particulares):** removido o item "coxinha de
  moranga com rabada" dos petiscos (lista oficial atual não o inclui) e reforçada a regra de
  nunca aceitar evento particular com menos de 50 pessoas, com orientação de fechamento de
  vendas. Seção 23 ganhou o bloco da quarta-feira 23/12/2026 (horário estendido + aviso de
  pausa entre Natal e Réveillon, sem data de reabertura cadastrada).
- **Agente mais autônomo, menos avisos à equipe.** ⚠️ *Correção de 25/11/2026 (etapa 3): esta
  edição foi descrita aqui como publicada em 25/11/2026, mas **nunca aplicou de fato** — o
  `setNodeParameter` usou o path `/parameters/systemMessage` (errado; deveria ser
  `/systemMessage`) e o prompt em produção ficou byte-a-byte idêntico ao original até ser
  corrigido na etapa 3, quando a publicação foi verificada lendo o texto realmente armazenado,
  não só o retorno de sucesso da chamada. Lição: depois de qualquer `setNodeParameter` em
  `systemMessage`, reler o valor armazenado antes de considerar aplicado.* O prompt
  (`systemMessage` do nó **Dona Iracema (Agente)**) não documentava as ferramentas `Alterar
  reserva (sistema)`, `Consultar eventos em destaque` e `Avisar equipe (pedido que o sistema nao
  resolve)` — o agente escalava por precaução em vez de resolver sozinho. Agora o prompt cobre as
  8 ferramentas ligadas ao
  agente, deixa explícito que `Avisar equipe` é só para os casos que as outras ferramentas não
  resolvem (evento/casamento/>30 pessoas, reclamação que precisa de decisão humana, reserva
  "Evento - A negociar"), e adiciona uma seção de fechamento/vendas (conduzir até o fechamento,
  nunca contradizer o mínimo/máximo de evento particular).
- **Novo workflow separado: "Iracema - Grupo de reservas (WhatsApp)"**
  (`https://n8n.bauerlab.com.br/workflow/eHpDcrwZnHeWs92I`, id `eHpDcrwZnHeWs92I`). A cada
  minuto, lê `public.notificacoes_grupo_reservas` (fila alimentada pelo trigger
  `trg_notificar_grupo_reservas` em `public.reservas`, migration
  `supabase/migrations/20261125121000_*.sql`) e manda para o grupo
  `120363042936295967@g.us` duas mensagens: o resumo da mudança (nova reserva confirmada,
  cancelamento de reserva confirmada, ou alteração de reserva confirmada) e a lista completa de
  reservas confirmadas atualizadas (`public.lista_reservas_confirmadas_grupo`). Reserva que
  nunca foi confirmada não gera aviso. Título da lista é `DD/MM/AAAA HH:MM` (sem segundos).
  **Ativado em produção em 25/11/2026**, após a equipe revisar e aprovar o texto das duas
  mensagens.

## Correções de 25/11/2026 (etapa 2: concorrência, formato e regras)

Tudo validado antes em transações com `ROLLBACK` e, no caso do workflow, com `test_workflow`
(dados simulados) — nenhuma mensagem de teste foi enviada ao grupo real, nenhuma reserva real
foi usada.

- **Trava de concorrência**: "Buscar notificacoes pendentes" deixou de ser um `SELECT` simples e
  passou a ser um `UPDATE ... RETURNING` com `FOR UPDATE SKIP LOCKED`, marcando `processando_em`
  nas linhas escolhidas. Uma segunda execução nunca pega as mesmas linhas (testado com claim
  duplo numa tabela de rascunho isolada: split exato, zero sobreposição). Trava expira em 3
  minutos para recuperar execuções que falharam no meio do processamento.
- **Controle de envio por mensagem**: `enviado`/`enviado_em` saíram de uso (mantidas na tabela só
  por compatibilidade, nunca removidas) em favor de `resumo_enviado` e `lista_enviada`,
  independentes. Uma notificação só é dada como concluída quando as duas são `true`. Risco
  residual conhecido e não eliminado: se o envio HTTP de uma mensagem tiver sucesso mas a
  execução cair antes do `UPDATE` que marca a flag, um reenvio é possível depois que a trava
  expira — janela mínima, mas existe.
- **Agrupamento de alterações**: o trigger `ia_notificar_grupo_reservas` agora faz `UPDATE` numa
  notificação `'alterada'` ainda pendente (nenhuma das duas mensagens enviada) da mesma reserva,
  em vez de inserir uma nova linha a cada `UPDATE` de `reservas`. Guarda o estado de antes da
  primeira alteração (`estado_antes_texto`) e sempre recalcula o resumo contra o estado mais
  recente. Se a notificação já tiver sido totalmente enviada, a próxima alteração cria uma nova.
- **Formato da mensagem da lista**: reescrito para o padrão da equipe — cabeçalho
  `*RESERVAS <DIA DA SEMANA> <DD/MM>*` + `*<LOCAL ou "SEM LOCAL DEFINIDO">*`, agrupado por
  (data, área), com Nome/Data/Quantidade de pessoas/Horário/Telefone/Observação por reserva.
- **Reserva fora do horário, qualquer quantidade**: `criar_reserva` não bloqueia mais nenhuma
  reserva fora do horário normal (antes só bloqueava até 30 pessoas) — toda reserva fora do
  horário vira `"Evento - A negociar"` (`confirmacao_manual_necessaria = true`), sem exceção de
  tamanho.
- **Mínimo/máximo de evento particular no banco**: `criar_reserva` agora rejeita `_tipo = 'evento'`
  com menos de 50 ou mais de 180 pessoas, direto na função (antes só existia como texto na base
  de conhecimento e na UI, sem validação real). **Pendência registrada, não implementada**: o
  formulário do site (`$slug.reservar.$tipo.tsx`) ainda mostra a mensagem genérica "Não foi
  possível enviar sua reserva. Tente novamente." para esse erro, e o campo de quantidade não tem
  limite visual — melhorar isso é uma etapa futura, por decisão da equipe.
- **`agente_alterar_reserva` alinhada com `criar_reserva`**: alterar uma reserva confirmada para
  fora do horário (qualquer quantidade) não aplica mais a mudança direto nem devolve só um erro
  de rejeição — a reserva original fica **intacta e confirmada**, e o pedido de mudança entra em
  `public.alteracoes_pendentes` (nova tabela, uma linha pendente por reserva) aguardando a equipe
  aplicar manualmente no Teggly. Retorno passou a ser `ALTERACAO_PRECISA_CONFIRMACAO_MANUAL_DA_EQUIPE`.
- Migration: `supabase/migrations/20261125130000_iracema_grupo_concorrencia_e_regras.sql`.

## Etapa 3 de 25/11/2026: prompt trata `ALTERACAO_PRECISA_CONFIRMACAO_MANUAL_DA_EQUIPE`

Ao preparar esse ajuste, descobri que a edição da etapa 1 (ver nota acima) nunca tinha aplicado —
o prompt em produção estava idêntico ao original, sem nenhuma das 8 ferramentas documentadas.
Esta etapa corrigiu o path e, junto, adicionou o tratamento pedido para a alteração de reserva:

- Nova seção **"Alteracao de reserva que precisa de confirmacao manual da equipe"**: quando
  `Alterar reserva (sistema)` devolve `ALTERACAO_PRECISA_CONFIRMACAO_MANUAL_DA_EQUIPE`, o prompt
  manda a Dona Iracema (a) nunca dizer que a alteração ou a reserva foram confirmadas, (b) nunca
  dizer que a equipe já aprovou, (c) explicar que a reserva atual continua válida enquanto a
  equipe avalia, (d) chamar `Avisar equipe` uma única vez por pedido (nunca duplicar o aviso na
  mesma conversa), (e) nunca tentar contornar chamando `Alterar reserva` de novo com outros
  dados, nunca cancelar a reserva original, nunca criar uma reserva nova no lugar, (f) nunca
  prometer prazo de retorno não definido nas regras da casa, (g) nunca confundir isso com uma
  reserva nova de evento particular (o mínimo/máximo de 50/180 é só para evento novo).
- A busca por um mecanismo automático que já encaminhasse esse caso para a equipe não achou
  nenhum: `alteracoes_pendentes` não tem trigger, e nenhum trigger de `reservas` dispara nesse
  ramo da função (ela retorna antes de qualquer `UPDATE` em `reservas`). `Avisar equipe` (chamada
  pelo agente) é a única notificação possível hoje — sem risco de duplicidade pelo lado do banco.
- Publicado e verificado lendo o `systemMessage` realmente armazenado na versão ativa (não só o
  retorno de sucesso), confirmando que o texto publicado é idêntico ao pretendido e que as 8
  ferramentas continuam ligadas ao agente.
- Teste dos cenários A-E foi uma revisão lógica do texto do prompt contra cada caso pedido, não
  uma execução real do modelo: executar o agente de verdade exigiria rodar o webhook de produção
  e chamaria ferramentas reais (inclusive `Avisar equipe`, que manda WhatsApp real), o que a
  tarefa pediu para evitar.

## Correções de 21/11/2026

- **Lembrete de 24h dizia "amanhã" para reserva de hoje.** O texto tinha "amanhã" fixo e a consulta
  traz reservas das próximas 24h (inclui hoje). Agora "Montar mensagem" e "Montar aviso 2 dias"
  calculam hoje/amanhã/data por `$now.setZone('America/Sao_Paulo')`. Nunca escrever "amanhã" fixo.
- O bloco `DADOS AO VIVO DO TEGGLY` traz `HOJE é dd/mm/aaaa e AMANHÃ é ...` (Brasília) e os feriados
  usam a data de Brasília (antes `current_date` em UTC).
- Domínio voltou para `https://teggly.com.br`: `ia_agente_config`, base, aviso de 7 dias,
  confirmação (nó "Dominio oficial (teggly.com.br)") e prompt do Instagram.
- Liga/desliga da IA testado no banco: desligada não grava nem responde; ao religar, a próxima
  mensagem é gravada e coletada normalmente (`ia_buffer_add` + `ia_buffer_coletar`).
