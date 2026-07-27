-- =========================================================
-- FASE A.1 — GRANTs da Data API (causa raiz dos bugs 2/3/4)
-- Nenhum dado é apagado ou alterado.
-- =========================================================

GRANT SELECT ON public.tenants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;

GRANT INSERT ON public.reservas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservas TO authenticated;
GRANT ALL ON public.reservas TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reserva_by_codigo(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_reserva_by_codigo(text, date, time without time zone, integer, public.reserva_area, text) TO anon, authenticated;

-- =========================================================
-- FASE D — Bloqueio de agenda
-- =========================================================
CREATE TABLE IF NOT EXISTS public.agenda_bloqueios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  data date NOT NULL,
  hora_inicio time without time zone,
  hora_fim time without time zone,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agenda_bloqueios_tenant_data
  ON public.agenda_bloqueios (tenant_id, data);

GRANT SELECT ON public.agenda_bloqueios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_bloqueios TO authenticated;
GRANT ALL ON public.agenda_bloqueios TO service_role;

ALTER TABLE public.agenda_bloqueios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads blocks of active tenants" ON public.agenda_bloqueios;
CREATE POLICY "Public reads blocks of active tenants"
  ON public.agenda_bloqueios FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.ativo = true));

DROP POLICY IF EXISTS "Tenant admin inserts own blocks" ON public.agenda_bloqueios;
CREATE POLICY "Tenant admin inserts own blocks"
  ON public.agenda_bloqueios FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_tenant_role(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Tenant admin updates own blocks" ON public.agenda_bloqueios;
CREATE POLICY "Tenant admin updates own blocks"
  ON public.agenda_bloqueios FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_tenant_role(auth.uid(), tenant_id))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_tenant_role(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Tenant admin deletes own blocks" ON public.agenda_bloqueios;
CREATE POLICY "Tenant admin deletes own blocks"
  ON public.agenda_bloqueios FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_tenant_role(auth.uid(), tenant_id));

CREATE TRIGGER trg_agenda_bloqueios_updated
  BEFORE UPDATE ON public.agenda_bloqueios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- FASE F — Feedbacks / sugestões
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.feedback_status AS ENUM ('novo','em_analise','feito','recusado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  autor_user_id uuid,
  titulo text NOT NULL,
  descricao text NOT NULL,
  status public.feedback_status NOT NULL DEFAULT 'novo',
  resposta_master text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_tenant ON public.feedbacks (tenant_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedbacks TO authenticated;
GRANT ALL ON public.feedbacks TO service_role;

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant admin reads own feedbacks" ON public.feedbacks;
CREATE POLICY "Tenant admin reads own feedbacks"
  ON public.feedbacks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_tenant_role(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Tenant admin creates feedbacks" ON public.feedbacks;
CREATE POLICY "Tenant admin creates feedbacks"
  ON public.feedbacks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_tenant_role(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Super admin updates feedbacks" ON public.feedbacks;
CREATE POLICY "Super admin updates feedbacks"
  ON public.feedbacks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admin deletes feedbacks" ON public.feedbacks;
CREATE POLICY "Super admin deletes feedbacks"
  ON public.feedbacks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_feedbacks_updated
  BEFORE UPDATE ON public.feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- FASE A.2 — RPC pública de criação de reserva
-- Devolve o código sem precisar dar SELECT em reservas ao anon.
-- Também valida bloqueios de agenda.
-- =========================================================
CREATE OR REPLACE FUNCTION public.criar_reserva(
  _slug text,
  _tipo public.reserva_tipo,
  _nome text,
  _telefone text,
  _quantidade integer,
  _data date,
  _horario time without time zone DEFAULT NULL,
  _area public.reserva_area DEFAULT NULL,
  _leva_bolo boolean DEFAULT NULL,
  _comandas boolean DEFAULT NULL,
  _tipo_evento text DEFAULT NULL,
  _observacoes text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.tenants;
  novo public.reservas;
BEGIN
  SELECT * INTO t FROM public.tenants WHERE slug = lower(_slug) AND ativo = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Empresa nao encontrada ou inativa'; END IF;

  IF _nome IS NULL OR length(trim(_nome)) < 2 THEN RAISE EXCEPTION 'Nome invalido'; END IF;
  IF _telefone IS NULL OR length(regexp_replace(_telefone, '\D', '', 'g')) < 10 THEN
    RAISE EXCEPTION 'Telefone invalido';
  END IF;
  IF NOT (_tipo = ANY (t.tipos_aceitos)) THEN
    RAISE EXCEPTION 'Este tipo de reserva nao esta disponivel';
  END IF;

  IF _data IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.agenda_bloqueios b
     WHERE b.tenant_id = t.id
       AND b.data = _data
       AND (
         (b.hora_inicio IS NULL AND b.hora_fim IS NULL)
         OR (_horario IS NOT NULL
             AND _horario >= COALESCE(b.hora_inicio, time '00:00')
             AND _horario <= COALESCE(b.hora_fim, time '23:59'))
       )
  ) THEN
    RAISE EXCEPTION 'Data ou horario indisponivel';
  END IF;

  INSERT INTO public.reservas (
    tenant_id, codigo_acompanhamento, tipo, nome, telefone, quantidade,
    data, horario, area, leva_bolo, comandas, tipo_evento, observacoes, status
  ) VALUES (
    t.id, '', _tipo, trim(_nome), trim(_telefone), _quantidade,
    _data, _horario, _area, _leva_bolo, _comandas,
    NULLIF(trim(COALESCE(_tipo_evento,'')), ''),
    NULLIF(trim(COALESCE(_observacoes,'')), ''),
    'pendente'
  ) RETURNING * INTO novo;

  RETURN novo.codigo_acompanhamento;
END; $$;

REVOKE ALL ON FUNCTION public.criar_reserva(text, public.reserva_tipo, text, text, integer, date, time without time zone, public.reserva_area, boolean, boolean, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_reserva(text, public.reserva_tipo, text, text, integer, date, time without time zone, public.reserva_area, boolean, boolean, text, text) TO anon, authenticated, service_role;

-- =========================================================
-- FASE A.3 — RPC para o cliente saber se um dia esta bloqueado
-- =========================================================
CREATE OR REPLACE FUNCTION public.bloqueios_do_tenant(_slug text)
RETURNS TABLE (data date, hora_inicio time without time zone, hora_fim time without time zone, motivo text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.data, b.hora_inicio, b.hora_fim, b.motivo
    FROM public.agenda_bloqueios b
    JOIN public.tenants t ON t.id = b.tenant_id
   WHERE t.slug = lower(_slug) AND t.ativo = true
     AND b.data >= current_date
   ORDER BY b.data;
$$;

REVOKE ALL ON FUNCTION public.bloqueios_do_tenant(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bloqueios_do_tenant(text) TO anon, authenticated, service_role;