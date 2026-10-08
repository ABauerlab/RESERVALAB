-- F13: polimento (Link Hub, Cardapio, Eventos). Aditivo e reversivel.
-- Documentacao do que foi aplicado em producao (wkvyhpfuezzinlaxsaap). Nao reaplicar.
-- Clientes antigos ignoram as chaves novas; nenhum dado e alterado ou apagado.

-- 1. Link Hub: selo curto de marca (ex.: "Comida de Buteco") e mapa do Google (so a URL de embed).
-- 2. Cardapio: layout escolhido pelo restaurante (ou sugerido pelo sistema) e itens em destaque.
ALTER TABLE public.tenant_perfil
  ADD COLUMN IF NOT EXISTS hub_selo text,
  ADD COLUMN IF NOT EXISTS hub_mapa_url text,
  ADD COLUMN IF NOT EXISTS cardapio_layout text;

ALTER TABLE public.tenant_perfil
  ADD CONSTRAINT tenant_perfil_hub_selo_len CHECK (hub_selo IS NULL OR char_length(hub_selo) <= 40),
  -- Somente o formato oficial "Compartilhar > Incorporar um mapa" do Google Maps, sem aspas nem tags.
  ADD CONSTRAINT tenant_perfil_hub_mapa_embed CHECK (
    hub_mapa_url IS NULL OR (
      char_length(hub_mapa_url) <= 2100
      AND hub_mapa_url ~ '^https://www\.google\.com/maps/embed\?pb=[A-Za-z0-9%!._~:/?=&+,;()*@-]{10,2000}$')),
  ADD CONSTRAINT tenant_perfil_cardapio_layout CHECK (
    cardapio_layout IS NULL OR cardapio_layout IN ('lista', 'cards', 'galeria', 'compacto'));

ALTER TABLE public.cardapio_itens
  ADD COLUMN IF NOT EXISTS destaque boolean NOT NULL DEFAULT false;

-- 3. Eventos: tamanho real do flyer, para reservar o espaco certo e nunca cortar nem deformar.
ALTER TABLE public.eventos_destaque
  ADD COLUMN IF NOT EXISTS imagem_largura integer,
  ADD COLUMN IF NOT EXISTS imagem_altura integer;
ALTER TABLE public.eventos_destaque
  ADD CONSTRAINT eventos_destaque_imagem_dim CHECK (
    (imagem_largura IS NULL AND imagem_altura IS NULL)
    OR (imagem_largura BETWEEN 1 AND 20000 AND imagem_altura BETWEEN 1 AND 20000));

-- Leituras publicas: mesmas chaves de antes, mais as novas.
CREATE OR REPLACE FUNCTION public.hub_do_tenant(_slug text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN COALESCE(p.hub_publicado, true) THEN
    jsonb_build_object(
      'nome', t.nome,
      'endereco', t.endereco,
      'whatsapp', t.whatsapp,
      'telefone', t.telefone_contato,
      'instagram', p.instagram,
      'cardapio_publicado', COALESCE(p.cardapio_publicado, false),
      'mostrar_cardapio', COALESCE(p.hub_mostrar_cardapio, true),
      'descricao', p.hub_descricao,
      'selo', p.hub_selo,
      'mapa_url', p.hub_mapa_url,
      'banner_url', CASE WHEN COALESCE(p.hub_banner_ativo, false) THEN p.hub_banner_url ELSE NULL END,
      'tipos_aceitos', t.tipos_aceitos,
      'links', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('id', l.id, 'titulo', l.titulo, 'url', l.url,
                                            'icone', l.icone, 'icone_url', l.icone_url, 'destaque', l.destaque)
                         ORDER BY l.destaque DESC, l.ordem, l.titulo)
        FROM public.hub_links l WHERE l.tenant_id = t.id AND l.ativo), '[]'::jsonb))
    ELSE NULL END
  FROM public.tenants t
  LEFT JOIN public.tenant_perfil p ON p.tenant_id = t.id
  WHERE t.slug = lower(_slug) AND t.ativo = true;
$function$;

CREATE OR REPLACE FUNCTION public.cardapio_do_tenant(_slug text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN COALESCE(p.cardapio_publicado, false) THEN
    jsonb_build_object(
      'nome', t.nome,
      'layout', p.cardapio_layout,
      'categorias', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', c.id, 'nome', c.nome, 'descricao', c.descricao,
            'itens', COALESCE((
              SELECT jsonb_agg(
                jsonb_build_object('id', i.id, 'nome', i.nome, 'descricao', i.descricao,
                                   'preco_centavos', i.preco_centavos, 'imagem_url', i.imagem_url,
                                   'destaque', i.destaque)
                ORDER BY i.ordem, i.nome)
              FROM public.cardapio_itens i
              WHERE i.categoria_id = c.id AND i.tenant_id = t.id AND i.ativo), '[]'::jsonb))
          ORDER BY c.ordem, c.nome)
        FROM public.cardapio_categorias c
        WHERE c.tenant_id = t.id AND c.ativo), '[]'::jsonb))
    ELSE NULL END
  FROM public.tenants t
  LEFT JOIN public.tenant_perfil p ON p.tenant_id = t.id
  WHERE t.slug = lower(_slug) AND t.ativo = true;
$function$;

-- Funcao nova (a antiga proximo_evento_do_tenant fica intacta: trocar o retorno exigia DROP, que
-- travou em producao). Mesmo filtro, mais as dimensoes do flyer.
CREATE OR REPLACE FUNCTION public.evento_destaque_do_tenant(_slug text)
 RETURNS TABLE(titulo text, descricao text, data date, horario time without time zone, imagem_url text,
               imagem_largura integer, imagem_altura integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT e.titulo, e.descricao, e.data, e.horario, e.imagem_url, e.imagem_largura, e.imagem_altura
    FROM public.eventos_destaque e JOIN public.tenants t ON t.id = e.tenant_id
   WHERE t.slug = lower(_slug) AND t.ativo = true AND e.data >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
   ORDER BY e.data ASC, e.horario ASC NULLS LAST LIMIT 1;
$function$;

-- Conteudo pedido pelo proprietario: selo do Link Hub do Iracema.
UPDATE public.tenant_perfil p SET hub_selo = 'Comida de Buteco'
  FROM public.tenants t WHERE t.id = p.tenant_id AND t.slug = 'iracema';

-- Rollback (nada disso apaga dado de negocio):
--   DROP FUNCTION public.evento_destaque_do_tenant(text);
--   recriar hub_do_tenant e cardapio_do_tenant sem as chaves novas
--     (definicoes anteriores em f11_link_hub_planos_storage.sql e live-functions.sql);
--   ALTER TABLE public.tenant_perfil DROP COLUMN hub_selo, DROP COLUMN hub_mapa_url, DROP COLUMN cardapio_layout;
--   ALTER TABLE public.cardapio_itens DROP COLUMN destaque;
--   ALTER TABLE public.eventos_destaque DROP COLUMN imagem_largura, DROP COLUMN imagem_altura;
