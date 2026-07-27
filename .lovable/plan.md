
## Diagnóstico atual (rodei checagens no banco antes de planejar)

- **Tenants**: apenas `iracema` cadastrado (id `13bb5e82…`) e ativo — **preservar**.
- **Reservas**: 6 registros existentes, todos vinculados ao Iracema — **preservar**.
- **Causa raiz do BUG 3 e do BUG 4 (não é sessão, é permissão)**: as tabelas `reservas`, `tenants`, `push_subscriptions` e `user_roles` **não têm GRANT para anon nem authenticated**. Sem esses GRANTs o PostgREST (a API que o navegador usa) devolve permission denied para qualquer chamada — RLS por si só não basta. Isso também explica por que só funciona em ambientes muito específicos (algum cache/sessão residual) e falha em navegador limpo/anônimo.
- **BUG 1 (env do Supabase)**: as chaves estão no `.env` do projeto, mas o erro aparece em runtime. Vou validar que o build publicado está carregando `VITE_SUPABASE_URL/PUBLISHABLE_KEY` corretamente; se estiver stale, republicar resolve. Não vou trocar as credenciais.

## Regras de segurança

- Nenhuma migração fará `DELETE` ou `TRUNCATE`. Toda mudança em `reservas` é aditiva.
- Antes e depois de cada migração eu conto as reservas do Iracema e valido `SELECT COUNT(*)`.
- O cadastro do Iracema como primeira empresa no master **já existe** — não vou recriar. Vou apenas garantir que o login novo (`iracemabarbh@gmail.com` / senha provisória `123456`, com "trocar no primeiro acesso") esteja vinculado ao tenant Iracema existente.

## Fases (executo em ordem, cada fase é publicável)

### Fase A — Correções críticas de produção (bloqueiam uso hoje)

1. **Migração de GRANTs (base para tudo funcionar)**
   - `GRANT INSERT` em `reservas` para `anon` (clientes fazem reserva sem login) — WITH CHECK já limita a tenants ativos.
   - `GRANT SELECT, INSERT, UPDATE, DELETE` em `reservas` para `authenticated` (admin do tenant + super_admin).
   - `GRANT SELECT` em `tenants` para `anon` (home pública do tenant precisa ler nome/config).
   - `GRANT SELECT, INSERT, UPDATE, DELETE` em `tenants`, `user_roles`, `push_subscriptions` para `authenticated`.
   - `GRANT ALL` em todas as tabelas para `service_role` (para as server functions).
   - `GRANT EXECUTE` nas funções `get_reserva_by_codigo` e `update_reserva_by_codigo` para `anon` e `authenticated`.
   - **Resolve BUG 3, BUG 4 e destrava BUG 2.**

2. **BUG 1 — env**: republicar após a migração acima; se ainda aparecer, ajusto `src/integrations/supabase/client.ts` para dar mensagem clara e verifico se `.env` está sendo lido no build de produção.

3. **BUG 5 — link de acompanhamento**: hoje `/{slug}/acompanhar/{codigo}` já vai direto pra reserva. Vou verificar se o problema é o link truncado no WhatsApp (Bug 6) fazendo a pessoa cair em `/acompanhar` sem código. Se for, o fix é o Bug 6. Também vou tornar o parse de `codigo` case-insensitive e aceitar com/sem prefixo `RL-`.

4. **BUG 6 — mensagem truncada no WhatsApp**: template atual usa `.replaceAll` com `\n`? Vou revisar o template padrão e o link. Provável causa: quebras de linha e caracteres especiais mal-encodados fazendo o WhatsApp cortar. Vou padronizar o template (sem emoji, com `\n` reais), garantir `encodeURIComponent` correto, e limitar o link (talvez encurtar). Também vou expor o campo `mensagem_confirmacao` do tenant no painel para a empresa editar.

5. **Login novo do Iracema**: server fn no master que verifica se `iracemabarbh@gmail.com` já é `tenant_admin` de Iracema; se não, cria o usuário com senha `123456`, marca metadata `must_change_password: true` e faz o grant. **A conta de marketing atual não é removida** — o master decide depois.

6. **Fluxo "trocar senha no primeiro login"**: rota `/$slug/admin/trocar-senha` que só sai quando `user_metadata.must_change_password` estiver `false`. `$slug/admin/login` verifica essa flag e redireciona antes do dashboard.

