-- Etapa 2 da auditoria do grupo de reservas e das regras de horario.
--
-- 1) Workflow do grupo: trava de concorrencia (claim atomico com SKIP LOCKED),
--    controle de envio independente por mensagem (resumo_enviado/lista_enviada)
--    e agrupamento de alteracoes consecutivas ainda nao enviadas. As colunas
--    antigas (enviado/enviado_em) NAO sao removidas nesta migration, para que
--    uma execucao do workflow antigo que ainda esteja rodando no momento da
--    migracao continue funcionando sem erro.
-- 2) Regras de reserva: fora do horario normal vira "Evento - A negociar"
--    independente da quantidade (nao so acima de 30); minimo 50 / maximo 180
--    para evento particular validado direto no banco; agente_alterar_reserva
--    segue a mesma regra do criar_reserva e preserva a reserva original
--    (confirmada e intacta) enquanto uma alteracao fora do horario aguarda
--    aprovacao manual da equipe (nova tabela alteracoes_pendentes).
--
-- Tudo validado antes em transacoes com ROLLBACK (ver auditoria de 25/11/2026).

ALTER TABLE public.notificacoes_grupo_reservas
  ADD COLUMN IF NOT EXISTS processando_em timestamptz,
  ADD COLUMN IF NOT EXISTS resumo_enviado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lista_enviada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS estado_antes_texto text;

-- Backfill defensivo: qualquer linha que já exista com o esquema antigo
-- (enviado = true) deve ser tratada como totalmente enviada nas duas
-- mensagens, nunca reenviada.
UPDATE public.notificacoes_grupo_reservas
   SET resumo_enviado = enviado, lista_enviada = enviado
 WHERE enviado IS NOT NULL;

COMMENT ON COLUMN public.notificacoes_grupo_reservas.enviado IS
  'Coluna antiga, mantida só por compatibilidade com execuções do workflow anterior durante a transição. A fila passa a usar resumo_enviado e lista_enviada.';

CREATE TABLE IF NOT EXISTS public.alteracoes_pendentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reserva_id uuid NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  data_nova date,
  horario_nova time without time zone,
  quantidade_nova integer,
  area_nova public.reserva_area,
  observacoes_nova text,
  motivo text NOT NULL DEFAULT 'fora_do_horario',
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aplicada','rejeitada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reserva_id, status)
);
COMMENT ON TABLE public.alteracoes_pendentes IS
  'Pedido de mudanca numa reserva confirmada que levaria a reserva para fora do horario normal. A reserva original (public.reservas) NAO e tocada enquanto o pedido estiver pendente; so a equipe aplica manualmente no Teggly.';

ALTER TABLE public.alteracoes_pendentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admin reads own alteracoes_pendentes" ON public.alteracoes_pendentes
  FOR SELECT USING (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

CREATE OR REPLACE FUNCTION public.ia_notificar_grupo_reservas()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  linhas_afetadas int;
BEGIN
  IF NEW.status = 'confirmada' AND OLD.status = 'pendente' THEN
    INSERT INTO public.notificacoes_grupo_reservas (tenant_id, reserva_id, tipo, resumo)
    VALUES (NEW.tenant_id, NEW.id, 'nova', 'Nova reserva confirmada: ' || public.ia_resumo_reserva(NEW));

  ELSIF NEW.status = 'cancelada' AND OLD.status = 'confirmada' THEN
    INSERT INTO public.notificacoes_grupo_reservas (tenant_id, reserva_id, tipo, resumo)
    VALUES (NEW.tenant_id, NEW.id, 'cancelada', 'Reserva cancelada: ' || public.ia_resumo_reserva(OLD));

  ELSIF NEW.status = 'confirmada' AND OLD.status = 'confirmada' AND (
    NEW.data IS DISTINCT FROM OLD.data OR
    NEW.horario IS DISTINCT FROM OLD.horario OR
    NEW.quantidade IS DISTINCT FROM OLD.quantidade OR
    NEW.area IS DISTINCT FROM OLD.area
  ) THEN
    UPDATE public.notificacoes_grupo_reservas n
       SET resumo = 'Reserva alterada: ' || n.estado_antes_texto || ' → ' || public.ia_resumo_reserva(NEW)
     WHERE n.reserva_id = NEW.id
       AND n.tipo = 'alterada'
       AND NOT (n.resumo_enviado AND n.lista_enviada);
    GET DIAGNOSTICS linhas_afetadas = ROW_COUNT;

    IF linhas_afetadas = 0 THEN
      INSERT INTO public.notificacoes_grupo_reservas (tenant_id, reserva_id, tipo, resumo, estado_antes_texto)
      VALUES (NEW.tenant_id, NEW.id, 'alterada',
        'Reserva alterada: ' || public.ia_resumo_reserva(OLD) || ' → ' || public.ia_resumo_reserva(NEW),
        public.ia_resumo_reserva(OLD));
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

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

  IF _tipo = 'evento' AND (COALESCE(_quantidade, 0) < 50 OR _quantidade > 180) THEN
    RAISE EXCEPTION 'Quantidade invalida para evento particular (minimo 50, maximo 180)';
  END IF;

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

  -- Fora do horario normal: qualquer quantidade vira "Evento - A negociar",
  -- nunca mais bloqueia nem confirma automatico.
  IF fora_do_horario THEN
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
  fora_do_horario boolean := false;
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
      fora_do_horario := true;
    END IF;
  END IF;

  -- Mesma regra do criar_reserva: fora do horario (qualquer quantidade) nunca
  -- aplica direto. A reserva original fica intacta e confirmada; o pedido de
  -- mudanca fica pendente de aprovacao manual da equipe.
  IF fora_do_horario THEN
    INSERT INTO public.alteracoes_pendentes (tenant_id, reserva_id, data_nova, horario_nova, quantidade_nova, area_nova, observacoes_nova)
    VALUES (t.id, r.id, v_data, v_hor, v_qtd, v_area, NULLIF(_observacoes, ''))
    ON CONFLICT (reserva_id, status)
    DO UPDATE SET data_nova = EXCLUDED.data_nova, horario_nova = EXCLUDED.horario_nova,
                  quantidade_nova = EXCLUDED.quantidade_nova, area_nova = EXCLUDED.area_nova,
                  observacoes_nova = EXCLUDED.observacoes_nova, created_at = now();
    RETURN jsonb_build_object('ok', false, 'erro', 'ALTERACAO_PRECISA_CONFIRMACAO_MANUAL_DA_EQUIPE',
      'limite', public.ia_fmt_hora(limite), 'data', v_data::text, 'horario_pedido', public.ia_fmt_hora(v_hor));
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
