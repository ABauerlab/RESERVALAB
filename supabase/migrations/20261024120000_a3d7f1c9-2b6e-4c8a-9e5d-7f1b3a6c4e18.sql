-- Agenda de atrações do mês: planejamento interno (equipe Teggly + donos do espaço).
-- Diferente de eventos_destaque, que é o destaque público da página de reservas.
-- Nada daqui é exposto ao público: só admin do tenant e super_admin leem e escrevem.

CREATE TABLE public.atracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  data date NOT NULL,
  horario_inicio time without time zone,
  horario_fim time without time zone,
  titulo text NOT NULL CHECK (char_length(btrim(titulo)) > 0),
  tipo text NOT NULL DEFAULT 'musica_ao_vivo'
    CHECK (tipo IN ('musica_ao_vivo', 'dj', 'tematica', 'outro')),
  status text NOT NULL DEFAULT 'ideia'
    CHECK (status IN ('ideia', 'negociando', 'confirmada', 'cancelada')),
  contato text,
  cache_valor numeric(10, 2) CHECK (cache_valor IS NULL OR cache_valor >= 0),
  observacoes text,
  criado_por uuid DEFAULT auth.uid(),
  atualizado_por uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX atracoes_tenant_data_idx ON public.atracoes (tenant_id, data);

ALTER TABLE public.atracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admin reads own atracoes" ON public.atracoes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

CREATE POLICY "Tenant admin inserts own atracoes" ON public.atracoes
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

CREATE POLICY "Tenant admin updates own atracoes" ON public.atracoes
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

CREATE POLICY "Tenant admin deletes own atracoes" ON public.atracoes
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

-- updated_at e quem mexeu por último (a agenda é editada por mais de uma pessoa).
CREATE OR REPLACE FUNCTION public.atracoes_before_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := now();
  NEW.atualizado_por := auth.uid();
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.atracoes_before_update() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER atracoes_before_update
  BEFORE UPDATE ON public.atracoes
  FOR EACH ROW EXECUTE FUNCTION public.atracoes_before_update();