### Fase B — Isolamento de acesso por empresa

- Reforçar que `tenant_admin` só enxerga o próprio `tenant_id` (RLS já faz isso; auditar todas as queries do painel para garantir `.eq("tenant_id", tenantId)` explícito como defesa em profundidade).
- Rota `/$slug/admin/login` só aceita usuários com `has_tenant_role(user, tenant_do_slug)` — hoje já faz isso, mas vou adicionar mensagem clara "Este login não pertence a esta empresa" ao invés de deslogar silenciosamente.
- Nenhuma alteração destrutiva; migração cria índice em `user_roles(user_id, tenant_id)` se faltar.

### Fase C — Painel de configuração por empresa

- Rota `/$slug/admin/configuracoes` com abas:
  - **Empresa**: nome, logo (upload em bucket `tenant-assets`), endereço, telefone, WhatsApp de contato, email.
  - **Tipos de reserva aceitos**: checkboxes de mesa/aniversário/evento/casamento (já existe coluna `tipos_aceitos`).
  - **Mensagem de confirmação WhatsApp**: editor com placeholders `{nome}`, `{data}`, `{horario}`, `{empresa}`, `{endereco}`, `{link_acompanhar}`, `{codigo}`.
- Home pública `/$slug` já lê `tenant.logo_url`, `nome`, `tipos_aceitos` — vou garantir que use os campos configurados.
- Migração cria bucket `tenant-assets` (público) e políticas de upload restritas ao próprio tenant_admin.

### Fase D — Bloqueio de agenda

- Nova tabela `agenda_bloqueios (id, tenant_id, data, hora_inicio, hora_fim, motivo, created_at, updated_at)` — permite bloquear dia inteiro (hora_inicio/fim null) ou faixas.
- RLS: tenant_admin gerencia os próprios; anon pode ler os do tenant (para o formulário checar).
- No formulário `/$slug/reservar/$tipo`: ao escolher data+horário, valida contra `agenda_bloqueios` antes de permitir enviar.
- No admin: aba `/$slug/admin/agenda` com calendário simples (lista + adicionar bloqueio).

### Fase E — Dashboard da empresa (métricas)

- Enriquece `/$slug/admin` (que já tem 4 stats) com um painel `/$slug/admin/relatorios`:
  - Reservas por dia (últimos 30 dias) — gráfico de barras.
  - Distribuição por tipo (pizza).
  - Taxa de confirmação vs cancelamento.
  - Top horários mais reservados.
- Usa Recharts (já disponível). Sem novas tabelas; agrega em SQL.

### Fase F — Feedback (só master vê)

- Nova tabela `feedbacks (id, tenant_id, autor_user_id, titulo, descricao, status enum('novo','em_analise','feito','recusado'), created_at)`.
- RLS: tenant_admin pode INSERT + SELECT dos próprios; super_admin SELECT/UPDATE de todos.
- No admin do tenant: página `/$slug/admin/sugestoes` para enviar (fica invisível no menu do master? o enunciado diz "aba só visível pra master" — vou interpretar como: a **lista consolidada** só o master vê; enviar sugestão fica disponível a todos os tenants).
- No master: `/master/feedbacks` — lista, marca status, filtra por empresa.

## Ordem de entrega e checkpoints

1. Executo **Fase A migração 1 (GRANTs)** — peço aprovação da migração (obrigatório) e valido `COUNT(*) reservas` antes/depois.
2. Corrijo BUGs 1, 5, 6 em código; crio login do Iracema + fluxo trocar-senha.
3. Publico e espero você validar em navegador anônimo que reservas voltam a funcionar e que o Iracema loga com a nova credencial.
4. Sigo para Fase B → C → D → E → F, cada uma como PR/fase separada com aprovação sua.

## Perguntas rápidas antes de começar (respondendo, sigo direto pra Fase A)

1. Posso remover o acesso "de marketing" que hoje entra no admin do Iracema, ou você prefere deixá-lo ativo até confirmar que a nova credencial funciona? (recomendo deixar até você confirmar).
2. Bucket de logos de empresa: público (URL direta) ok? — recomendo sim, pra performance.
3. Fase D bloqueio de agenda: começar simples (dia inteiro ou faixa por dia) ou já quer recorrência semanal (ex: "toda segunda fechado")?
