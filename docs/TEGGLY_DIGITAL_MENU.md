# Teggly: cardápio digital

Fase F. Cardápio é grátis em todos os planos e não tem pedido, carrinho, pagamento nem delivery próprio (fora de escopo; o modelo de dados deixa espaço para evoluir).

## Modelo

| Categoria | Produto |
|---|---|
| nome, descrição opcional, ordem, ativo | nome, foto, descrição, preço (centavos, opcional), categoria, ordem, ativo |

Tabelas `cardapio_categorias` e `cardapio_itens` (F9), RLS por empresa, leitura pública só pela RPC `cardapio_do_tenant(slug)` e só quando `cardapio_publicado = true`. Categoria sem item ativo não aparece. Preço ausente vira "sob consulta" (sem valor).

Evolução futura sem quebrar o modelo: colunas aditivas (variações e adicionais, tags de restrição, disponibilidade por horário, destaque). Pedido e pagamento exigiriam tabelas novas e uma camada própria; nada disso foi implementado.

## Fotos

Novo nesta fase: envio de foto no painel (Cardápio, item, "Enviar foto"). A imagem é reduzida no navegador para 800 × 600 em WebP e vai para o bucket `tenant-assets/<tenant_id>/`. A URL por endereço continua aceita.

## O que foi estudado no Goomer (benchmark funcional, sem copiar)

Cardápio público do Iracema (iracema.goomer.app), visto como cliente. Observações de categoria, não de implementação:

- Navegação por categorias em barra fixa no topo; lista única com rolagem.
- Cada produto: nome, descrição curta com "Ver mais" (truncada em ~80 caracteres), preço, foto quando existe.
- Fluxo orientado a delivery: pede endereço antes de mostrar o resto; status "Fechada" no topo.
- Muitas fotos ausentes (38 de 63 produtos sem foto), nomes e descrições com erros e formatos diferentes.

O Teggly resolve de outro jeito: menu como leitura, busca instantânea sem acento, categoria ativa destacada ao rolar, foto pequena e opcional, e sempre "Reservar mesa" fixo embaixo. Layout, textos, identidade e componentes são do Teggly.

## Iracema como caso real

Conteúdo público do próprio Iracema reconstruído no Teggly (63 produtos em 12 categorias). Estado em produção: **importado e não publicado** (`cardapio_publicado = false`). O proprietário revisa e publica em Cardápio, "Publicar cardápio". Arquivos: `docs/cardapio/iracema-seed.json` (com texto original ao lado do revisado) e `docs/database/applied/f12_cardapio_iracema_seed.sql`.

Revisão feita:

- Categorias: "Entradas / Petiscos" virou "Entradas e petiscos"; "Principais" virou "Pratos principais"; "Bebidas - Sem Álcool" virou "Bebidas sem álcool"; "Drinks / Coquetéis" virou "Drinks e coquetéis"; "Drinks / Coquetéis Sem Alcool" virou "Drinks sem álcool". A ordem agora segue a refeição (entradas, pratos, massas, saladas, guarnições, sobremesas, bebidas, cervejas, drinks, doses).
- Ortografia e acentos: Agua para Água, "Agua Tônica Lata" para "Água tônica" (descrição "Lata."), baunilia para baunilha, Moscou Mule para Moscow Mule, "Caipivokda" para "Caipivodca", "Whisky Jack Daniels" para "whisky Jack Daniel's", salteadas para salteados (cubos).
- Padronização: sentence case nos nomes; descrições em frases com ponto final; "(servem 2 pessoas)" virou "Serve 2 pessoas."; "600ml" virou "600 ml"; "c/" virou "com"; nomes de cerveja sem repetir "Cerveja" (a categoria já diz).
- Itens com nome duplicado na descrição (ex.: "Dose Cachaça" com descrição "Dose Cachaça") ficaram sem descrição, sem inventar texto.
- "Massas: Talharim" virou categoria Massas, item "Talharim".
- "(NOVIDADE)" saiu do nome do Lombo cremoso (rótulo temporário).
- "Harumaki de Carne de Panela - 2025" (Comida di Buteco 2025) foi para a categoria "Comida di Buteco (2025)", **inativa**. Ativar só se a ação voltar.
- Fotos: 25 de 63 produtos têm foto, usadas por endereço (CDN do Goomer). **Risco:** se a conta do Goomer for encerrada, as imagens somem. Recomendação: subir as fotos pelo painel (envio novo) antes de desligar o Goomer.

A confirmar com a casa (não decidido por mim): "Red bull" e "Red Bull Tropical" parecem duplicados; "Melancita" foi lido como "Melancia" (edição do Red Bull); preços de drinks e doses seguem os do Goomer em 2026-10-08.

Os pratos do dia que o atendimento do WhatsApp cita (parmegiana, feijoada...) **não** estão no Goomer. Se a casa quiser, cadastrar como categoria "Prato do dia" e, num segundo momento, alimentar a base do Assistente a partir do cardápio do Teggly.

## Conexões

- Cardápio, Link Hub, página de reserva: o cardápio público tem "Reservar mesa" fixo; o Link Hub mostra "Cardápio" logo depois de "Reservar mesa", e o botão tem toggle próprio.
- WhatsApp: o link do cardápio do Assistente (hoje Goomer) pode apontar para `/<slug>/cardapio` quando o proprietário publicar.

## Testes

Unidade: filtro sem acento. E2E: do painel à página pública (categoria, item com foto, publicar), busca, estado não publicado, overflow em desktop e mobile.
