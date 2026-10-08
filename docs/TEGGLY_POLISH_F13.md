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

## F14: capacidade, Open Graph por restaurante, arrastar no cardápio e fotos do Iracema

- **Capacidade** (Ajustes > Reservas): limite de pessoas por dia e por horário, opcional. A reserva pública (`criar_reserva`) e a alteração pelo código (`update_reserva_by_codigo`) recusam o que passar do limite ("lotado"); reservas feitas pelo painel nunca são bloqueadas. A página de reserva avisa antes de enviar e esconde horários que não comportam o grupo (`capacidade_do_dia`, só números agregados). SQL em `docs/database/applied/f14_capacidade.sql`. Atenção: o agente de WhatsApp que chama `criar_reserva` passa a receber o erro "Capacidade do dia/horario esgotada" quando a casa define limite.
- **Open Graph por restaurante** (`src/lib/og.ts`): o preview de `/{slug}`, `/{slug}/links` e `/{slug}/cardapio` usa o nome, o selo, a frase e a imagem da casa (banner do Link Hub, senão foto de um prato do cardápio publicado, senão a imagem padrão). Gerado no servidor a partir de conteúdo já público; sem dados, cai no preview genérico. Uma arte de compartilhamento desenhada automaticamente (texto sobre a foto) exigiria uma biblioteca de rasterização no servidor; fica como evolução.
- **Arrastar no cardápio**: categorias e itens se reordenam arrastando (mouse, toque segurando um instante, teclado: espaço, setas, espaço). As setas continuam como alternativa. Usa `@dnd-kit` (só no painel).
- **Fotos do Iracema**: 60 itens receberam as fotos do novo ensaio (`produto-<id>-ensaio.webp`, até 900 px, WebP). Ficaram sem foto: Acréscimo de molho, Soda italiana e o item inativo da categoria "Comida di Buteco".

## F15: ajustes finais

- Cardapio: textos de 49 itens do Iracema revisados (`f15_iracema_textos_revisados.sql`); a descricao aparece em todos os layouts, inclusive cards com foto e na faixa de destaques.
- Mapa: causa raiz do erro ao salvar era o CHECK do banco (`{10,2000}` passa do limite 255 do Postgres). Corrigido em `f15_mapa_check.sql`. O app guarda so a URL `https://www.google.com/maps/embed?pb=...` extraida do iframe.
- Link Hub: selo removido (e a secao do painel), endereco completo no cabecalho, card de EVENTO (badge, data, hora, "Ver"), botoes com profundidade e micro-interacoes em React (`HubBotao`), delivery (iFood/99Food) com prioridade e etiqueta. Destinos inalterados.

## F16: performance, cardapio e dominio

- **Performance**: a navegacao entre paginas publicas deixou de esperar por uma busca so de titulo (o loader de Open Graph agora so busca no servidor; no navegador usa o que o Link Hub ja carregou). Roteador com `defaultPreload: "intent"` (carrega a pagina ao apontar/tocar) e consultas com `staleTime` de 15 s (sem refazer tudo a cada foco da janela). O banner do Link Hub so e baixado em telas altas (antes era baixado e escondido em telas baixas). Atencao: o banner atual do Iracema e um PNG de 1,1 MB; reenviar pelo painel o comprime em WebP.
- **Cardapio**: 16 itens sem descricao receberam texto curto com informacao ja existente (`f16_iracema_descricoes.sql`); "Catupiry" com maiuscula.
- **Dominio**: links copiados e enviados pelo painel usam `https://teggly.com.br` (`origemPublica()` em `src/lib/site.ts`; em localhost segue o endereco aberto). Workflows n8n de atendimento, confirmacao e lembrete atualizados. Mantidos de proposito: `n8n.bauerlab.com.br` (webhooks do banco), IP da EvolutionAPI e URLs do Supabase (infra).
- **Logo do Teggly**: toda logo leva a `https://teggly.com.br/` (`TegglyLogo`), abrindo em outra aba.
- **Visual**: gradiente simples no fundo do Link Hub e da pagina de reserva (`bg-pagina`); botoes ficaram planos, com borda e sombra.
