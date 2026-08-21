-- =========================================================
-- Horário-limite de reservas por empresa
-- =========================================================
-- Cada empresa pode configurar o último horário aceito para reservas de
-- mesa/aniversário, separadamente para dias de semana e fim de semana.
-- Objetivo: evitar reservas próximas demais do horário de fechamento.
-- Quando nulo, mantém o comportamento atual (limite = horário de fechamento
-- padrão calculado no cliente, sem corte adicional).

ALTER TABLE public.tenants
  ADD COLUMN horario_limite_semana time without time zone,
  ADD COLUMN horario_limite_fim_semana time without time zone;

COMMENT ON COLUMN public.tenants.horario_limite_semana IS
  'Último horário aceito para reservas de mesa/aniversário em dias de semana (seg-sex). NULL = sem limite adicional.';
COMMENT ON COLUMN public.tenants.horario_limite_fim_semana IS
  'Último horário aceito para reservas de mesa/aniversário em fins de semana (sáb-dom). NULL = sem limite adicional.';

-- Regra de negócio da Iracema: parar de aceitar reservas 1-2h antes do
-- fechamento, para as mesas não ficarem ocupadas até o encerramento da casa.
UPDATE public.tenants
   SET horario_limite_semana = '13:00',
       horario_limite_fim_semana = '14:00'
 WHERE slug = 'iracema';

-- Aplica o mesmo corte no lado do servidor (defesa em profundidade: a UI já
-- filtra os horários oferecidos, mas a função pública precisa rejeitar
-- também uma chamada direta com um horário fora do limite configurado).
CREATE OR REPLACE FUNCTION public.criar_reserva(_slug text, _tipo reserva_tipo, _nome text, _telefone text, _quantidade integer, _data date, _horario time without time zone DEFAULT NULL::time without time zone, _area reserva_area DEFAULT NULL::reserva_area, _leva_bolo boolean DEFAULT NULL::boolean, _comandas boolean DEFAULT NULL::boolean, _tipo_evento text DEFAULT NULL::text, _observacoes text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t public.tenants;
  novo public.reservas;
  ocupadas int;
  grandes int;
  fim_de_semana boolean;
  limite time without time zone;
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

  -- O corte de horário só vale para reservas de capacidade normal (até 30
  -- pessoas); grupos maiores usam horários estendidos negociados à parte.
  IF _data IS NOT NULL AND _horario IS NOT NULL AND COALESCE(_quantidade, 0) <= 30 THEN
    fim_de_semana := extract(dow FROM _data) IN (0, 6);
    limite := CASE WHEN fim_de_semana THEN t.horario_limite_fim_semana ELSE t.horario_limite_semana END;
    IF limite IS NOT NULL AND _horario > limite THEN
      RAISE EXCEPTION 'Data ou horario indisponivel';
    END IF;
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

  -- Regra de evento fechado (acima de 50 pessoas): exclusividade do dia+horario
  IF _data IS NOT NULL AND _horario IS NOT NULL THEN
    SELECT count(*), count(*) FILTER (WHERE r.quantidade > 50)
      INTO ocupadas, grandes
      FROM public.reservas r
     WHERE r.tenant_id = t.id
       AND r.data = _data
       AND r.horario = _horario
       AND r.status <> 'cancelada';

    IF grandes > 0 THEN
      RAISE EXCEPTION 'Data ou horario indisponivel';
    END IF;

    IF COALESCE(_quantidade, 0) > 50 AND ocupadas > 0 THEN
      RAISE EXCEPTION 'Data ou horario indisponivel';
    END IF;
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
END; $function$;
