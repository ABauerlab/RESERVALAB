# Teggly: arquitetura do produto

Mapa de como as áreas se conectam. Regra de projeto: nenhuma tela existe isolada. Para cada tela: de onde o usuário chega e para onde vai depois.

## Áreas

| Área | Papel | Chega de | Vai para |
|---|---|---|---|
| Dashboard (Hoje) | Visão geral do dia | Login, onboarding | Reservas, a reserva, Agenda, Clientes, "Precisa de você", plano |
| Reservas | Operação detalhada | Dashboard, Agenda, página pública | Detalhe da reserva, WhatsApp, Cliente |
| Agenda | Planejamento no tempo | Dashboard | Reserva, bloqueios e feriados |
| Clientes | Relacionamento | Dashboard (clientes de casa), Reservas | WhatsApp, histórico |
| Cardápio | Conteúdo e oferta | Onboarding, Link Hub | Página pública, Link Hub, "Reservar mesa" |
| Link Hub | Presença digital | Cardápio, Instagram | Reserva, Cardápio, WhatsApp, delivery, localização |
| Relatórios | Análise | Dashboard | Reservas por período e tipo |
| Ajustes | Gestão | Qualquer tela | Marca, horários, WhatsApp, plano, ajuda, onboarding |

## Fluxos de dados

```
Reserva -> Cliente -> Histórico -> WhatsApp -> Confirmação -> Lembrete -> Dashboard -> Agenda -> Relatórios
Cliente -> Reservas -> Histórico -> Preferências (observações)
Cardápio -> Link Hub -> Página pública -> CTA "Reservar mesa"
Link Hub -> Reserva | Cardápio | WhatsApp | Instagram | Localização | Delivery
Dashboard -> Reserva -> Cliente -> Agenda -> Ação
```

- Reserva pública (`criar_reserva`) alimenta Dashboard, Agenda, Reservas e Clientes sem passo extra. Cliente é derivado das reservas por telefone normalizado (não há tabela de clientes).
- Dashboard: cada cartão do resumo leva à área onde a ação acontece. "Clientes de casa" liga a Clientes. "Ver na Agenda" liga à Agenda.
- Cardápio e Link Hub compartilham `tenant_perfil` (publicação, toggle) e o bucket `tenant-assets`.

## Rotas

Públicas: `/` (website), `/$slug` (reserva), `/$slug/reservar/$tipo`, `/$slug/obrigado`, `/$slug/acompanhar[/$codigo]`, `/$slug/cardapio`, `/$slug/links`. Painel: `/$slug/admin` (Hoje), `reservas`, `agenda`, `eventos`, `cardapio`, `links`, `contatos`, `relatorios`, `configuracoes`, `sugestoes`, `trocar-senha`, `login`. Master: `/master`, `/master/login`.

## Banco e limites de tenant

Toda tabela de produto tem `tenant_id` e RLS por `has_tenant_role`. Leitura pública só por RPC `SECURITY DEFINER` por slug (`hub_do_tenant`, `cardapio_do_tenant`, `marca_do_tenant`, `criar_reserva`...). Storage: `tenant-assets/<tenant_id>/...` com escrita só do admin da própria empresa. Planos: `tenant_planos` (só o super admin escreve; a empresa lê). Mudanças recentes: F8 (marca opt-in), F9/F10 (cardápio, Link Hub), F11 (Link Hub completo, planos, storage), F12 (cardápio do Iracema, não publicado). Documentadas em `docs/database/applied/`.

## Planos e recursos (sem billing)

Catálogo único em `src/lib/plans.ts` (preços, limites, recursos). Site, "Seu plano" em Ajustes, cartão do Dashboard e o onboarding leem dele. Empresa sem registro vale como Pro de lançamento. Nada bloqueia: o limite de reservas é um aviso. Preparado para uma futura camada de cobrança (plano, ciclo, vigência já existem na tabela); nenhum provedor foi integrado.

## White-label

Tudo novo nasce preparado para tenant: Link Hub com banner, ícones e links próprios; cardápio com fotos próprias; marca (logo e cor) por opt-in. O painel continua Teggly. O "powered by Teggly" é fixo em todos os planos nesta versão.

## Marca no código

Tokens em `src/styles.css`; ícones de marca externa em `src/components/brand/BrandIcons.tsx` (glifos oficiais), ícones internos no set de traço (lucide, 1,75); alias `brand` substitui o antigo `terracotta`.
