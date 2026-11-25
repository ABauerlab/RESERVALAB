-- Fecha a brecha: reserva (tipo mesa/aniversario) acima de 30 pessoas fora do
-- horario de funcionamento estava sendo aceita e autoconfirmada sem nenhuma
-- validacao de horario, porque o corte de horario em criar_reserva só valia
-- para quantidade <= 30. Um cliente conseguiu reservar mesa para 70 pessoas
-- fora do horario (nao era evento fechado, era reserva comum "cada um paga o
-- seu") e confirmou pelo WhatsApp sem nenhuma revisao da equipe.
--
-- Nova regra: reserva de qualquer tipo com mais de 30 pessoas fora do horario
-- de funcionamento continua podendo ser criada (para nao perder o cliente),
-- mas fica marcada como "Evento - A negociar" e so pode ser confirmada
-- manualmente pela equipe no Teggly. O cliente e a IA (Dona Iracema) nao
-- conseguem mais confirmar essa reserva pelo WhatsApp.
--
-- Tambem adiciona uma tabela de horarios especiais por data (ex.: 23/12/2026,
-- ultimo dia de funcionamento antes da pausa entre Natal e Réveillon, com
-- funcionamento estendido até as 18h), reaproveitavel para futuras datas.

CREATE TABLE IF NOT EXISTS public.horarios_especiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  data date NOT NULL,
  horario_limite time without time zone NOT NULL,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, data)
);

COMMENT ON TABLE public.horarios_especiais IS
  'Horario-limite de reserva (grupos até 30 pessoas) que substitui o limite normal de semana/sabado/fim de semana numa data especifica. Usado para datas com funcionamento estendido ou reduzido.';

