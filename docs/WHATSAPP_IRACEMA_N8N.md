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
  Cancelar reserva (sistema), Consultar agenda (bloqueios e lotacao) e
  **Consultar eventos em destaque**.
- Base de conhecimento, seção 20: todo sábado tem música ao vivo a partir das 13h30, casa abre
  às 12h, e a escalação de cada sábado fica no Instagram `@iracemabh`.
- Base de conhecimento não contém evento com data fixa já vencida (ex.: Baticum de 11/10/2026).
  Eventos com data vêm da ferramenta, não do texto.
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
- Horário: segunda a sexta 11h às 15h; sábado 12h às 17h (com música ao vivo a partir das 13h30);
  domingo 12h às 17h. Sujeito a alteração por eventos e feriados (seção 23).

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
- Eventos particulares: mínimo 50, máximo 180 pessoas, 5 horas; pacotes de R$ 110, 160, 180 e
  200 por pessoa; couvert artístico de banda R$ 10/pessoa quando aplicável; pagamento 50% na
  reserva e 50% no dia. Grandes eventos: Simone, +55 31 98801-0243 (não passar para reserva comum).
- Pets: bem-vindos na varanda ou no fim do corredor (não garantir). Crianças: espaço na varanda.
  Casa acessível. Mesas externas existem (sem garantia). Wi-Fi disponível.
- Estacionamento: sem próprio, vagas na rua em frente (não garantir).
- Pagamento: VR, débito e crédito; comanda individual. Couvert R$ 10,00, opcional.
- Vegetariano e vegano: há opções; proteína vegana informada é a linguiça de cogumelos defumada
  da Cogumelado.
- Delivery: iFood e 99Food, reunidos em `https://linktr.ee/iracemabh`.
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

Sábado 14/11/2026 (adicionado em 29/10/2026): casamento às 16h, sem reservas (agenda já bloqueada
no sistema). Almoço por ordem de chegada, sem reserva, das 12h às 15h; iFood e 99Food também das
12h às 15h. Iracema não envia link de reserva para essa data, não diz que a casa está fechada o
dia todo, não fala de detalhes do casamento e não afirma a música ao vivo habitual desse sábado
(diz que precisa confirmar). A seção 20 e a seção "Atrações e eventos especiais" citam a exceção.
Depois de 14/11/2026 esse bloco pode ser removido da base.
