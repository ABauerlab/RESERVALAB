-- 1) agenda_bloqueios: remove leitura pública direta
DROP POLICY IF EXISTS "Public reads blocks of active tenants" ON public.agenda_bloqueios;
CREATE POLICY "Tenant admin reads own blocks"
  ON public.agenda_bloqueios FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_tenant_role(auth.uid(), tenant_id));
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.agenda_bloqueios FROM anon;

-- 2) RPC pública não expõe mais o motivo interno
CREATE OR REPLACE FUNCTION public.bloqueios_do_tenant(_slug text)
 RETURNS TABLE(data date, hora_inicio time without time zone, hora_fim time without time zone, motivo text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT b.data, b.hora_inicio, b.hora_fim, NULL::text AS motivo
    FROM public.agenda_bloqueios b
    JOIN public.tenants t ON t.id = b.tenant_id
   WHERE t.slug = lower(_slug) AND t.ativo = true
     AND b.data >= current_date
   ORDER BY b.data;
$function$;

-- 3) tenants: separa regra anônima (sem funções de permissão) da autenticada
DROP POLICY IF EXISTS "Anyone can read active tenants" ON public.tenants;
CREATE POLICY "Anon reads active tenants"
  ON public.tenants FOR SELECT TO anon
  USING (ativo = true);
CREATE POLICY "Authenticated reads tenants"
  ON public.tenants FOR SELECT TO authenticated
  USING (ativo = true OR has_role(auth.uid(), 'super_admin'::app_role) OR has_tenant_role(auth.uid(), id));

-- 4) funções internas não expostas na API
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_tenant_role(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_my_tenant_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.notify_new_reserva() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.gen_reserva_codigo() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- funções públicas necessárias permanecem acessíveis
GRANT EXECUTE ON FUNCTION public.bloqueios_do_tenant(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_reserva_by_codigo(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_reserva_by_codigo(text, date, time without time zone, integer, reserva_area, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.criar_reserva(text, reserva_tipo, text, text, integer, date, time without time zone, reserva_area, boolean, boolean, text, text) TO anon, authenticated, service_role;