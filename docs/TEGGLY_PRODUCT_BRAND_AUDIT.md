# Teggly: auditoria de produto, marca e técnica

Data: 2026-10-08. Fase A. Nenhum código foi alterado para produzir este documento.

Fontes lidas: Brand Guidelines v1.0 (PDF/MD, seções 03, 08, 14 a 17 em detalhe, regras gerais), `25_Master_Brand_Guidelines`, `TEGGLY_AI_OPERATING_SYSTEM_v1.0` (SYSTEM_PROMPT e PROMPTS), pasta `FASE_05_Website` (mapa de páginas, hero e regras; os 9 HTMLs de referência e as capturas existem em `08_WEBSITE/site`). Código lido no repositório `abauerlab/reservalab`. Telas reais capturadas com Playwright sobre o mock E2E (dados de exemplo, desktop 1280 e mobile 390). Workflows n8n lidos via MCP, sem executar nenhum.

Legenda: CRÍTICO, ALTO, MÉDIO, BAIXO, OK. Formato de cada achado: regra do Brand System, estado atual, problema, correção.

## 0. Veredito

Pergunta: "Se eu apresentar o produto hoje a um restaurante que paga mensalidade, ele parece um SaaS premium confiável?"

- **Painel e páginas públicas de reserva: sim, com ressalvas.** As fases F1 a F10 já levaram tokens, Manrope, raios, badges, sidebar com gota e white-label por opt-in para o padrão Teggly. Falta densidade de informação útil no "Hoje", onboarding e consistência de ícones de marca externa.
- **Website público: não.** A home ainda é a versão antiga ("Teggly, uma solução BauerLab", `reserva.bauerlab.com.br/suaempresa`, "O que já está pronto no sistema", 12 cards de feature iguais). Não segue a arquitetura da FASE_05 e não tem preços, prova nem produto real como protagonista.
- **WhatsApp: funciona, mas a voz e o contexto quebram.** Há mensagem dupla após o "sim" e o greeting reaparece (seção 7).

## 1. Resumo por severidade

| # | Área | Severidade |
|---|------|-----------|
| 1 | Website inteiro fora da FASE_05 e com marca/domínio BauerLab | CRÍTICO |
| 2 | WhatsApp: duas mensagens após o "sim", a segunda reabre com "Olá, tudo bem?" | CRÍTICO |
| 3 | Mensagens de sistema não entram na memória do agente (cliente que agradece vira "Oi! Eu sou a Dona Iracema" de novo) | ALTO |
| 4 | Ícones de marca externa genéricos (WhatsApp = balão, Instagram = câmera, delivery = seta) | ALTO |
| 5 | Sem planos, entitlements, limites de reserva ou tela de plano | ALTO |
| 6 | Sem onboarding pós-login | ALTO |
| 7 | "Hoje" responde só parte das perguntas de um dashboard (sem KPIs, sem cliente importante, sem origem) | ALTO |
| 8 | Link Hub: sem banner, sem destaque configurável, sem biblioteca de ícones, sem upload de ícone, sem toggle de cardápio | ALTO |
| 9 | Cardápio: modelo ok, mas sem conteúdo real do Iracema, fotos só por URL | MÉDIO |
| 10 | Segredo de webhook comparado em literal dentro do n8n; EvolutionAPI em HTTP por IP | ALTO (segurança, já documentado) |
| 11 | 35 usos de `font-bold` (peso 700 não existe no Brand System) | MÉDIO |
| 12 | Resíduos de `terracotta`/`#B4552D` no código e no mock | MÉDIO |
| 13 | Lint com `--fix` pendente em avisos de react-refresh (11 warnings) | BAIXO |
| 14 | Tokens, tipografia carregada, raios, sombras, badges de estado | OK |
| 15 | Login atual | OK (não mexer) |
| 16 | White-label por opt-in (`marca_ativa`) e RPC `marca_do_tenant` | OK |

## 2. Marca

### 2.1 Logo, símbolo, wordmark
- Regra: só SVGs oficiais; degradê só no símbolo, hero, app icon e capas.
- Estado: `public/brand` tem 6 SVGs oficiais (primário, horizontal negativo, símbolo degradê, azul pequeno, branco, favicon). Sidebar, hub e login usam o oficial.
- Problema: `public/og-image.png` não foi verificado contra o asset oficial; a home usa o logo oficial no cabeçalho, mas não há og-image conferido.
- Correção: Fase B usa só `public/brand/*`. **OK** no painel, **MÉDIO** no og-image.

