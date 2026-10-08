# Revisão final independente do PR #36

Data: 2026-10-08. Revisão feita depois da entrega, comparando o resultado com o Brand System, com o site de referência (FASE_05), com os dados de produção e com as execuções reais do n8n. Foram corrigidos apenas problemas necessários para consistência, qualidade ou regressão; nenhuma feature nova.

## 1. Website contra a FASE_05 e o Brand Guidelines

### Divergências encontradas e corrigidas nesta revisão

| # | Divergência | Regra | Correção |
|---|---|---|---|
| 1 | Todas as seções animavam ao rolar (componente `Reveal`) | "Motion: só a entrada do hero (drop & settle). Nada de animação em cada seção" | `Reveal` removido; o hero entra com drop & settle (respeita reduced motion) |
| 2 | Seções não alternavam branco e `#F8FAFC` (as duas cores eram a mesma) | "Alternando branco e #F8FAFC" | Base branca; seções alternadas em `#F8FAFC` |
| 3 | Título "Reserva chega por todo lado. A casa fica sem fôlego." com 10 palavras | Headlines com no máximo 8 palavras | "Reserva chega por todo lado." Teste E2E agora bloqueia títulos acima de 8 palavras |
| 4 | Cartões com raio 28 px (`rounded-2xl` no tema do projeto) | Raios 10 / 16 / 20 | Cartões em 16, mockups em 20, botões em 10 (site, Dashboard, Cardápio, Link Hub, páginas públicas) |
| 5 | Hero sem os 4 recursos com ícone | "Hero: ... → 2 CTAs → 4 recursos com ícone" | Faixa de 4 recursos (ícone de 28 px em pílula de 56 px, traço 1,5) |
| 6 | Os mesmos 4 recursos repetidos mais abaixo | Sem redundância (pedido do projeto) | Seção "Tudo conectado" virou a linha Reserva, Cliente, Agenda, Relatórios |
| 7 | Sem seção "Sua marca" | Estrutura oficial: Hero, Como funciona, Recursos, IA, Sua marca, Painel, FAQ, CTA | Seção "Sua marca" com o título oficial "Seu cliente reserva com você. Não com um app." e 3 telas reais (reserva, Link Hub, cardápio) |
| 8 | FAQ em coluna central | FAQ oficial em duas colunas | Título à esquerda, perguntas à direita (desktop) |
| 9 | CTA final: coloquei sólido por engano na primeira rodada da revisão | O site oficial usa o degradê aprovado no cartão final | Degradê oficial (blue-600, 500, 400) restaurado, raio 20 |
| 10 | "usuários no painel" nos planos | "Usuário" é termo evitado para o restaurante | "acessos ao painel" |
| 11 | Título da página com "\|" | Título com "· Teggly" | "Teggly · Mais reservas. Menos trabalho." |
| 12 | Hero em 1024 px quebrava o H1 em 4 linhas | Hierarquia | H1 de 56 px em `lg`, 72 px de `xl` em diante |

### Divergência de conteúdo que fazia o site prometer o que o produto não faz

A conversa do hero mostrava o Assistente oferecendo horários e confirmando a reserva dentro do chat. **O produto real não faz isso**: o Assistente responde dúvidas, envia o link (depois de perguntar) e confirma ou cancela quando o cliente pede. A reserva é feita pelo cliente na página da casa. Corrigido: a conversa agora mostra o Assistente enviando o link e a confirmação chegando com o código; "oferece horários" e "pelo WhatsApp" saíram dos passos; o hero diz "recebe as reservas, confirma e lembra". Nova pergunta no FAQ: "O Assistente pode errar uma reserva?", com resposta fiel ao produto.

### Divergências aceitas e documentadas (não corrigidas)

