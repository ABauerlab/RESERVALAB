-- F11: Link Hub completo, planos sem billing e armazenamento de imagens (aditivo e reversivel).
-- Documentacao do que foi aplicado em producao (wkvyhpfuezzinlaxsaap). Nao reaplicar.
-- Rollback no fim do arquivo.

-- 1. Link Hub: descricao, banner, toggle de cardapio e, por link, icone e destaque.
ALTER TABLE public.tenant_perfil
  ADD COLUMN IF NOT EXISTS hub_descricao text,
  ADD COLUMN IF NOT EXISTS hub_banner_url text,
  ADD COLUMN IF NOT EXISTS hub_banner_ativo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hub_mostrar_cardapio boolean NOT NULL DEFAULT true;

ALTER TABLE public.tenant_perfil
  ADD CONSTRAINT tenant_perfil_hub_descricao_len CHECK (hub_descricao IS NULL OR char_length(hub_descricao) <= 280),
  ADD CONSTRAINT tenant_perfil_hub_banner_https CHECK (hub_banner_url IS NULL OR hub_banner_url ~* '^https?://');

ALTER TABLE public.hub_links
  ADD COLUMN IF NOT EXISTS icone text,
  ADD COLUMN IF NOT EXISTS icone_url text,
  ADD COLUMN IF NOT EXISTS destaque boolean NOT NULL DEFAULT false;

ALTER TABLE public.hub_links
  ADD CONSTRAINT hub_links_icone_chave CHECK (icone IS NULL OR icone ~ '^[a-z0-9_]{1,32}$'),
  ADD CONSTRAINT hub_links_icone_url_https CHECK (icone_url IS NULL OR icone_url ~* '^https?://');

-- Leitura publica: mesmas chaves de antes, mais as novas (clientes antigos ignoram o que nao conhecem).
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

-- 2. Planos (sem billing). Empresa sem linha vale como Pro de lancamento (regra no app).
CREATE TABLE IF NOT EXISTS public.tenant_planos (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  plano text NOT NULL CHECK (plano IN ('gratuito', 'essencial', 'pro')),
  ciclo text NOT NULL DEFAULT 'mensal' CHECK (ciclo IN ('mensal', 'anual')),
  vigente_ate date,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_planos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tenant_planos FROM anon;
CREATE POLICY "Tenant le o proprio plano" ON public.tenant_planos
  FOR SELECT TO authenticated USING (public.has_tenant_role(auth.uid(), tenant_id));
CREATE POLICY "Super admin gerencia planos" ON public.tenant_planos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE TRIGGER trg_tenant_planos_updated BEFORE UPDATE ON public.tenant_planos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Imagens de banner e icones: bucket publico de leitura, escrita so do admin da propria empresa
--    (primeira pasta do caminho = tenant_id). Sem SVG (evita script embutido). Limite de 2 MB.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tenant-assets', 'tenant-assets', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "tenant-assets: admin da empresa envia" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'tenant-assets'
    AND CASE WHEN (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             THEN public.has_tenant_role(auth.uid(), ((storage.foldername(name))[1])::uuid) ELSE false END);
CREATE POLICY "tenant-assets: admin da empresa atualiza" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'tenant-assets'
    AND CASE WHEN (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             THEN public.has_tenant_role(auth.uid(), ((storage.foldername(name))[1])::uuid) ELSE false END);
CREATE POLICY "tenant-assets: admin da empresa remove" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'tenant-assets'
    AND CASE WHEN (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             THEN public.has_tenant_role(auth.uid(), ((storage.foldername(name))[1])::uuid) ELSE false END);

-- Rollback (so se nao houver dados que importem):
--   DROP POLICY "tenant-assets: admin da empresa envia" ON storage.objects; (idem atualiza, remove)
--   DELETE FROM storage.buckets WHERE id = 'tenant-assets';   -- apos esvaziar o bucket
--   DROP TABLE public.tenant_planos;
--   ALTER TABLE public.hub_links DROP COLUMN icone, DROP COLUMN icone_url, DROP COLUMN destaque;
--   ALTER TABLE public.tenant_perfil DROP COLUMN hub_descricao, DROP COLUMN hub_banner_url,
--     DROP COLUMN hub_banner_ativo, DROP COLUMN hub_mostrar_cardapio;
--   recriar hub_do_tenant com a definicao anterior (ver docs/database/live-functions.sql).
