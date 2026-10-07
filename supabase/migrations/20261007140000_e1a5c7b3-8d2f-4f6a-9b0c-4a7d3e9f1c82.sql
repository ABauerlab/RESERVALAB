-- Aviso automático de confirmação quando faltam 7 dias para uma reserva
-- que continua pendente. Reservas existentes entram como "já avisadas"
-- para não disparar mensagens retroativas na hora do deploy.
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS aviso_confirmacao_7d_enviado boolean NOT NULL DEFAULT true;
ALTER TABLE public.reservas
  ALTER COLUMN aviso_confirmacao_7d_enviado SET DEFAULT false;

-- Pendentes a 7 dias (ou menos) da data que ainda não receberam o aviso.
-- Reservas feitas já com menos de 8 dias de antecedência são ignoradas:
-- elas acabaram de receber o pedido de confirmação na criação.
CREATE OR REPLACE FUNCTION public.reservas_para_aviso_7d(_slug text)
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
     AND r.aviso_confirmacao_7d_enviado = false
     AND r.data >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
     AND r.data - (now() AT TIME ZONE 'America/Sao_Paulo')::date <= 7
     AND (r.created_at AT TIME ZONE 'America/Sao_Paulo')::date < r.data - 7
   ORDER BY r.data, r.horario;
$function$;

CREATE OR REPLACE FUNCTION public.marcar_aviso_7d_enviado(_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.reservas SET aviso_confirmacao_7d_enviado = true WHERE id = _id;
$function$;

GRANT EXECUTE ON FUNCTION public.reservas_para_aviso_7d(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_aviso_7d_enviado(uuid) TO anon, authenticated;
