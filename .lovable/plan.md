
# ReservaLab — Reconstrução completa

Sistema deixa de ser específico do Iracema e vira SaaS multi-tenant hospedado em `reserva.bauerlab.com.br`. Iracema passa a ser o primeiro tenant em `/iracema`.

## 1. Rebrand (Lovable → ReservaLab)

- Substituir todos os textos, títulos, meta tags, `manifest.webmanifest`, robots, sitemap e favicon por identidade ReservaLab.
- Gerar novo favicon + ícones PWA 192/512 (marca ReservaLab).
- Apagar `public/favicon.ico` padrão do template.
- Head do `__root.tsx`: title "ReservaLab", description SaaS de reservas.

## 2. Banco de dados — nova estrutura multi-tenant

Nova migração (apaga reservas atuais):

```text
tenants
  id, slug (unique, ex: "iracema"), nome, logo_url, endereco,
  telefone_contato, email_contato, cor_primaria, whatsapp,
  tipos_aceitos (text[]: mesa/aniversario/evento/casamento),
  ativo, created_at, updated_at

app_role  enum: super_admin | tenant_admin
user_roles
  user_id (auth.users), role, tenant_id (null p/ super_admin)

reservas  (recriada)
  + tenant_id (FK tenants), codigo_acompanhamento (text unique, 8 chars),
  quantidade agora inteiro livre, telefone texto livre com DDI opcional.
  Mantém: tipo, nome, telefone, data, horario, area, leva_bolo,
  comandas, tipo_evento, observacoes, status.
```

RLS:
- `tenants`: SELECT público (para renderizar `/slug`); INSERT/UPDATE/DELETE apenas super_admin.
- `user_roles`: leitura pelo próprio user; escrita apenas super_admin. Função `has_role(uuid, app_role)` SECURITY DEFINER.
- `reservas`: INSERT público (anon + authenticated); SELECT/UPDATE/DELETE por tenant_admin do próprio tenant OU super_admin; SELECT anônimo apenas via RPC `get_reserva_by_codigo(codigo)` SECURITY DEFINER que retorna 1 reserva.
- UPDATE público (cliente edita própria reserva pelo código): RPC `update_reserva_by_codigo(codigo, payload)` SECURITY DEFINER, valida status ≠ finalizada/cancelada.

Grants apropriados em cada tabela.

Seed: criar tenant `iracema` com tipos `[mesa, aniversario, evento, casamento]` para não perder o cliente atual.

## 3. Admin master

- Não guardo senha em texto. Crio o usuário `contato.bauerlab@gmail.com` via Supabase Auth Admin (senha fornecida) e insiro role `super_admin` na migração usando função SQL que chama `auth.admin_create_user`… como Lovable Cloud não expõe isso via SQL, faço via server function `bootstrapSuperAdmin` chamada uma única vez (idempotente) no primeiro request ao painel master. **Recomendação: trocar a senha após primeiro login.**
- Painel master em `/master` (autenticado, `_authenticated/master.tsx` com checagem `has_role super_admin`):
  - Listar tenants
  - Criar novo tenant (slug, nome, e-mail admin, senha inicial → cria user + role tenant_admin)
  - Ativar/desativar, editar

## 4. Rotas por tenant

```
/                       Landing ReservaLab (SaaS)
/master                 Painel master (super_admin)
/master/login
/$slug                  Home do tenant (usa dados do tenant)
/$slug/reservar/$tipo   Formulário (só tipos que tenant aceita)
/$slug/obrigado         Confirmação — exibe código de acompanhamento
/$slug/acompanhar       Consulta por código (input)
/$slug/acompanhar/$cod  Detalhes + edição pelo cliente
/$slug/admin/login      Login do tenant
/$slug/admin            Dashboard do tenant
```

Loaders públicos: server fn `getTenantBySlug` com client publishable (SELECT anon). 404 se inativo ou inexistente.
Tenant admin: `_authenticated` layout já existe; adiciono checagem `has_role tenant_admin AND tenant_id = X` via `beforeLoad` client-side.

## 5. Melhorias no formulário público

- Quantidade: componente híbrido — stepper +/- **e** input numérico editável (aceita digitar). Máx 500.
- Telefone: máscara flexível — se começa com `+`, mantém DDI livre; caso contrário aplica máscara BR (11 dígitos). Validação: mínimo 10 dígitos.
- Após enviar: gera código 8 chars alfanuméricos (ex: `RL-4F9K2A`), mostrado na `/obrigado` com botão "Copiar" e link "Acompanhar reserva".