ALTER TABLE public.horarios_especiais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admin reads own horarios_especiais" ON public.horarios_especiais
  FOR SELECT USING (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

CREATE POLICY "Tenant admin inserts own horarios_especiais" ON public.horarios_especiais
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

CREATE POLICY "Tenant admin updates own horarios_especiais" ON public.horarios_especiais
  FOR UPDATE USING (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

CREATE POLICY "Tenant admin deletes own horarios_especiais" ON public.horarios_especiais
  FOR DELETE USING (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

INSERT INTO public.horarios_especiais (tenant_id, data, horario_limite, motivo)
SELECT t.id, DATE '2026-12-23', TIME '18:00',
       'Último dia de funcionamento antes da pausa entre Natal e Réveillon - horário estendido'
  FROM public.tenants t WHERE t.slug = 'iracema'
ON CONFLICT (tenant_id, data) DO UPDATE SET horario_limite = EXCLUDED.horario_limite, motivo = EXCLUDED.motivo;

-- Flag de confirmação manual obrigatória (reserva grande fora do horário normal).
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS confirmacao_manual_necessaria boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.reservas.confirmacao_manual_necessaria IS
  'true = reserva com mais de 30 pessoas fora do horário de funcionamento normal ("Evento - A negociar"); só pode ser confirmada manualmente pela equipe no Teggly, nunca pelo cliente ou pela IA.';

-- criar_reserva: usa horarios_especiais quando houver, e marca confirmacao_manual_necessaria
-- em vez de bloquear reservas grandes fora do horario.
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
  especial time without time zone;
  fora_do_horario boolean := false;
  manual boolean := false;
  evento_txt text;
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

  -- Horario-limite do dia: horario especial cadastrado tem prioridade;
  -- senão segue a regra normal de semana/sabado/fim de semana.
  IF _data IS NOT NULL THEN
    SELECT h.horario_limite INTO especial FROM public.horarios_especiais h
     WHERE h.tenant_id = t.id AND h.data = _data;
    IF especial IS NOT NULL THEN
      limite := especial;
    ELSE
      fim_de_semana := extract(dow FROM _data) IN (0, 6)
        OR EXISTS (SELECT 1 FROM public.feriados f WHERE f.tenant_id = t.id AND f.data = _data);
      limite := CASE WHEN fim_de_semana THEN t.horario_limite_fim_semana ELSE t.horario_limite_semana END;
      IF extract(dow FROM _data) = 6 AND t.horario_limite_sabado IS NOT NULL THEN
        limite := t.horario_limite_sabado;
      END IF;
    END IF;
  END IF;

  IF _data IS NOT NULL AND _horario IS NOT NULL AND limite IS NOT NULL AND _horario > limite THEN
    fora_do_horario := true;
  END IF;

  -- Grupos até 30 pessoas continuam bloqueados fora do horário (comportamento anterior).
  IF fora_do_horario AND COALESCE(_quantidade, 0) <= 30 THEN
    RAISE EXCEPTION 'Data ou horario indisponivel';
  END IF;

  -- Mais de 30 pessoas fora do horário: não é bloqueado, mas não é evento
  -- fechado automático também — vira "Evento - A negociar" com confirmação
  -- manual obrigatória pela equipe (nunca pelo cliente ou pela IA).
  IF fora_do_horario AND COALESCE(_quantidade, 0) > 30 THEN
    manual := true;
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

  evento_txt := NULLIF(trim(COALESCE(_tipo_evento, '')), '');
  IF manual AND evento_txt IS NULL THEN
    evento_txt := 'Evento - A negociar';
  END IF;

  INSERT INTO public.reservas (
    tenant_id, codigo_acompanhamento, tipo, nome, telefone, quantidade,
    data, horario, area, leva_bolo, comandas, tipo_evento, observacoes, status,
    confirmacao_manual_necessaria
  ) VALUES (
    t.id, '', _tipo, trim(_nome), trim(_telefone), _quantidade,
    _data, _horario, _area, _leva_bolo, _comandas,
    evento_txt,
    NULLIF(trim(COALESCE(_observacoes,'')), ''),
    'pendente',
    manual
  ) RETURNING * INTO novo;

  RETURN novo.codigo_acompanhamento;
END; $function$;

-- agente_alterar_reserva: passa a usar horarios_especiais para o calculo do
-- limite e marca confirmacao_manual_necessaria quando a alteração cair nessa
-- mesma regra (quantidade já é >30 => sempre PRECISA_EQUIPE, isso não muda).
CREATE OR REPLACE FUNCTION public.agente_alterar_reserva(_slug text, _telefone text, _codigo text, _data date DEFAULT NULL::date, _horario time without time zone DEFAULT NULL::time without time zone, _quantidade integer DEFAULT NULL::integer, _area text DEFAULT NULL::text, _observacoes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t public.tenants;
  r public.reservas;
  v_data date; v_hor time; v_qtd int; v_area public.reserva_area;
  limite time; especial time; fds boolean; cap jsonb; precisa int; restante int; col text;
BEGIN
  SELECT * INTO t FROM public.tenants WHERE slug = lower(_slug) AND ativo = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'erro', 'EMPRESA_NAO_ENCONTRADA'); END IF;

  SELECT * INTO r FROM public.reservas WHERE tenant_id = t.id AND codigo_acompanhamento = upper(trim(_codigo));
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'erro', 'RESERVA_NAO_ENCONTRADA'); END IF;
  IF public.ia_tel_chave(r.telefone) <> public.ia_tel_chave(_telefone) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'RESERVA_DE_OUTRO_TELEFONE');
  END IF;
  IF r.status IN ('cancelada', 'finalizada') THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'RESERVA_NAO_ALTERAVEL', 'status', r.status::text);
  END IF;
  IF _data IS NULL AND _horario IS NULL AND _quantidade IS NULL AND NULLIF(_area, '') IS NULL AND NULLIF(_observacoes, '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'NADA_PARA_ALTERAR');
  END IF;

  v_data := COALESCE(_data, r.data);
  v_hor := COALESCE(_horario, r.horario);
  v_qtd := COALESCE(_quantidade, r.quantidade);

  IF r.tipo IN ('evento', 'casamento') OR COALESCE(r.quantidade, 0) > 30 OR COALESCE(v_qtd, 0) > 30 THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'PRECISA_EQUIPE');
  END IF;
  IF v_qtd IS NOT NULL AND v_qtd < 1 THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'QUANTIDADE_INVALIDA');
  END IF;

  IF NULLIF(_area, '') IS NOT NULL THEN
    IF lower(_area) NOT IN ('interna', 'externa', 'sem_preferencia', 'salao', 'fundos', 'corredor', 'varanda') THEN
      RETURN jsonb_build_object('ok', false, 'erro', 'AREA_INVALIDA');
    END IF;
    v_area := lower(_area)::public.reserva_area;
  END IF;

  IF v_data IS NOT NULL AND v_data < (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'DATA_PASSADA');
  END IF;

  IF v_data IS NOT NULL AND v_hor IS NOT NULL THEN
    SELECT h.horario_limite INTO especial FROM public.horarios_especiais h
     WHERE h.tenant_id = t.id AND h.data = v_data;
    IF especial IS NOT NULL THEN
      limite := especial;
    ELSE
      fds := extract(dow FROM v_data) IN (0, 6)
        OR EXISTS (SELECT 1 FROM public.feriados f WHERE f.tenant_id = t.id AND f.data = v_data);
      limite := CASE WHEN fds THEN t.horario_limite_fim_semana ELSE t.horario_limite_semana END;
      IF extract(dow FROM v_data) = 6 AND t.horario_limite_sabado IS NOT NULL THEN limite := t.horario_limite_sabado; END IF;
    END IF;
    IF limite IS NOT NULL AND v_hor > limite THEN
      RETURN jsonb_build_object('ok', false, 'erro', 'HORARIO_ACIMA_DO_LIMITE', 'limite', public.ia_fmt_hora(limite), 'data', v_data::text);
    END IF;
  END IF;

  IF v_data IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.agenda_bloqueios b
     WHERE b.tenant_id = t.id AND b.data = v_data
       AND ((b.hora_inicio IS NULL AND b.hora_fim IS NULL)
            OR (v_hor IS NOT NULL AND v_hor >= COALESCE(b.hora_inicio, time '00:00') AND v_hor <= COALESCE(b.hora_fim, time '23:59')))
  ) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'DATA_OU_HORARIO_BLOQUEADO', 'data', v_data::text);
  END IF;

  IF v_data IS NOT NULL AND v_qtd IS NOT NULL AND (v_data IS DISTINCT FROM r.data OR v_qtd > COALESCE(r.quantidade, 0)) THEN
    BEGIN
      cap := (public.capacidade_do_dia(t.slug, v_data))::text::jsonb;
      restante := NULLIF(cap ->> 'dia_restante', '')::int;
      precisa := CASE WHEN v_data IS DISTINCT FROM r.data THEN v_qtd ELSE v_qtd - COALESCE(r.quantidade, 0) END;
      IF restante IS NOT NULL AND precisa > restante THEN
        RETURN jsonb_build_object('ok', false, 'erro', 'SEM_VAGAS', 'dia_restante', restante, 'data', v_data::text);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  UPDATE public.reservas
     SET data = v_data,
         horario = v_hor,
         quantidade = v_qtd,
         area = COALESCE(v_area, area),
         observacoes = CASE WHEN NULLIF(_observacoes, '') IS NULL THEN observacoes
                            WHEN observacoes IS NULL OR observacoes = '' THEN _observacoes
                            ELSE observacoes || E'\n' || _observacoes END
   WHERE id = r.id
   RETURNING * INTO r;

  IF _data IS NOT NULL THEN
    FOREACH col IN ARRAY ARRAY['lembrete_24h_enviado', 'aviso_confirmacao_7d_enviado', 'aviso_confirmacao_2d_enviado'] LOOP
      BEGIN
        EXECUTE format('UPDATE public.reservas SET %I = false WHERE id = $1', col) USING r.id;
      EXCEPTION WHEN undefined_column THEN NULL;
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok', true, 'reserva', jsonb_build_object(
    'codigo', r.codigo_acompanhamento, 'data', r.data::text, 'horario', r.horario::text,
    'quantidade', r.quantidade, 'area', r.area::text, 'status', r.status::text, 'observacoes', r.observacoes));
