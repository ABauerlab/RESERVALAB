-- Pixel do Facebook/Meta, configurável por empresa. Nulo por padrão —
-- só empresas com um ID configurado carregam o script de rastreamento.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS pixel_facebook_id text;

UPDATE public.tenants
  SET pixel_facebook_id = '831333738696755'
  WHERE slug = 'iracema';
