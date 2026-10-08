# TEGGLY: Product & Brand Execution Report

Data: 2026-10-08. Branch: `claude/clever-mccarthy-d6snnr` (o ambiente exige uma única branch; as fases entraram como commits separados).

## 1. Resumo

| Fase | Estado |
|---|---|
| A. Auditoria (marca, produto, técnica) | Feita: `TEGGLY_PRODUCT_BRAND_AUDIT.md` |
| B. Website (FASE_05) | Reconstruído, com produto real e planos |
| C. Dashboard | Feito (KPIs reais, clientes de casa, uso do plano) |
| D. Onboarding | Feito (pós-login, pulável, retomável, refazer em Ajustes) |
| E. Link Hub | Banner, descrição, toggle de cardápio, destaques, biblioteca e upload de ícones |
| F. Cardápio | Foto por envio, busca, categoria ativa; cardápio do Iracema importado (não publicado) |
| G. Preço e planos | Pesquisa, estratégia, catálogo, "Seu plano", sem billing |
| H. WhatsApp | Causa raiz do "sim" achada; copy corrigida e publicada; mudanças estruturais propostas |
| I. Polimento | Peso 700, alias `terracotta`, ícones de marca, datas |
| J. QA final | Typecheck, lint, 199 testes, 93 E2E, build, QA em 14 tamanhos |

## 2. O que estava fora do Brand System e foi corrigido

- Website inteiro (marca BauerLab, domínio, 12 cards iguais, mockups desenhados, sem preços): reconstruído.
- WhatsApp com balão de chat, Instagram com glifo genérico, iFood com seta: glifos oficiais e biblioteca de ícones.
- 35 usos de peso 700 e alias `terracotta`: removidos/renomeados (`brand`).
- Datas no painel (`Quarta, 07/10/2026`): "Quarta-feira, 7 de outubro".
- Fallback de cor do restaurante em Ajustes era terracota: agora Teggly Blue.

## 3. Website

Hero fiel à FASE_05 ("Mais reservas. Menos trabalho."), problema e solução em uma seção, Como funciona em linha + gota, painel com telas reais (dados de exemplo), uma seção escura (automação e Assistente), tudo conectado com Link Hub e cardápio, prova (Iracema em uso, sem métrica), planos (mensal/anual, limites explícitos), FAQ, CTA único "Começar agora" para o e-mail oficial. Sem depoimento nem número inventado. Domínio **não** migrado (canonical e og seguem em `reserva.bauerlab.com.br`).

Mockups: capturas reais do produto sobre dados de exemplo (nomes fictícios, "Casa Exemplo"), marcadas na página. A conversa de WhatsApp do hero é uma ilustração com o texto que o sistema envia, marcada como exemplo. O bloco quente em degradê substitui a foto, como a FASE_05 prevê, até haver foto própria. **Provisórios documentados.** O site oficial de referência mostrava telas de Conversas e Automações que o produto ainda não tem; não foram mostradas.

## 4. Dashboard, Onboarding, Link Hub, Cardápio

Ver `TEGGLY_ONBOARDING.md`, `TEGGLY_LINK_HUB.md`, `TEGGLY_DIGITAL_MENU.md` e `TEGGLY_PRODUCT_ARCHITECTURE.md`. Dashboard: resumo do dia em números reais (nenhuma métrica inventada), cada cartão leva à área da ação; "Clientes de casa" a partir do histórico real; cartão de uso do plano só quando o time definiu um plano.

## 5. Pesquisa e preços

`TEGGLY_MARKET_PRICING_RESEARCH.md` e `TEGGLY_PRICING_STRATEGY.md`. Concorrentes analisados: Goomer, Anota AI, Saipos, Get In, Tagme, SocialHub, Huggy, OpenTable, Resy, SevenRooms, Tock, resOS, e o concorrente real (WhatsApp, planilha e caderno). Preços **encontrados**: Goomer (grátis 30 pedidos; R$ 99,90 e R$ 184,90 no mensal), Anota AI (~R$ 299,99), Saipos (a partir de R$ 240,79), OpenTable (US$ 149 a 499 + por cover), Resy (US$ 249 a 899), resOS (grátis até 25 reservas por 30 dias). Get In e Tagme: não encontrado. Nenhum benchmark brasileiro de no-show foi achado; o site não cita percentual.

Planos propostos: **Gratuito R$ 0 (40 reservas/mês, cardápio e Link Hub incluídos), Essencial R$ 89 (R$ 890/ano, 200 reservas), Pro R$ 189 (R$ 1.890/ano, 800 reservas)**. Justificativa de preço, limites e margens (com premissas marcadas como hipótese) no documento de estratégia. Ponto frágil: margem do Pro no teto de uso e custo de mensagens da Meta (fontes divergem).