## 6. Acompanhamento sem login

- `/$slug/acompanhar`: input de código → navega para `/$slug/acompanhar/$cod`.
- `/$slug/acompanhar/$cod`: server fn `getReservaByCodigo` (RPC). Exibe status colorido, dados. Se status ∈ {pendente, confirmada}, permite editar campos (data, horário, quantidade, área, observações) via RPC `updateReservaByCodigo`. Bloqueio se cancelada/finalizada.

## 7. Admin do tenant — filtros e edição total

- Filtros por status: chips (Todas / Pendente / Confirmada / Cancelada / Finalizada) + filtros existentes (busca, data).
- Modal de detalhes ganha modo edição: qualquer campo editável (nome, telefone, data, horário, quantidade, área, tipo, observações, tipo_evento, leva_bolo, comandas, status). Botão "Salvar alterações".
- Ao clicar "Confirmar": abre `wa.me/<telefone>?text=<msg personalizada>` em nova aba. Mensagem template configurável no tenant (default: `"Ola {nome}, sua reserva no {empresa} para {data} as {horario} foi confirmada. Endereco: {endereco}. Qualquer alteracao acesse {link_acompanhar}."`). Sem emojis.
- Botão "Nova reserva" — admin cria reserva manualmente.
- Botão "Excluir" com confirmação.

## 8. Push notifications VAPID (background real)

- Instalar `web-push` (Worker-compat? Verificar; se não, uso fetch direto para FCM/Web Push endpoints com JWT VAPID assinado via `crypto.subtle`). **Nota técnica**: `web-push` npm usa Node crypto e não roda no Cloudflare Worker. Vou implementar assinatura VAPID manual usando WebCrypto (ES256) — padrão suportado em Workers.
- Chaves VAPID: gero via `generate_secret` não serve (precisa par ECDSA). Gero um par via script one-shot em migração/server fn e salvo `VAPID_PUBLIC_KEY` (também exposta como `VITE_VAPID_PUBLIC_KEY`) e `VAPID_PRIVATE_KEY` como secrets.
- Nova tabela `push_subscriptions` (tenant_id, endpoint, p256dh, auth, user_id, created_at).
- `sw.js` atualizado: listener `push` mostra notificação, `notificationclick` foca/abre `/{slug}/admin`.
- Admin: botão "Ativar notificações" → `pushManager.subscribe({applicationServerKey})` → grava no banco.
- Trigger no INSERT em `reservas`: chama server route `/api/public/notify` via `pg_net` com HMAC secret; route busca subs do tenant, envia push VAPID para cada endpoint.
- iOS: só funciona com PWA instalado (documentado no UI).

## 9. Zerar cadastros

Migração faz `TRUNCATE reservas` (recriação já cobre isso). Nenhum dado do Iracema preservado.

## 10. Domínio

Confirmado apontado. Configurar custom domain reserva.bauerlab.com.br no publish depois do deploy — passo manual seu no painel Lovable.

---

## Escopo técnico resumido

Arquivos novos/alterados (~35):
- 3 migrações SQL (multi-tenant + push + seed)
- `src/lib/tenant.functions.ts`, `admin.functions.ts`, `reservas.functions.ts`, `push.functions.ts`
- `src/routes/api/public/notify.ts`, `src/routes/api/public/vapid-generate.ts` (one-shot)
- Novas rotas `$slug.*`, `master.*`, `acompanhar.*`
- Refatorar `admin.index.tsx`, `admin.login.tsx` → `$slug.admin.*`
- `public/sw.js`, `public/manifest.webmanifest`, novos ícones
- Componentes: `QuantityInput`, `PhoneInput`, `StatusFilter`, `EditReservaForm`, `TenantHeader`

## Riscos

- VAPID em Cloudflare Worker exige ES256 manual — implementação delicada mas viável.
- Bootstrap do super_admin depende de `supabaseAdmin.auth.admin.createUser` na primeira visita ao `/master/login` (idempotente).
- Multi-tenant + RLS por tenant_id precisa de política sem recursão (usa `has_role` + coluna `tenant_id` na `user_roles`).

## Confirmação necessária

Aprova o plano? Vou executar em sequência, com migrations submetidas para sua aprovação individual.