### 2.2 Cores
- Regra: Blue #2563EB única ação; texto #0F172A; fundo #F8FAFC; estados 50/500/700.
- Estado: `src/styles.css` define escalas blue, slate e estados exatamente como o Brand System, com `--primary: #2563eb`. Badges "Pendente" e "Confirmada" nas capturas usam fundo 50, ponto 500 e texto 700. **OK**.
- Problema: alias histórico `terracotta`, `cream`, `brown` ainda consumidos (home usa `text-terracotta`, `bg-terracotta`; `$slug.admin.links.tsx` e `MensagemDoDia.tsx` também) e o mock do tenant usa `#B4552D`. Resolvem para valores Teggly, mas o nome engana quem mantém o código e a home mostra o resíduo no rótulo de seção. **MÉDIO**. Correção: renomear para tokens semânticos na Fase I; na home, sai com a reconstrução.

### 2.3 Tipografia
- Regra: Manrope 400, 500, 600, 800. Nunca 700.
- Estado: Google Fonts carrega `wght@400;500;600;800` em `__root.tsx`. Mas `font-bold` (peso 700) aparece 35 vezes em `src` (ex.: `$slug.admin.links.tsx:242`, `relatorios.tsx:155`, `cardapio.tsx:124`). O navegador sintetiza 700 a partir de 600 ou 800, fora do sistema. **MÉDIO**. Correção: trocar por `font-semibold` (títulos de card) ou `font-extrabold` (KPIs).
- Landing usa `font-serif` como classe de título; o alias aponta para Manrope, então renderiza certo, mas o nome é resíduo. **BAIXO**.

### 2.4 Ícones
- Regra: set Teggly em traço 1,75, 24 px; WhatsApp indica canal dentro do produto; **integração oficial usa o logo oficial**.
- Estado: 52 imports de `lucide-react` (família única de traço, coerente em estilo). Não existe o set `05_ICONS` do Brand System no repositório.
- Problemas:
  - WhatsApp = `MessageCircle` em `$slug.index.tsx:239`, `$slug.admin.contatos.tsx:309`, `ReservaDetail.tsx:63` e no Hub. **ALTO**.
  - Instagram = `Instagram` do lucide (contorno de câmera, mas é o glifo da Lucide, não o da marca) no Hub e em `admin.links`. **ALTO** para o Hub público.
  - Links extras (Playlist, iFood, 99Food) caem em `ExternalLink`. **ALTO** (caso real Iracema).
  - `MessageSquareText` como ícone de "Gerar mensagem do dia" com cor `text-terracotta`. **BAIXO**.
- Correção: criar `src/components/brand/BrandIcons.tsx` com glifos oficiais de WhatsApp, Instagram, Facebook, TikTok, iFood, 99Food, Google Maps e YouTube, mais o catálogo do Link Hub (Fase E). Ícones internos continuam no set de traço (lucide como base, já em 1,75 por token) e a distinção fica escrita em regra.

### 2.5 Espaçamento, bordas, sombras, componentes
- Estado: raios 10/16/20 e sombras azuladas difusas definidos; botão primário azul 44 px; cards brancos com borda slate-200. As capturas do "Hoje" e do Hub confirmam. **OK**.
- Hub: botões de link em pílula (raio total) em vez de raio 16 de card. Aceitável para link-in-bio, mas diverge do restante. **BAIXO**.
- "Hoje" no desktop deixa um vazio grande entre a "Linha do serviço" e "Próximos dias" porque a coluna direita (Reconfirmar com 5 cards) é mais alta que a esquerda. **MÉDIO**: rebalancear na Fase C.
- Bloco "Precisa de você" apareceu com opacidade reduzida na captura (provável estado de transição). Verificar na Fase C. **BAIXO**.

### 2.6 Ilustrações, fotografia, mockups
- Regra: foto quente + produto frio; produto real sempre; sem texto legível em telas; IA nunca apresentada como cliente real.
- Estado: a home usa mockups desenhados em JSX (cartões "Reserve sua mesa", lista de reservas) com nomes fictícios, não capturas reais do produto. Sem fotografia. **ALTO** (substituir por capturas reais do produto, marcadas como "dados de exemplo").

