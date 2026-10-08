# Iracema: migração das imagens do Goomer para o storage da Teggly

Data: 2026-10-08. Estado do cardápio: **NÃO PUBLICADO** (`tenant_perfil.cardapio_publicado = false`). 63 produtos, 12 categorias.

## Resultado

| Item                                       | Valor                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Imagens externas identificadas             | 25 (todas em `www.goomer.app/webmenu/iracema/product/.../picture/medium/...`)             |
| Baixadas e gravadas na Teggly              | 25 de 25                                                                                  |
| `imagem_url` ainda apontando para o Goomer | 0                                                                                         |
| Produtos sem foto (nunca tiveram)          | 38                                                                                        |
| Bucket                                     | `tenant-assets` (público para leitura, limite 2 MB, png/jpeg/webp)                        |
| Caminho                                    | `13bb5e82-5d83-4db6-9fdc-aa0653bc83cc/produto-<id do item>.jpg` (pasta do tenant Iracema) |

## Como foi feito

1. As URLs eram públicas: `GET` simples respondeu 200 com `image/jpeg` para as 25, sem login, captcha, cookie ou cabeçalho especial. Nada de proteção foi contornado.
2. Uma função temporária de uso único (`tmp-migrar-imagens-iracema`) baixou cada arquivo, checou assinatura JPEG e tamanho (máx. 2 MB), gravou no bucket e só então atualizou `cardapio_itens.imagem_url`, filtrando por `id` do item **e** `tenant_id` do Iracema e apenas quando a URL antiga ainda era do Goomer (idempotente).
3. A função foi substituída por um stub que responde 410. Pode ser apagada no painel do Supabase (a ferramenta usada não remove funções).
4. Os arquivos foram gravados como vieram (JPEG "medium", 4 a 26 KB). Não houve reprocessamento.

## Validações

- Contagem no banco: 25 itens com URL própria, 0 com Goomer, 38 sem foto.
- 25 objetos em `storage.objects` sob a pasta do tenant.
- Leitura pública de uma imagem: HTTP 200 `image/jpeg`.
- Isolamento: caminho sempre `<tenant_id>/...`; a escrita pelo painel continua protegida pela RLS de storage já existente (pasta do próprio tenant).

## Pendências reais

- As imagens "medium" são pequenas (poucas dezenas de KB). Se o dono quiser fotos maiores, precisa enviar os originais pelo painel (Cardápio, ícone de foto).
- Direitos de uso: as fotos são do restaurante, mas o dono deve confirmar antes de publicar.
- `docs/cardapio/iracema-seed.json` e `docs/database/applied/f12_*.sql` ainda citam as URLs do Goomer como registro histórico da importação. Não fazem parte do app (`src`, `public`, `e2e`, `supabase` estão sem referência ao Goomer).

## Atualização: fotos em melhor qualidade enviadas pelo dono

O dono enviou um pacote com 19 fotos (cerca de 700 px de altura, 53 a 255 KB, JPEG). Elas substituíram as versões pequenas dos mesmos 19 itens (caminho `<tenant>/produto-<id>-hd.jpg`; o arquivo pequeno correspondente foi removido). Sobraram 6 itens com a versão pequena (Amstel 600 ml, Eisenbahn, Heineken, Amstel Lager, Geraldim, Quintal da Jabu). Resultado no banco: 19 em alta, 6 pequenas, 38 sem foto, 0 apontando para o Goomer. O cardápio segue **não publicado**; use "Pré-visualizar" no painel.