Implementado sem billing: catálogo e entitlements (`src/lib/plans.ts`), `tenant_planos` (somente super admin escreve), uso do mês, "Seu plano" com comparação, plano no onboarding e no Dashboard. Nenhum checkout, nenhum provedor.

## 6. WhatsApp, n8n e o problema do contexto

`TEGGLY_WHATSAPP_VOICE_AUDIT.md`. Causa raiz: dois caminhos independentes respondem ao mesmo "sim" (agradecimento fixo do n8n e confirmação do gatilho do banco); o segundo é um template estático que sempre abre com "Olá, tudo bem?". Agravantes: mensagens automáticas fora da memória do agente, chave da memória por `@lid`, filtro apagando a linha "Recebemos sua reserva no X:".

Corrigido e **publicado**: copy da confirmação e do cancelamento sem saudação de abertura, datas por extenso, linha restaurada. Versão `78c0bf73`; rollback `019144b5`. Testado só localmente com cargas de exemplo. Nada foi executado nem enviado. Não alterado: lógica, gatilhos, templates da empresa, credenciais, EvolutionAPI. Propostas estruturais (uma resposta só ao "sim", gravar automáticas na memória, chave normalizada) aguardam decisão.

## 7. Banco, RLS, segurança

- F11 (aplicada em produção, testada em transação revertida): colunas novas em `tenant_perfil` e `hub_links`, `hub_do_tenant` ampliada (chaves antigas preservadas), `tenant_planos`, bucket `tenant-assets`. Aditiva e reversível; rollback em `docs/database/applied/f11_link_hub_planos_storage.sql`.
- F12 (aplicada): 12 categorias e 63 itens do Iracema, `cardapio_publicado` continua falso.
- Advisors de segurança depois das mudanças: nenhum achado novo. Pré-existentes: RPCs `SECURITY DEFINER` executáveis por `anon` (usadas pelo n8n e pelas páginas públicas), `rls_auto_enable` executável por `anon`, proteção de senha vazada desativada, `n8n_chat_histories_iracema` sem policy (intencional).
- Fronteira de tenant: toda escrita nova leva `tenant_id`; storage valida a pasta; RPCs públicas por slug.

## 8. Qualidade

| Verificação | Resultado |
|---|---|
| Typecheck | verde |
| Lint | 0 erros (13 avisos react-refresh, antigos) |
| Unitários | 199 passando (de 154) |
| E2E | 93 passando, 15 ignorados por projeto (QA responsivo roda só no desktop) |
| Build | verde |
| QA responsivo | 14 tamanhos (320x568 a 1920x1080) em 11 páginas, sem overflow; alvos de toque de 44 px |

E2E novos: website, Link Hub (banner, destaque, ícone, toggle, publicar), cardápio (painel até a página pública, busca), Dashboard, onboarding (novo usuário, pular, retomar, Esc, refazer), responsivo.

## 9. Pendências e riscos

1. **Decisão do proprietário:** uma resposta só ao "sim" (remover o agradecimento) e memória do agente.
2. **Canal oficial do WhatsApp**: EvolutionAPI (HTTP por IP, não oficial). Risco de bloqueio e de margem.
3. Revisar e publicar o cardápio do Iracema; subir as fotos pelo painel antes de desligar o Goomer (hoje são links do CDN dele).
4. Itens a confirmar com a casa: "Red Bull" duplicado, "Melancita", "(NOVIDADE)" removido, categoria Comida di Buteco inativa.
5. 99Food sem glifo oficial: monograma provisório; a casa sobe o ícone.
6. Domínio (`teggly.com.br`) e og-image: não migrados, como pedido.
7. Segredo do webhook em texto no n8n; webhook de entrada sem autenticação (pendências da F3).
8. Preços e limites são propostas de lançamento. Premissas de custo e conversão são hipóteses a validar com o consumo real.
9. Migrations do repositório seguem divergentes do banco de produção (`LIVE_STATE.md`).
10. O texto da mensagem do botão de WhatsApp do site ainda cita "ReservaLab" (mantido: pode ser lido por automações fora do repositório).

## 10. Recomendações

- Painel de "Conversas" e "Automações" (existem na FASE_05, não no produto) só entram no site quando existirem.
- Medir funil: visitas, "Começar agora", cadastros pelo Admin, 40 reservas atingidas, ativações pagas.
- Mostrar o Link Hub de cada casa como canal de aquisição ("powered by Teggly" já está lá).
- Cliques por link no Hub e origem da reserva (Hub, WhatsApp, balcão) para o Dashboard.
- Importador de cardápio por foto ou planilha para as próximas casas.
- Avisar o dono quando o uso chegar a 80% do plano, com mensagem no WhatsApp dele.
