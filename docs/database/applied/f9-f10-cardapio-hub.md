# F9 e F10: Cardapio digital e Link Hub (aplicado em producao em 2026-10-07)

Migration `f9_f10_cardapio_e_link_hub` (documentacao, nao reaplicar). Somente objetos novos; nenhuma tabela existente foi alterada.

Tabelas (RLS ligada, todas com `tenant_id` e `ON DELETE CASCADE` a partir de `tenants`):

- `tenant_perfil` (1 linha por empresa): `instagram`, `cardapio_publicado` (padrao false), `hub_publicado` (padrao true).
- `cardapio_categorias`: nome, descricao, ordem, ativo.
- `cardapio_itens`: nome, descricao, `preco_centavos`, `imagem_url` (http/https), ordem, ativo. FK composta `(categoria_id, tenant_id)` garante que o item pertence a uma categoria da mesma empresa.
- `hub_links`: titulo, `url` (http, https, tel ou mailto), ordem, ativo.

Acesso:

- Escrita e leitura das tabelas: somente `authenticated` com `has_tenant_role` (admin da empresa ou super admin). `anon` sem privilegio algum nas tabelas.
- Leitura publica: `cardapio_do_tenant(_slug)` (retorna NULL se a empresa esta inativa ou o cardapio nao esta publicado, e so itens e categorias ativos) e `hub_do_tenant(_slug)`. Ambas `SECURITY DEFINER`, `STABLE`, executaveis por `anon`.

Fora de escopo: delivery, carrinho, pagamento, upload de imagens (as fotos entram por URL, como os flyers de eventos). Nao ha bucket de storage.

Testado em transacao revertida: publicacao, isolamento entre empresas, FK cruzada bloqueada, preco negativo e URL `javascript:` bloqueados, `anon` sem acesso as tabelas, usuario autenticado sem papel sem leitura nem escrita.

Rollback: `DROP FUNCTION public.cardapio_do_tenant(text), public.hub_do_tenant(text); DROP TABLE public.cardapio_itens, public.cardapio_categorias, public.hub_links, public.tenant_perfil;` (so se nao houver dados).

## f8_marca_opt_in_por_empresa (F8, white-label por opt-in)

Aplicada em producao (aditiva, reversivel, sem tocar dados existentes).

- `ALTER TABLE public.tenant_perfil ADD COLUMN marca_ativa boolean NOT NULL DEFAULT false;`
- RPC `public.marca_do_tenant(_slug text)` (SECURITY DEFINER, so devolve `cor` e `logo_url` quando `marca_ativa = true`; senao null).
- Padrao: desligado. Nenhuma empresa muda de visual sem ligar em Ajustes.

Rollback:

```sql
DROP FUNCTION public.marca_do_tenant(text);
ALTER TABLE public.tenant_perfil DROP COLUMN marca_ativa;
```