END $function$;

-- confirmar_reserva_por_codigo: nunca confirma reserva marcada como
-- "Evento - A negociar" (confirmacao_manual_necessaria). Só a equipe confirma
-- essa reserva no Teggly (update direto, sem passar por esta função).
CREATE OR REPLACE FUNCTION public.confirmar_reserva_por_codigo(_codigo text)
 RETURNS TABLE(id uuid, codigo_acompanhamento text, nome text, telefone text, status reserva_status)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r public.reservas;
BEGIN
  SELECT * INTO r FROM public.reservas rsv WHERE rsv.codigo_acompanhamento = upper(_codigo);
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva nao encontrada'; END IF;
  IF r.status NOT IN ('pendente') THEN
    RAISE EXCEPTION 'Reserva nao esta pendente de confirmacao';
  END IF;
  IF r.confirmacao_manual_necessaria THEN
    RAISE EXCEPTION 'RESERVA_PRECISA_CONFIRMACAO_MANUAL_DA_EQUIPE';
  END IF;

  UPDATE public.reservas rsv SET status = 'confirmada' WHERE rsv.id = r.id
  RETURNING rsv.id, rsv.codigo_acompanhamento, rsv.nome, rsv.telefone, rsv.status
  INTO id, codigo_acompanhamento, nome, telefone, status;

  RETURN NEXT;