- **Site de uma página** (o referência tem 9 páginas: Produto, Recursos, Para restaurantes, Preços, Sobre, Contato, Entrar, Começar). Mantive uma página por decisão do projeto (storytelling em sequência) e porque não há cadastro público nem login único.
- **Sem botão "Entrar" no topo**: o acesso é por empresa (`/<slug>/admin`). Rodapé mantém "Área administrativa".
- **Sem foto quente**: o bloco quente em degradê marca o lugar, como a FASE_05 prevê. Foto própria pendente.
- **Telas de Conversas e Automações** do site de referência não existem no produto e não foram mostradas. O painel e o "98% das mesas ocupadas", "+12% vs. sexta" e "9 reservas feitas hoje" do referência são números ilustrativos e **não** foram copiados.
- **Cores do WhatsApp** (`#D9FDD3`, `#ECE5DD`) no mockup de conversa: são as cores da interface de terceiros que a ilustração representa.
- **Nome da empresa de exemplo** "Casa Exemplo" e dados de exemplo nas telas: marcados na página.

## 2. Brand QA completo

| Item | Resultado |
|---|---|
| Logo e símbolo | Só SVGs oficiais; `public/brand` sem alteração no PR |
| Cores | Paleta Teggly; únicas cores extras: as do WhatsApp (ilustração) e o amarelo-laranja do bloco quente (placeholder de foto, previsto) |
| Tipografia e pesos | Manrope 400/500/600/800; nenhum `font-bold` (700) restante |
| Ícones | Set de traço (lucide, 1,75) para funções; glifos oficiais (simple-icons, ~10 KB) para WhatsApp, Instagram, Facebook, TikTok, YouTube, iFood, Google Maps, Google, Spotify. 99Food sem glifo oficial: monograma neutro provisório |
| WhatsApp, Instagram, iFood | Glifos oficiais no Link Hub, página da casa, Clientes e ação "Confirmar"; teste E2E garante |
| Raios e sombras | 10 / 16 / 20; sombras do tema |
| CTAs | Primário "Começar agora" (um por dobra), secundário "Falar com especialista"; planos usam "Começar grátis" e "Falar com especialista" |
| Mockups | Telas reais do produto com dados de exemplo (marcadas); nenhuma métrica inventada |
| White-label | Marca por opt-in; painel segue Teggly; Link Hub e cardápio preparados para banner, ícones e fotos do restaurante; "powered by Teggly" fixo |
| Emoji, travessão | Nenhum introduzido pelo PR (teste E2E e varredura). Pré-existentes fora do PR, em telas antigas: `—` em toasts, rótulos de campo e fallback de dados vazios |
| Radii e tokens no Link Hub | Botões em 10, destaque em 16, banner em 16 |

Observação de UX fora do escopo do PR: a página pública de reserva é um formulário com campo de data nativo; o site de referência mostrava botões de horário. Não é regressão.

## 3. Nenhuma interface externa foi copiada

Busca por "goomer" em `src`, `public`, `e2e` e `supabase`: **zero ocorrências**. Layout, componentes, textos de interface e identidade do cardápio são do Teggly (categorias fixas no topo com busca, categoria ativa, cartões de produto, "Reservar mesa" fixo). O Goomer entrou só como benchmark funcional (documentado). Do Iracema vieram **conteúdo do próprio restaurante**: nomes, descrições (reescritas), preços e URLs de foto. As fotos continuam hospedadas no CDN do Goomer (25 itens): risco de dependência, não cópia de interface. Recomendação mantida: subir as fotos pelo painel.

## 4. Cardápio do Iracema importado (63 itens, 12 categorias)

Verificado no banco de produção. **Não publicado** (`cardapio_publicado = false`; a RPC pública devolve nulo).

- 63 itens, 12 categorias, 25 com foto externa, 1 inativo (Comida di Buteco 2025), 17 sem descrição, nenhum nome duplicado, faixa de R$ 7,00 a R$ 99,90.
- Corrigido nesta revisão (ainda não publicado): "Vodka" para "Vodca" e "Gim" para "Gin", para uniformizar (4 itens).
- **Confirmar com o restaurante**: Bife a cavalo R$ 57,00 (vizinhos terminam em ,90); "Red Bull" e "Red Bull Tropical" (possível duplicidade); "Melancita" lido como "Melancia"; "(NOVIDADE)" removido do Lombo; descrição "Brownie delicioso." removida; grafia "Whiskey Jameson" e "whisky Jack Daniel's" mantidas; preços copiados em 2026-10-08; categoria Comida di Buteco (2025) inativa.
- Tabela completa (original, final, preço, alterações): `docs/cardapio/IRACEMA_REVISAO.md`.

