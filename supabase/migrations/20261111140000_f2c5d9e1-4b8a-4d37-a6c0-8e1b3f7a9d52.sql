-- Limpeza automática da base de conhecimento da Iracema: remove da seção 23 os blocos de
-- evento cujo título traz uma data (DD/MM/AAAA) já passada (fuso de São Paulo) e as
-- referências soltas ao fechamento de 14/11/2026. Roda todo dia às 00:10 de Brasília.
CREATE OR REPLACE FUNCTION public.ia_base_limpar_blocos_vencidos()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  r record;
  partes text[];
  novas text[];
  parte text;
  cab text;
  m text[];
  removidos integer := 0;
  novo text;
BEGIN
  FOR r IN SELECT tenant_slug, conteudo FROM public.ia_base_conhecimento LOOP
    partes := regexp_split_to_array(r.conteudo, E'\n(?=## )');
    novas := ARRAY[]::text[];
    FOREACH parte IN ARRAY partes LOOP
      cab := split_part(parte, E'\n', 1);
      m := regexp_match(cab, '^## .*?(\d{2})/(\d{2})/(\d{4})');
      IF m IS NOT NULL AND make_date(m[3]::int, m[2]::int, m[1]::int) < hoje THEN
        removidos := removidos + 1;
      ELSE
        novas := novas || parte;
      END IF;
    END LOOP;
    novo := array_to_string(novas, E'\n');
    IF hoje > date '2026-11-14' THEN
      novo := replace(novo, ' Exceção: sábado 14/11/2026 (evento privado, veja a seção 23).', '');
      novo := replace(novo, ', exceto no sábado 14/11/2026 (casa fechada)', '');
    END IF;
    IF novo IS DISTINCT FROM r.conteudo THEN
      UPDATE public.ia_base_conhecimento SET conteudo = novo WHERE tenant_slug = r.tenant_slug;
    END IF;
  END LOOP;
  RETURN removidos;
END;
$function$;

REVOKE ALL ON FUNCTION public.ia_base_limpar_blocos_vencidos() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.unschedule('ia-base-limpar-blocos-vencidos')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ia-base-limpar-blocos-vencidos');
SELECT cron.schedule('ia-base-limpar-blocos-vencidos', '10 3 * * *',
                     $$SELECT public.ia_base_limpar_blocos_vencidos()$$);
