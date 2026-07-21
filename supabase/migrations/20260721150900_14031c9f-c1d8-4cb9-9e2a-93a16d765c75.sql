
-- =========================================================
-- ReservaLab — reset & multi-tenant schema
-- =========================================================

-- Drop old objects (data reset)
DROP TABLE IF EXISTS public.reservas CASCADE;
DROP TYPE IF EXISTS public.reserva_status CASCADE;
DROP TYPE IF EXISTS public.reserva_tipo CASCADE;
DROP TYPE IF EXISTS public.reserva_area CASCADE;

-- Enums
CREATE TYPE public.reserva_tipo   AS ENUM ('mesa','aniversario','evento','casamento');
CREATE TYPE public.reserva_status AS ENUM ('pendente','confirmada','cancelada','finalizada');
CREATE TYPE public.reserva_area   AS ENUM ('interna','externa','sem_preferencia');
CREATE TYPE public.app_role       AS ENUM ('super_admin','tenant_admin');

-- =========================================================
-- Utility: updated_at trigger fn
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================================================
-- tenants
-- =========================================================
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,40}$'),
  nome text NOT NULL,
  logo_url text,
  endereco text,
  telefone_contato text,
  email_contato text,
  whatsapp text,
  cor_primaria text DEFAULT '#B4552D',
  tipos_aceitos public.reserva_tipo[] NOT NULL DEFAULT ARRAY['mesa','aniversario','evento','casamento']::public.reserva_tipo[],
  mensagem_confirmacao text DEFAULT 'Ola {nome}, sua reserva no {empresa} para {data} as {horario} foi confirmada. Endereco: {endereco}. Para acompanhar ou alterar acesse: {link_acompanhar}',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tenants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_tenants_updated
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- user_roles
-- =========================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, tenant_id)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role helper (SECURITY DEFINER - avoids recursion in policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_user_id uuid, _tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        (role = 'tenant_admin' AND tenant_id = _tenant_id)
        OR role = 'super_admin'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.user_roles
   WHERE user_id = auth.uid() AND role = 'tenant_admin'
   LIMIT 1;
$$;

-- user_roles policies
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin manages roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- =========================================================
-- tenants policies (need has_role, so create after)
-- =========================================================
CREATE POLICY "Anyone can read active tenants"
ON public.tenants FOR SELECT TO anon, authenticated
USING (ativo = true OR public.has_role(auth.uid(), 'super_admin') OR public.has_tenant_role(auth.uid(), id));

CREATE POLICY "Super admin manages tenants"
ON public.tenants FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin or tenant admin updates tenant"
ON public.tenants FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_tenant_role(auth.uid(), id))
WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_tenant_role(auth.uid(), id));

CREATE POLICY "Super admin deletes tenants"
ON public.tenants FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- =========================================================
-- reservas (recreated)
-- =========================================================
CREATE TABLE public.reservas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo_acompanhamento text NOT NULL UNIQUE,
  tipo public.reserva_tipo NOT NULL,
  nome text NOT NULL,
  telefone text NOT NULL,
  quantidade integer CHECK (quantidade IS NULL OR (quantidade >= 1 AND quantidade <= 5000)),
  data date,
  horario time,
  area public.reserva_area,
  leva_bolo boolean,
  comandas boolean,
  tipo_evento text,
  observacoes text,
  status public.reserva_status NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservas_tenant ON public.reservas(tenant_id);
CREATE INDEX idx_reservas_codigo ON public.reservas(codigo_acompanhamento);
CREATE INDEX idx_reservas_data ON public.reservas(data);

GRANT INSERT ON public.reservas TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.reservas TO authenticated;
GRANT ALL ON public.reservas TO service_role;

ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_reservas_updated
BEFORE UPDATE ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate codigo_acompanhamento if missing
CREATE OR REPLACE FUNCTION public.gen_reserva_codigo()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text := '';
  i int;
BEGIN
  IF NEW.codigo_acompanhamento IS NULL OR NEW.codigo_acompanhamento = '' THEN
    LOOP
      c := '';
      FOR i IN 1..6 LOOP
        c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      END LOOP;
      c := 'RL-' || c;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.reservas WHERE codigo_acompanhamento = c);
    END LOOP;
    NEW.codigo_acompanhamento := c;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_reservas_codigo
BEFORE INSERT ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.gen_reserva_codigo();

-- reservas policies
CREATE POLICY "Anyone can create reservations"
ON public.reservas FOR INSERT TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.ativo = true));

CREATE POLICY "Tenant admin sees own reservations"
ON public.reservas FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'super_admin') OR public.has_tenant_role(auth.uid(), tenant_id));

CREATE POLICY "Tenant admin updates own reservations"
ON public.reservas FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'super_admin') OR public.has_tenant_role(auth.uid(), tenant_id))
WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_tenant_role(auth.uid(), tenant_id));

CREATE POLICY "Tenant admin deletes own reservations"
ON public.reservas FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'super_admin') OR public.has_tenant_role(auth.uid(), tenant_id));

-- Public tracking RPCs
CREATE OR REPLACE FUNCTION public.get_reserva_by_codigo(_codigo text)
RETURNS SETOF public.reservas
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.reservas WHERE codigo_acompanhamento = upper(_codigo) LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_reserva_by_codigo(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_reserva_by_codigo(
  _codigo text,
  _data date,
  _horario time,
  _quantidade integer,
  _area public.reserva_area,
  _observacoes text
) RETURNS public.reservas
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.reservas;
BEGIN
  SELECT * INTO r FROM public.reservas WHERE codigo_acompanhamento = upper(_codigo);
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva nao encontrada'; END IF;
  IF r.status IN ('cancelada','finalizada') THEN
    RAISE EXCEPTION 'Reserva nao pode ser alterada';
  END IF;
  UPDATE public.reservas
     SET data = COALESCE(_data, data),
         horario = COALESCE(_horario, horario),
         quantidade = COALESCE(_quantidade, quantidade),
         area = COALESCE(_area, area),
         observacoes = COALESCE(_observacoes, observacoes)
   WHERE id = r.id
   RETURNING * INTO r;
  RETURN r;
END; $$;

GRANT EXECUTE ON FUNCTION public.update_reserva_by_codigo(text, date, time, integer, public.reserva_area, text) TO anon, authenticated;

-- =========================================================
-- push_subscriptions
-- =========================================================
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_tenant ON public.push_subscriptions(tenant_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_push_updated
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Tenant admin manages own push subs"
ON public.push_subscriptions FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'super_admin') OR public.has_tenant_role(auth.uid(), tenant_id))
WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_tenant_role(auth.uid(), tenant_id));

-- =========================================================
-- Realtime
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservas;

-- =========================================================
-- Seed: primeiro cliente Iracema
-- =========================================================
INSERT INTO public.tenants (slug, nome, endereco, telefone_contato, email_contato, whatsapp, tipos_aceitos, ativo)
VALUES (
  'iracema',
  'Iracema',
  NULL,
  NULL,
  NULL,
  NULL,
  ARRAY['mesa','aniversario','evento','casamento']::public.reserva_tipo[],
  true
);
