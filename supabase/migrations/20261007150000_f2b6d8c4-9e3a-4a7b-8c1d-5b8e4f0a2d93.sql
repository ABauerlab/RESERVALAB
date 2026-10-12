-- Segundo aviso (2 dias) para reservas que seguem pendentes, contra no-show.
-- Existentes entram como avisadas: nada é disparado retroativamente.
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS aviso_confirmacao_2d_enviado boolean NOT NULL DEFAULT true;
ALTER TABLE public.reservas
  ALTER COLUMN aviso_confirmacao_2d_enviado SET DEFAULT false;

CREATE OR REPLACE FUNCTION public.reservas_para_aviso_pendente_2d(_slug text)
 RETURNS TABLE(id uuid, nome text, telefone text, tipo reserva_tipo, data date, horario time without time zone, quantidade integer, codigo_acompanhamento text, dias_restantes integer, tenant_nome text, tenant_slug text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT r.id, r.nome, r.telefone, r.tipo, r.data, r.horario, r.quantidade,
         r.codigo_acompanhamento,
         (r.data - (now() AT TIME ZONE 'America/Sao_Paulo')::date) AS dias_restantes,
         t.nome, t.slug
    FROM public.reservas r
    JOIN public.tenants t ON t.id = r.tenant_id
   WHERE t.slug = lower(_slug) AND t.ativo = true
     AND r.status = 'pendente'
     AND r.aviso_confirmacao_2d_enviado = false
     AND r.data >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
     AND r.data - (now() AT TIME ZONE 'America/Sao_Paulo')::date <= 2
     AND (r.created_at AT TIME ZONE 'America/Sao_Paulo')::date < r.data - 2
   ORDER BY r.data, r.horario;
$function$;

CREATE OR REPLACE FUNCTION public.marcar_aviso_2d_enviado(_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.reservas SET aviso_confirmacao_2d_enviado = true WHERE id = _id;
$function$;

GRANT EXECUTE ON FUNCTION public.reservas_para_aviso_pendente_2d(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_aviso_2d_enviado(uuid) TO anon, authenticated;