## 5. Planos

Arquitetura revista: catálogo único (`plans.ts`), `tenant_planos` (RLS: empresa lê, só super admin escreve), uso do mês, sem bloqueio, sem billing. **Preços e limites tratados como hipótese comercial inicial**, com 10 premissas numeradas, fonte, confiança e como validar em `TEGGLY_PRICING_STRATEGY.md`. O site diz "valores de lançamento, sujeitos a ajuste". Premissas mais frágeis: custo de WhatsApp por mensagem (H4), canal oficial (H8, falso hoje), conversão (H6) e benchmark de no-show inexistente (H9). Não há mais "ocultar powered by" como benefício (não implementado). Limites de usuários e de clientes são compromisso comercial aplicado manualmente na ativação, não enforcement técnico.

## 6. WhatsApp: caso final 3303 (reauditado)

Ver `TEGGLY_WHATSAPP_VOICE_AUDIT.md` (reescrito). Resumo da separação:

| Problema | Veredito |
|---|---|
| Copy | Real; vem do **template cadastrado da empresa** (`tenants.mensagem_confirmacao`), não do código |
| Duplicidade | Real: agradecimento (n8n) + confirmação (banco para n8n), ~0,5 s de diferença |
| Perda de contexto | Real: template estático; mensagens automáticas fora da conversa do agente |
| Memória do agente | Real: nada é gravado em `n8n_chat_histories_iracema`; chave por telefone com risco de `@lid` |
| Concorrência | Dois workflows pelo mesmo evento; ordem não garantida; sem execução repetida |
| Banco versus n8n | Banco dispara confirmação, cancelamento e pedido; n8n também confirma por conta própria |

Confirmado com 3 pares de execuções reais (20:37, 21:47 e 23:48 de 2026-10-07): sempre o mesmo padrão.

## 7. A correção publicada no n8n

Revisão encontrou **duas falhas na minha entrega anterior**:

1. A versão `78c0bf73` mudou `{data}` para o formato por extenso **também nos templates personalizados** (Iracema e Mambaia). Regressão. Corrigida na versão **`9baadcbf`** (ativa): `{data}` idêntico ao original; formato por extenso em `{data_extenso}`, só nos textos padrão. Provado com 5 cargas: saída dos templates personalizados **byte a byte igual** à versão original.
2. A correção de "Olá, tudo bem?" **não alcança a confirmação do Iracema**, porque ela usa o template da empresa. Meu relato anterior estava errado nesse ponto. Efeito real: cancelamento padrão (sem saudação) e pedido de confirmação (linha restaurada, data por extenso). A saudação da confirmação precisa de decisão do proprietário (comando e rollback no documento de WhatsApp).

Operação preservada: gatilho, segredo, rotas, credenciais, escolha de template, normalização de telefone e envio. Rollback: restaurar `019144b5`.

## 8. Verificações

| Verificação | Resultado |
|---|---|
| Typecheck | verde |
| Lint | 0 erros (13 avisos react-refresh antigos) |
| Unitários | 199 passando |
| E2E | 95 passando (15 ignorados por projeto), incluindo QA em 14 viewports e alvos de toque de 44 px |
| Build | verde |
| Visual em 14 viewports | Site, Link Hub, Cardápio e Dashboard inspecionados (folhas de contato) em 320×568 a 1920×1080: sem corte nem overflow; H1 do hero ajustado em 1024 |
| Advisors de segurança do banco | Sem achado novo |

## 9. Parecer

| Área | Parecer |
|---|---|
| Brand System | OK |
| Website | OK (com divergências aceitas listadas) |
| UX | OK |
| Cardápio | OK para revisão humana e publicação posterior |
| WhatsApp | Risco residual: saudação na confirmação do Iracema (dado da empresa), duas mensagens por "sim", memória do agente, EvolutionAPI não oficial |
| CI | Verde localmente; checar o CI do GitHub antes do merge |
| E2E | Verde |
