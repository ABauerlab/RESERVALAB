# Teggly: Link Hub

Fase E. Não é um clone de Linktree: é a porta de entrada do restaurante, com **Reservar mesa** sempre em primeiro e o resto ligado ao que a casa já cadastrou.

## Ordem da página pública

1. Banner (opcional, 3:1).
2. Nome do restaurante e descrição curta (até 280 caracteres).
3. **Reservar mesa** (CTA principal, único em azul cheio).
4. Cardápio (se publicado **e** o toggle "Mostrar cardápio" estiver ligado).
5. Destaques (iFood, 99Food, qualquer link marcado): cartão maior, ícone de 24 px na cor da marca.
6. WhatsApp, Instagram, Como chegar, Ligar (automáticos, saem dos dados da casa).
7. Demais links extras, na ordem escolhida.
8. "powered by Teggly".

White-label por opt-in: a marca da empresa (logo e cor) continua vindo de "Usar minha marca nas páginas públicas", como antes.

## Painel (Link Hub)

- Publicar página, copiar link, ver página.
- Banner: enviar (reduzido no navegador para 1200 × 400 WebP), prévia, ativar/desativar, remover. Sem banner, a página abre direto no nome do restaurante.
- Descrição curta.
- Toggle **Mostrar cardápio** (ligado por padrão; se o cardápio não estiver publicado, explica e leva a "Publicar cardápio").
- Instagram.
- Links extras: ícone, destaque, subir/descer, ocultar, excluir.
- Seletor de ícone: Automático (reconhece a marca pelo endereço), biblioteca, ou **enviar o próprio**; prévia; "Usar este ícone".

## Biblioteca de ícones

Marcas externas usam o glifo oficial (pacote `simple-icons`, só os glifos usados entram no bundle, ~10 KB): WhatsApp, Instagram, Facebook, TikTok, YouTube, iFood, Google Maps, Avaliações no Google, Spotify. Funções da casa usam o set de traço do Teggly: Reservas, Cardápio, Delivery, Telefone, Localização, Eventos, Site, E-mail, Link.

**99Food**: não há glifo oficial disponível no pacote e não desenhamos marca de terceiros. Hoje aparece como monograma neutro "99". **Provisório**: a casa sobe o ícone oficial pelo "Enviar meu ícone".

Regra aplicada no produto inteiro: balão de chat para WhatsApp acabou (Link Hub, atalhos da página da casa, Clientes, ação "Confirmar" da reserva).

## Dados (F11, aditivo, aplicado em produção)

`tenant_perfil`: `hub_descricao`, `hub_banner_url`, `hub_banner_ativo`, `hub_mostrar_cardapio`. `hub_links`: `icone`, `icone_url`, `destaque`. `hub_do_tenant` devolve as chaves antigas mais as novas (clientes antigos ignoram o que não conhecem) e ordena destaque primeiro. Banner inativo não vaza pela RPC. Constraints: URL do banner e do ícone só http(s), chave de ícone `[a-z0-9_]{1,32}`, descrição até 280.

Storage: bucket público `tenant-assets` (2 MB, PNG/JPEG/WebP, sem SVG). Escrita só do admin da própria empresa (primeira pasta do caminho é o `tenant_id`, validada por regex antes do cast). Leitura pública por URL.

Testado em transação revertida: chaves antigas preservadas, toggle padrão ligado, banner inativo não vaza, `javascript:` bloqueado, chave inválida bloqueada, destaque primeiro, `anon` sem acesso à tabela de planos e sem upload. Documento da migração e rollback: `docs/database/applied/f11_link_hub_planos_storage.sql`.

## De onde chega e para onde vai

Chega: Hoje (atalho), Configurações, bio do Instagram. Vai: reserva (CTA), cardápio, WhatsApp, delivery, Instagram, localização. Cada clique de "Reservar mesa" cai na agenda como qualquer reserva pública.

## Pendências

- Pré-visualização ao vivo ao lado do formulário (hoje: "Ver página").
- Arrastar para reordenar (hoje: subir/descer).
- Cliques por link (relatório do Hub) exigem tabela de eventos; não criada para não coletar dado sem necessidade.
