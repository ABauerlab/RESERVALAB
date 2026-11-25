-- Grupo de WhatsApp das reservas (Iracema): fila de notificações.
-- Toda vez que uma reserva vira confirmada (pelo cliente, pela equipe ou
-- pela Dona Iracema), é cancelada (estando confirmada) ou é alterada
-- (estando confirmada), uma linha entra nesta fila. Um workflow separado no
-- n8n lê as linhas não enviadas, manda a lista completa de reservas
-- atualizadas + uma mensagem curta explicando o que mudou para o grupo
-- 120363042936295967@g.us, e marca como enviada. O agente de WhatsApp nunca
-- responde nada nesse grupo: só esse fluxo de notificação escreve lá.
--
-- Reserva que nunca foi confirmada (ficou só pendente e foi cancelada ou
-- excluída) não entra na fila: a equipe não quer aviso de quem nem chegou a
-- confirmar.

CREATE TABLE IF NOT EXISTS public.notificacoes_grupo_reservas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reserva_id uuid NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('nova', 'cancelada', 'alterada')),
  resumo text NOT NULL,
  enviado boolean NOT NULL DEFAULT false,
  enviado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notificacoes_grupo_reservas IS
  'Fila de avisos para o grupo de WhatsApp das reservas do Iracema. Lida e marcada como enviada pelo workflow n8n "Iracema - Grupo de reservas (WhatsApp)".';

CREATE INDEX IF NOT EXISTS notificacoes_grupo_reservas_pendentes_idx
  ON public.notificacoes_grupo_reservas (tenant_id, created_at) WHERE NOT enviado;

ALTER TABLE public.notificacoes_grupo_reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admin reads own notificacoes_grupo_reservas" ON public.notificacoes_grupo_reservas
  FOR SELECT USING (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

CREATE OR REPLACE FUNCTION public.ia_fmt_data_br(_d date)
 RETURNS text LANGUAGE sql IMMUTABLE AS $function$
  SELECT CASE WHEN _d IS NULL THEN NULL ELSE to_char(_d, 'DD/MM') END
$function$;

-- Texto da reserva usado no resumo da fila (ex.: "Maria Silva - 4 pessoas - 28/11 às 20:00").
CREATE OR REPLACE FUNCTION public.ia_resumo_reserva(_r public.reservas)
 RETURNS text LANGUAGE sql IMMUTABLE AS $function$
  SELECT trim(COALESCE(_r.nome, '')) || ' - ' || COALESCE(_r.quantidade::text, '?') || ' pessoas'
    || CASE WHEN _r.data IS NOT NULL THEN ' - ' || public.ia_fmt_data_br(_r.data) ELSE '' END
    || CASE WHEN _r.horario IS NOT NULL THEN ' às ' || public.ia_fmt_hora(_r.horario) ELSE '' END
    || CASE WHEN _r.tipo_evento IS NOT NULL AND _r.tipo_evento <> '' THEN ' (' || _r.tipo_evento || ')' ELSE '' END
$function$;

CREATE OR REPLACE FUNCTION public.ia_notificar_grupo_reservas()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Nova reserva confirmada (primeira confirmação).
  IF NEW.status = 'confirmada' AND OLD.status = 'pendente' THEN
    INSERT INTO public.notificacoes_grupo_reservas (tenant_id, reserva_id, tipo, resumo)
    VALUES (NEW.tenant_id, NEW.id, 'nova', 'Nova reserva confirmada: ' || public.ia_resumo_reserva(NEW));

  -- Reserva confirmada que foi cancelada.
  ELSIF NEW.status = 'cancelada' AND OLD.status = 'confirmada' THEN
    INSERT INTO public.notificacoes_grupo_reservas (tenant_id, reserva_id, tipo, resumo)
    VALUES (NEW.tenant_id, NEW.id, 'cancelada', 'Reserva cancelada: ' || public.ia_resumo_reserva(OLD));

  -- Reserva já confirmada que teve data/horário/quantidade/área alterada.
  ELSIF NEW.status = 'confirmada' AND OLD.status = 'confirmada' AND (
    NEW.data IS DISTINCT FROM OLD.data OR
    NEW.horario IS DISTINCT FROM OLD.horario OR
    NEW.quantidade IS DISTINCT FROM OLD.quantidade OR
    NEW.area IS DISTINCT FROM OLD.area
  ) THEN
    INSERT INTO public.notificacoes_grupo_reservas (tenant_id, reserva_id, tipo, resumo)
    VALUES (NEW.tenant_id, NEW.id, 'alterada',
      'Reserva alterada: ' || public.ia_resumo_reserva(OLD) || ' → ' || public.ia_resumo_reserva(NEW));
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notificar_grupo_reservas ON public.reservas;
CREATE TRIGGER trg_notificar_grupo_reservas
  AFTER UPDATE ON public.reservas
  FOR EACH ROW
  EXECUTE FUNCTION public.ia_notificar_grupo_reservas();

-- Lista completa de reservas confirmadas e ativas (hoje em diante), para o
-- workflow do grupo montar a mensagem "lista atualizada". Ordenada por data
-- e horário.
CREATE OR REPLACE FUNCTION public.lista_reservas_confirmadas_grupo(_slug text)
 RETURNS TABLE(codigo text, nome text, telefone text, quantidade int, data date, horario time without time zone, area text, tipo_evento text, observacoes text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT r.codigo_acompanhamento, r.nome, r.telefone, r.quantidade, r.data, r.horario,
         r.area::text, r.tipo_evento, r.observacoes
    FROM public.reservas r
    JOIN public.tenants t ON t.id = r.tenant_id
   WHERE t.slug = lower(_slug)
     AND r.status = 'confirmada'
     AND r.data >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
   ORDER BY r.data ASC, r.horario ASC NULLS LAST, r.nome ASC;
$function$;
