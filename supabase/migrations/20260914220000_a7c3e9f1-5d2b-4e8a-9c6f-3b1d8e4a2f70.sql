-- Evento em destaque por empresa: aparece na página pública enquanto a data
-- não passou. Sem job de limpeza — a query pública já filtra data >= hoje,
-- então o evento some sozinho do site assim que a data vira.

CREATE TABLE public.eventos_destaque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  data date NOT NULL,
  horario time without time zone,
  imagem_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.eventos_destaque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admin reads own eventos" ON public.eventos_destaque
  FOR SELECT USING (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

CREATE POLICY "Tenant admin inserts own eventos" ON public.eventos_destaque
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

CREATE POLICY "Tenant admin deletes own eventos" ON public.eventos_destaque
  FOR DELETE USING (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

CREATE POLICY "Tenant admin updates own eventos" ON public.eventos_destaque
  FOR UPDATE USING (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

-- Leitura pública (via slug) do próximo evento futuro, para a home da
-- empresa — mesmo padrão de bloqueios_do_tenant/feriados_do_tenant.
CREATE OR REPLACE FUNCTION public.proximo_evento_do_tenant(_slug text)
 RETURNS TABLE(titulo text, descricao text, data date, horario time without time zone, imagem_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT e.titulo, e.descricao, e.data, e.horario, e.imagem_url
    FROM public.eventos_destaque e
    JOIN public.tenants t ON t.id = e.tenant_id
   WHERE t.slug = lower(_slug) AND t.ativo = true
     AND e.data >= current_date
   ORDER BY e.data ASC, e.horario ASC NULLS LAST
   LIMIT 1;
$function$;