### 2.7 Empty states, mensagens, microcopy, CTAs
- Regra: voz de maître, "você", caixa normal, sem emoji no painel e no site, sem travessão, CTA primário "Começar agora" no site.
- Estado: painel em geral dentro da voz ("Hoje: 5 reservas, 148 pessoas, 1 pendente" é bom). Datas no "Hoje" aparecem como `Quarta, 07/10/2026` e `07/10`; o padrão do Brand System é "Sáb, 21 jun · 20:00". **MÉDIO** (formato de data inconsistente). Correção: `formatDataCurta` em `datetime.ts` e usar no painel.
- Home: "O que já está pronto no sistema", "Funcionalidades", "Equipe alinhada", "Fale com a nossa equipe e receba o acesso da sua empresa" (CTA leva a WhatsApp wa.me com texto pré-preenchido). Tom de lista de features, não de benefício. **ALTO**.
- CTA da home aponta direto para `wa.me/5531998021169`. O número é de contato da BauerLab, não do e-mail oficial pedido para materiais públicos. Padronizar para `contato.bauerlab@gmail.com` e para o WhatsApp do Teggly assim que definido. **MÉDIO**.

## 3. Telas e áreas

| Área | Estado observado | Severidade | Ação |
|------|------------------|-----------|------|
| Login (`$slug.admin.login`, `master.login`) | Mantido por decisão do proprietário | OK | Não mexer |
| Hoje | Linha do serviço, "Precisa de você", Pendentes, Reconfirmar, Próximos dias, push. Sem KPIs, sem origem da reserva, sem clientes importantes, sem atalhos para Agenda/Cliente | ALTO | Dashboard (Fase C) |
| Reservas | Lista, filtros, detalhe lateral/sheet, ações em linha | OK | Link cruzado para Cliente e Agenda |
| Agenda | Timeline por área e horário, marcador "agora", realtime, E2E de overflow | OK | Manter |
| Clientes (`contatos`) | Lista, busca, exportação, atalho WhatsApp com ícone genérico | MÉDIO | Ícone oficial; link para histórico de reservas |
| Relatórios | KPIs por status e período; `font-bold` em números | MÉDIO | `font-extrabold`; origem da reserva quando existir no dado |
| Configurações | 536 linhas numa página só; marca por opt-in, pixel, regras, WhatsApp | MÉDIO | Separar em abas (Casa, Reservas, Marca, WhatsApp, Ajuda); adicionar "Refazer onboarding" e plano |
| Cardápio (admin) | CRUD de categorias e itens, publicar, foto por URL | MÉDIO | Reordenar por arraste, upload de foto, importação do Iracema |
| Link Hub (admin) | Instagram, links automáticos, links extras | ALTO | Banner, destaque, ícones, toggle de cardápio |
| Página pública de reserva | Atalhos da casa, acompanhar, erros claros (F7) | OK | Revisar após Hub |
| Cardápio público | Categorias, itens, preços, CTA de reserva, E2E | OK | Conteúdo real do Iracema |
| Link Hub público | Reservar mesa primeiro, depois cardápio, WhatsApp, Instagram, localização, ligar, extras; "powered by Teggly" | MÉDIO | Banner, ícones de marca, destaque iFood/99Food |
| Acompanhar reserva | Funciona, E2E cobre | OK | Voz alinhada ao WhatsApp |
| PWA | manifest, sw, push | OK | Manter |
| Master/Admin de empresas | Cadastro de empresas continua pelo Admin | OK | Não implementar self-service |
| Website | Ver seção 4 | CRÍTICO | Fase B |

## 4. Website atual contra a FASE_05

Arquitetura oficial (seção 14): Hero, Como funciona, Recursos, IA, Sua marca, Painel, FAQ, CTA. Regras: container 1200, 112 px de respiro, **uma** seção escura (IA), um CTA primário por dobra ("Começar agora"), screenshots reais com raio 20 e sombra lg, "Como funciona" em linha + gota, motion só no hero (drop & settle).

