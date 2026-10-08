# Teggly: estratégia de preço e planos

Base: `TEGGLY_MARKET_PRICING_RESEARCH.md`. **Todos os preços e limites abaixo são propostas de lançamento, a validar com custo real de mensagens e com os primeiros clientes.** Premissas de custo e de conversão são hipóteses de trabalho e estão marcadas como tais. Não há billing: nenhum plano é cobrado no produto.

## 1. Planos propostos

| | Gratuito | Essencial | Pro |
|---|---|---|---|
| Para quem | Casa que quer sair do caderno | Casa com movimento semanal fixo | Casa cheia, equipe, mais de uma frente de atendimento |
| Mensal | R$ 0 | R$ 89 | R$ 189 |
| Anual | R$ 0 | R$ 890 por ano (R$ 74,17/mês) | R$ 1.890 por ano (R$ 157,50/mês) |
| Desconto anual | n/a | 17% (2 meses grátis) | 17% (2 meses grátis) |
| Reservas por mês | **40** | 200 | 800 |
| Cardápio digital | Sim | Sim | Sim |
| Link Hub | Sim (1 página, banner e links) | Sim | Sim |
| Página pública de reserva | Sim | Sim | Sim |
| Confirmação e lembrete no WhatsApp | Não (aviso por link de acompanhamento) | Sim | Sim |
| Assistente (IA no WhatsApp) | Não | Não | Sim |
| Reconfirmação automática | Não | Sim | Sim |
| Clientes e histórico | Sim, até 200 clientes | Ilimitado | Ilimitado |
| Relatórios | Resumo do dia | Período e tipo | Completos e exportação |
| Marca do restaurante (logo e cor, opt-in) | Sim | Sim | Sim |
| "powered by Teggly" | Sempre | Sempre | Pode ocultar (white-label) |
| Usuários do painel | 1 | 3 | 10 |
| Suporte | Central de ajuda | E-mail | Prioritário |
| Rede (várias unidades) | n/a | n/a | Fale com a gente |

"Rede" não é um quarto plano: é uma conversa comercial, sem preço publicado. Três planos mantêm a decisão simples.

## 2. Por que 40 reservas por mês no gratuito

Âncoras de mercado: resOS limita em 25 reservas por 30 dias; Goomer em 30 pedidos por mês. Para ser "generoso" de verdade, Teggly fica acima das duas: **40**, ou cerca de 10 por semana.

- **Valor percebido:** 40 reservas cobrem por inteiro uma casa pequena que reserva só no fim de semana. Ela sente o produto funcionando sem pagar.
- **Gatilho de conversão natural:** uma casa com movimento real chega a 40 em algumas semanas. O limite aparece quando o produto já provou valor, não antes.
- **Custo (hipótese):** o plano gratuito não envia WhatsApp proativo, então o custo por reserva é infraestrutura e armazenamento, centavos. 40 reservas ficam abaixo de R$ 5 por mês por casa mesmo com margem de erro.
- **Aquisição:** é o menor atrito possível: sem cartão, sem prazo, com o cardápio e o Link Hub (que a casa já precisa) incluídos.
- **Comportamento ao estourar o limite:** a página de reserva continua aceitando reservas por 7 dias e o painel convida a escolher um plano (padrão resOS, sem refém). Nunca esconder reservas já feitas.

Alternativas descartadas: 25 (igual ao resOS, pouco diferencial); 100 (custo e canibalização do Essencial, já que uma casa média nunca precisaria pagar).

## 3. Por que esses preços

- **Essencial R$ 89**: abaixo do Goomer Básico mensal (R$ 99,90) e muito abaixo de Anota AI (~R$ 300), SocialHub (R$ 197) e Saipos (R$ 240). É o preço de "um almoço executivo por mês". Entrega algo que nenhum deles entrega junto: reserva com confirmação e lembrete no WhatsApp.
- **Pro R$ 189**: abaixo de SocialHub/Huggy (R$ 197 a 199) e de Anota AI, com Assistente (IA) incluso (no Huggy a IA é paga à parte). Ainda é uma fração dos US$ 249+ de Resy e dos US$ 149+ da OpenTable (que ainda cobra por cover).
- **Anual 17%**: 2 meses grátis é fácil de entender e fica abaixo do 20% do resOS. Anual reduz churn e antecipa caixa.
- **Sem fidelidade, sem taxa por reserva, sem comissão**: contra OpenTable e Get In, em que o cliente "é deles".

