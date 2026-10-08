# F13: polimento e evolução do produto

Resumo do que foi entregue e do que fica para depois. Detalhes por PR no GitHub.

## Entregue

| PR  | Tema                                             | Destaques                                                                                                          |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| #38 | Dashboard, Reservas por data, navegação          | Atenção primeiro, dia, próximos dias, 30 dias com dados reais, atalhos. Seletor de dia. Filtros e reserva na URL.  |
| #39 | Link Hub                                         | Uma tela de 320x568 a 1920x1080, ordem de conversão, selo "Comida de Buteco", mapa do Google validado.             |
| #40 | Cardápio                                         | Detalhe do prato, foto ampliada, destaques, 4 layouts, "Sugerir layout" nativo, editor em abas com prévia.         |
| #41 | Eventos                                          | Flyer em qualquer proporção (sem corte), tamanho real guardado, ampliar, próximo evento no Link Hub.               |
| #42 | Onboarding                                       | Ensina nas páginas reais (Dashboard, Reservas, Agenda, Cardápio, Link Hub, Eventos, Ajustes), pulável e retomável. |
| G   | Acessibilidade e públicas                        | Zoom liberado (sem `maximum-scale`), prévia do cardápio com `noindex`, `tenant_id` extra ao remover evento.        |

## Banco (aplicado em produção, aditivo)

`docs/database/applied/f13_polimento_hub_cardapio_eventos.sql`: `hub_selo`, `hub_mapa_url`, `cardapio_layout`, `cardapio_itens.destaque`, `eventos_destaque.imagem_largura/altura`; `hub_do_tenant` e `cardapio_do_tenant` com chaves extras; função nova `evento_destaque_do_tenant`. Trocar o retorno de `proximo_evento_do_tenant` (DROP) travou em produção e foi abandonado: a função antiga segue intacta. Sem RLS alterada.

## Decisões

- Sugestão de layout é regra determinística em `src/lib/cardapio-layout.ts`, sem IA externa. Só grava `cardapio_layout`.
- Mapa: só a URL `https://www.google.com/maps/embed?pb=...` é aceita e guardada (app + CHECK no banco). O iframe é montado pela página, com sandbox.
- Dashboard: nenhuma métrica inventada (sem faturamento, ticket ou ocupação). Os números dos 30 dias leem até 1000 reservas recentes.
- WhatsApp/n8n e domínio: não foram tocados.

## Para a próxima fase

- Memória do agente de WhatsApp (documentada, não alterada).
- Open Graph por restaurante (título/imagem do banner) exige carregar dados no servidor.
- Ocupação/capacidade no Dashboard: só quando existir capacidade cadastrada.
- Reordenar cardápio por arrastar e soltar.
- Cutover do domínio teggly.com.br na Hostinger: manual, pelo proprietário (`docs/TEGGLY_DOMAIN_CUTOVER.md`).
