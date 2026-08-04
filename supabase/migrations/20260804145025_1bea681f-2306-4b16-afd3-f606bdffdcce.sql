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