| Regra | Atual | Severidade |
|-------|-------|-----------|
| Hero "Mais reservas. / Menos trabalho." 72 px ExtraBold, subtítulo 20 px, 2 CTAs, 4 recursos | Headline certa, mas subtítulo técnico ("A Teggly cuida", feminino; o Brand System diz "o Teggly") e CTA primário leva ao WhatsApp | ALTO |
| Nome da marca "o Teggly" | "A Teggly" no hero | MÉDIO |
| Conversa real de WhatsApp sobre foto quente | Mockup JSX de formulário, sem WhatsApp, sem foto | ALTO |
| Como funciona em linha + gota | 3 cards numerados + um segundo fluxo de 5 etapas (duas explicações do mesmo processo) | ALTO (redundância) |
| Seção escura única (IA) | Não há seção de IA nem de WhatsApp | CRÍTICO |
| Preços | Inexistente | CRÍTICO |
| Prova | Inexistente | ALTO |
| Seções repetidas | "O problema", "A solução", "Funcionalidades", "Benefícios" repetem "tudo em um lugar" quatro vezes | ALTO |
| CTA final | "Pronto para organizar as reservas da sua empresa?" sem número ou prazo | MÉDIO |
| Rodapé | "Teggly, uma solução BauerLab", link `bauerlab.com.br`, `reserva.bauerlab.com.br/suaempresa` | CRÍTICO |
| SEO | og/canonical em `reserva.bauerlab.com.br`; sitemap só com a raiz | MÉDIO (domínio não migra agora) |

Decisão de domínio: **não migrar**. Canonical e og ficam em `reserva.bauerlab.com.br` até a migração ser decidida; o texto visível passa a falar "teggly.com.br" apenas onde o Brand System já usa (rodapé institucional), sem apontar links para ele.

## 5. Auditoria técnica

### 5.1 Rotas (TanStack Start, `src/routes`)
Públicas: `/`, `/$slug`, `/$slug/reservar/$tipo`, `/$slug/obrigado`, `/$slug/acompanhar` e `/$slug/acompanhar/$codigo`, `/$slug/cardapio`, `/$slug/links`, `sitemap.xml`. Admin da empresa: `/$slug/admin` (Hoje), `reservas`, `agenda`, `cardapio`, `links`, `eventos`, `relatorios`, `contatos`, `configuracoes`, `sugestoes`, `trocar-senha`, `login`. Master: `/master`, `/master/login`. API: `src/routes/api`.

### 5.2 Banco (produção `wkvyhpfuezzinlaxsaap`, ver `docs/database/LIVE_STATE.md`)
- 9 tabelas base com RLS, mais `tenant_perfil`, `cardapio_categorias`, `cardapio_itens`, `hub_links` (F9/F10) e `marca_ativa` (F8).
- Regra do projeto: **o repositório não é a fonte da verdade do banco**. Há 13 migrations só em produção. Qualquer migration nova deve ser aditiva, reversível, documentada em `docs/database/applied/` e conferida contra `LIVE_STATE.md` antes de aplicar.
- Não existe tabela de planos, limites ou uso. Não existe bucket de storage (fotos e logos só por URL).
- RLS: tabelas novas só `authenticated` com `has_tenant_role`; leitura pública por RPC `SECURITY DEFINER` (`cardapio_do_tenant`, `hub_do_tenant`, `marca_do_tenant`). Padrão correto e será mantido para tudo que for novo.
- Risco herdado: RPCs de lembrete e confirmação por código ainda executáveis por `anon` (usadas pelo n8n). Pendência registrada em F3.

### 5.3 Funcionalidades existentes (não duplicar)
- Planos: **nenhum** (grep por `plano|plan_|entitlement` não retorna nada relevante).
- Onboarding: **nenhum**.
- Cardápio: existe (`cardapio.ts`, `admin.cardapio`, `$slug.cardapio`), com E2E.
- Link Hub: existe (`hub.ts`, `admin.links`, `$slug.links`), com E2E.
- Marca por opt-in: existe (`MarcaOptIn`, `MarcaScope`, `marca.ts`), com E2E `marca.spec.ts`.

### 5.4 Qualidade
Baseline medido antes de qualquer mudança: `typecheck` verde, `test` 154/154 verdes, lint sem erros no código do projeto (11 avisos de react-refresh), E2E existentes cobrem Agenda, navegação, pública, cardápio/hub e marca.

## 6. Profissionalismo: o que parece template ou inacabado