END;
$function$;

-- Bloco "DADOS AO VIVO DO TEGGLY" passa a citar os horarios especiais cadastrados
-- (ex.: 23/12) para a Dona Iracema nunca informar o horario normal nesses dias.
CREATE OR REPLACE FUNCTION public.ia_contexto_ao_vivo(_slug text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE t public.tenants; txt text; fer text; esp text;
        hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  SELECT * INTO t FROM public.tenants WHERE slug = lower(_slug) AND ativo = true;
  IF NOT FOUND THEN RETURN ''; END IF;
  txt := E'\n---\n\n# DADOS AO VIVO DO TEGGLY (cadastro atual da casa no sistema; PREVALECEM sobre qualquer horário ou regra citada em outro trecho desta base)\n'
      || 'HOJE é ' || to_char(hoje, 'DD/MM/YYYY') || ' e AMANHÃ é ' || to_char(hoje + 1, 'DD/MM/YYYY')
      || E' (horário de Brasília). Reserva com data igual a hoje é "hoje", nunca "amanhã".\n'
      || E'Último horário aceito para reservas de mesa e aniversário (grupos até 30 pessoas):\n'
      || '- Segunda a sexta: ' || COALESCE(public.ia_fmt_hora(t.horario_limite_semana), 'sem limite cadastrado') || E'\n'
      || '- Sábado: ' || COALESCE(public.ia_fmt_hora(COALESCE(t.horario_limite_sabado, t.horario_limite_fim_semana)), 'sem limite cadastrado') || E'\n'
      || '- Domingo e feriados: ' || COALESCE(public.ia_fmt_hora(t.horario_limite_fim_semana), 'sem limite cadastrado') || E'\n'
      || E'Ao responder sobre horário-limite de reserva, use SOMENTE estes valores. Grupos maiores e eventos são tratados pela equipe.\n';
  SELECT string_agg('- ' || to_char(f.data, 'DD/MM/YYYY') || COALESCE(' (' || f.motivo || ')', ''), E'\n' ORDER BY f.data)
    INTO fer FROM public.feriados_do_tenant(t.slug) f WHERE f.data BETWEEN hoje AND hoje + 60;
  IF fer IS NOT NULL THEN
    txt := txt || E'Feriados cadastrados nos próximos 60 dias (usam o limite de domingo):\n' || fer || E'\n';
  END IF;
  SELECT string_agg('- ' || to_char(h.data, 'DD/MM/YYYY') || ': horário-limite ' || public.ia_fmt_hora(h.horario_limite) || COALESCE(' (' || h.motivo || ')', ''), E'\n' ORDER BY h.data)
    INTO esp FROM public.horarios_especiais h WHERE h.tenant_id = t.id AND h.data BETWEEN hoje AND hoje + 60;
  IF esp IS NOT NULL THEN
    txt := txt || E'Horários especiais cadastrados (substituem o limite normal nessas datas):\n' || esp || E'\n';
  END IF;
  RETURN txt;
END $function$;
