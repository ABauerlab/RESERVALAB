# Teggly: auditoria de lançamento (2026-10-12)

Fontes: código do repositório, `docs/`, pasta Drive `14_PENDENCIAS_PARA_CLAUDE_CODE`, e-book `Teggly_Guia_Reservas_Organizadas.pdf` (13 páginas, sem estatísticas inventadas).

## 1. O que existe de verdade

| Área | Estado real | Plano |
|---|---|---|
| Site (`/`) | Existe. CTAs eram `mailto:`; agora levam a `/planos` | público |
| Planos (`/planos`) | Criada nesta etapa. Catálogo em `src/lib/plans.ts` (Gratuito R$0, Essencial R$89, Pro R$189) | público |
| Reserva pública `/$slug` | Funciona | Gratuito (40/mês) |
| Cardápio, Link Hub | Funcionam | todos |
| Painel (agenda, reservas, clientes, relatórios, eventos) | Funciona, login por e-mail/senha (Supabase Auth) | todos, relatórios por plano |
| WhatsApp (confirmação, lembrete, avisos 7d/2d, assistente) | n8n + EvolutionAPI (não oficial) | Essencial/Pro |
| Cadastro self-service | **Não existe.** Empresa só é criada por super admin (`create-company`) | n/a |
| Billing / checkout | **Não existe.** `tenant_planos` preenchida à mão | n/a |
| Enforcement de plano no servidor | **Não existe.** Limites são só avisos no front | n/a |
| Privacidade / Termos | **Não existem** (bloqueia Meta Lead Ads e coleta de dados) | n/a |
| "Plano Full" | **Não existe.** O topo é o Pro | n/a |

## 2. Contradições e riscos encontrados

1. Regra comercial pedida ("só Cardápio e Link Hub grátis") conflita com o Gratuito atual (inclui 40 reservas/mês e página de reserva). Decisão do dono pendente.
2. Nenhum limite de plano é aplicado no banco: qualquer tenant usa tudo.
3. `.env` do repositório aponta para outro projeto Supabase; produção é `wkvyhpfuezzinlaxsaap`. Migrations do repo divergem de produção (ver `docs/database/LIVE_STATE.md`). Nenhuma migration nova deve ir para produção sem reconciliar.
4. Slug inexistente em `/$slug` não devolve 404 (TEC-03). Não há lista de slugs reservados.
5. WhatsApp do site citava "ReservaLab" (TEC-01): corrigido.
6. Chaves publishable e IP/URLs aparecem em workflows n8n; sem segredos de serviço expostos no repo.
7. Prova social do Iracema no site sem autorização documentada (PROD-03).
8. E-mail oficial atual é da BauerLab (PROD-02); domínio teggly.com.br sem e-mail definido.

## 3. Feito nesta etapa

- `/planos` com comparativo responsivo, canonical, JSON-LD e sitemap.
- CTAs da home levam a `/planos` (WhatsApp "Falar com especialista" mantido: outro propósito).
- Texto do WhatsApp com a marca Teggly (TEC-01).
- Testes: typecheck, lint e 239 testes verdes.

## 4. Bloqueadores de lançamento (ordem)

1. Decisão do plano gratuito (ver pergunta ao dono).
2. Política de privacidade e Termos com texto aprovado (TEC-02).
3. Formulário de interesse/cadastro que grava lead (TEC-04) e página do e-book com Apps Script (precisa da URL do Apps Script e da planilha).
4. Enforcement de plano no banco (migration, só após reconciliar produção).
5. Checkout InfinitePay: precisa de links, IDs e webhooks reais.
6. Slug 404 e slugs reservados (TEC-03).
7. Mensuração (Pixel) só depois de privacidade.

## 5. Eventos a medir (só quando a base existir)

| Evento | Disparo | Pré-requisito |
|---|---|---|
| PageView | visita à landing | consentimento/privacidade |
| ViewPlans | clique em "Ver planos" | nenhum |
| Lead (e-book) | só após confirmação do Apps Script | página do e-book |
| Lead (interesse) | envio do formulário | TEC-04 |
| Contact | clique no WhatsApp | privacidade |
| InitiateCheckout | clique em contratar | checkout |
| Purchase | **somente** via webhook confirmado | InfinitePay |