1. Home com 12 cards iguais de feature e ícones em pílula idênticos (padrão "AI generated").
2. Duas versões do mesmo mockup de celular na mesma página.
3. Lista de segmentos incluindo "Estúdios, Clínicas, Barbearias, Coworkings": diluem o posicionamento para restaurantes e bares.
4. Painel sem onboarding: o primeiro login cai direto no "Hoje" vazio.
5. Configurações numa rolagem única.
6. Datas em formatos diferentes no mesmo painel (`Quarta, 07/10/2026`, `07/10`).
7. Ícone de balão para WhatsApp (percebido como "app genérico").
8. "Sugestões" na sidebar compete com itens operacionais; deve ir para Ajuda.

O que já passa confiança: calma visual do painel, badges de estado, linha do serviço com marcador "agora", Agenda, página de reserva e acompanhamento.

## 7. WhatsApp e n8n: resumo (detalhe em `TEGGLY_WHATSAPP_VOICE_AUDIT.md`, Fase H)

Workflows ativos: Atendimento WhatsApp (agente Gemini com memória Postgres por telefone, janela 8), Lembrete 24h, Avisos ao dono, Confirmação ao cliente.

**Problema do "sim" (3303), causa raiz identificada sem executar nada:**
1. Cliente responde "sim". O nó "Resposta curta de confirmação?" (regex) desvia para o caminho sem IA: busca pendente, chama `confirmar_reserva_por_codigo` e envia "Obrigada pela reserva, {nome}! ... Ela está confirmada para dd/mm às HH. Te esperamos no Iracema!".
2. A mesma chamada muda o status para `confirmada`. O trigger `trg_reserva_confirmacao_cliente` dispara `notificar_confirmacao_cliente` e o workflow "Confirmação de Reserva (cliente)" monta o template `TEMPLATE_CONFIRMADA_PADRAO`, que **sempre começa com "Olá {nome}, tudo bem?"**, e envia.
3. Resultado: duas mensagens para um único "sim", a segunda com saudação de abertura, repetindo dados já dados. Não é concorrência nem duplicidade de trigger: são dois caminhos independentes que não sabem um do outro, e o segundo é um template estático sem noção de que há conversa em curso.
4. Agravante: nenhuma das duas mensagens é gravada em `n8n_chat_histories_iracema`. Se a pessoa responder "obrigado", o agente não tem histórico e pode se apresentar de novo.
5. Segundo agravante: a chave da memória é o telefone extraído de `data.sender`, que pode vir como `@lid`; a mesma pessoa pode ter dois históricos.

Correções propostas, em ordem de risco:
- **Copy (segura, pode ir já):** a mensagem de confirmação passa a abrir sem "Olá, tudo bem?" (ex.: "{nome}, sua reserva no {empresa} está confirmada."), valendo tanto para a primeira confirmação quanto para depois do "sim". O template personalizado do tenant (`mensagem_confirmacao_template`) continua com prioridade.
- **Estrutural (documentar e pedir autorização antes):** (a) eliminar a mensagem dupla fazendo o caminho do "sim" chamar `confirmar_reserva_sem_notificar` (já existe no banco) e deixando só uma mensagem final, ou fazendo o workflow de confirmação ignorar reservas confirmadas por resposta do cliente; (b) gravar as mensagens automáticas na memória do agente; (c) normalizar a chave de memória para dígitos com DDI.

## 8. Plano de execução (ajuste de ordem por dependência)

1. A: este documento (feito).
2. B: Website (FASE_05) com produto real.
3. C: Dashboard no "Hoje".
4. D: Onboarding.
5. E e F: Link Hub e Cardápio (dependem do catálogo de ícones).
6. G: Pesquisa de mercado, estratégia de preço, estrutura de planos sem billing (a seção de planos do site depende disso, então G antecede o fechamento da B).
7. H: WhatsApp (copy segura primeiro).
8. I e J: polimento e QA.

Branches: o ambiente exige desenvolver em `claude/clever-mccarthy-d6snnr`; as fases entram como commits separados nessa branch em vez de branches `feat/*`.

## 9. Status após a execução (2026-10-08)

Ver `TEGGLY_EXECUTION_REPORT.md`. Resolvidos: 1 (Website), 2 e 3 em parte (copy publicada; estrutura aguarda decisão), 4 (ícones de marca), 5 (planos), 6 (onboarding), 7 (Dashboard), 8 (Link Hub), 9 (cardápio do Iracema importado, não publicado), 11 e 12 (peso 700 e `terracotta`). Em aberto: 10 (segredo do webhook e HTTP por IP), 3 (memória do agente), 13 (avisos de lint antigos).