## 4. Economia por plano (hipóteses a validar)

Premissas, nenhuma confirmada com dados do produto:
- Mensagens proativas por reserva no Essencial e no Pro: 3 modelos de utilidade (pedido de confirmação, confirmação, lembrete), a ~R$ 0,05 cada (preço aproximado de fornecedor para o Brasil, fontes divergem; ver pesquisa) = **~R$ 0,15 por reserva**.
- Assistente (IA): custo de modelo pequeno por conversa, estimado em centavos; mensagens iniciadas pelo cliente na janela de 24 h tratadas como R$ 0 (a confirmar na Meta).
- Taxa de cobrança (futura): 3 a 5% do valor.

| | Essencial | Pro |
|---|---|---|
| Receita mensal | R$ 89 | R$ 189 |
| Custo de WhatsApp no teto do limite | 200 × 0,15 = R$ 30 | 800 × 0,15 = R$ 120 |
| Margem bruta no teto (antes de IA e cobrança) | ~66% | ~36% |
| Margem com uso a 50% do teto | ~83% | ~68% |

Leitura: o Pro no teto de 800 reservas é o ponto frágil. Por isso o limite é 800 (não ilimitado) e deve ser revisto com o consumo real das primeiras casas. Se a Meta cobrar mensagens de serviço, a margem do Pro cai e o limite desce ou o preço sobe.

## 5. Funil e metas (hipóteses de trabalho, não dados)

- Alvo de conversão grátis para pago: meta inicial **3% a 5%**, a ser medida (referência de mercado informal, sem fonte verificada; trate como meta, não como previsão).
- ARPU alvo entre os pagos: mistura de 70% Essencial e 30% Pro = ~R$ 119.
- CAC: sem dado. Premissa operacional: aquisição por indicação, Instagram do Iracema e Link Hub com "powered by Teggly" nas páginas das casas (canal de custo quase zero). Revisar quando houver os primeiros 20 clientes.
- Ponto de equilíbrio por cliente pago: se o CAC for R$ 300, o Essencial paga em ~4 meses e o Pro em ~2,5 meses de margem. Cálculo ilustrativo, não previsão.

## 6. Por perfil de cliente

- **Casa pequena (bistrô, bar de bairro):** Gratuito resolve. Quando passa de 40 reservas, Essencial por R$ 89 substitui horas de WhatsApp.
- **Casa média com fim de semana cheio:** Essencial a Pro. O Assistente passa a valer quando o dono não consegue mais responder à noite.
- **Grupo (várias unidades):** Pro por unidade ou proposta de Rede. Fora do preço público.

## 7. Riscos comerciais

1. **Canal oficial do WhatsApp**: sem API oficial, o produto pago depende de ferramenta não oficial, sujeita a bloqueio de número. Decisão do proprietário.
2. **Custo de mensagens**: mudança de política da Meta altera a margem do Pro.
3. **Goomer como cardápio**: o cardápio grátis iguala a oferta, mas não vence quem já está instalado; o ganho vem do vínculo cardápio, Link Hub e reserva.
4. **Sem billing**: até existir cobrança, planos pagos são vendidos por contato e ativados pelo Admin. O site não deve sugerir assinatura online.

## 8. Implementação sem billing

- Catálogo de planos, entitlements e limites em código (`src/lib/plans.ts`), com testes.
- Plano atual por empresa: tabela `tenant_planos` (somente super admin escreve; a empresa só lê). Empresa sem registro vale como **Pro de lançamento** para não limitar quem já usa o produto.
- Limites medidos (reservas do mês) e exibidos no painel, sem bloquear.
- Tela "Seu plano" em Configurações e comparação, com contato por e-mail para mudar de plano.
- Preparado para uma camada futura de cobrança (campo de plano e vigência; nenhum provedor integrado).
