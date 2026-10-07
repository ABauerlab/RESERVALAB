-- REFERENCIA SOMENTE LEITURA. NAO E UMA MIGRATION. NAO APLICAR.
-- Definicoes das funcoes do schema public em producao (snapshot 2026-10-07).
-- URLs privadas e chaves foram substituidas por <REDACTED>.

CREATE OR REPLACE FUNCTION public.criar_reserva(_slug text, _tipo reserva_tipo, _nome text, _telefone text, _quantidade integer, _data date, _horario time without time zone DEFAULT NULL, _area reserva_area DEFAULT NULL, _leva_bolo boolean DEFAULT NULL, _comandas boolean DEFAULT NULL, _tipo_evento text DEFAULT NULL, _observacoes text DEFAULT NULL)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  t public.tenants; novo public.reservas; ocupadas int; grandes int; fim_de_semana boolean; limite time without time zone;
BEGIN
  SELECT * INTO t FROM public.tenants WHERE slug = lower(_slug) AND ativo = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Empresa nao encontrada ou inativa'; END IF;
  IF _nome IS NULL OR length(trim(_nome)) < 2 THEN RAISE EXCEPTION 'Nome invalido'; END IF;
  IF _telefone IS NULL OR length(regexp_replace(_telefone, '\D', '', 'g')) < 10 THEN RAISE EXCEPTION 'Telefone invalido'; END IF;
  IF NOT (_tipo = ANY (t.tipos_aceitos)) THEN RAISE EXCEPTION 'Este tipo de reserva nao esta disponivel'; END IF;
  IF _data IS NOT NULL AND _horario IS NOT NULL AND COALESCE(_quantidade, 0) <= 30 THEN
    fim_de_semana := extract(dow FROM _data) IN (0, 6)
      OR EXISTS (SELECT 1 FROM public.feriados f WHERE f.tenant_id = t.id AND f.data = _data);
    limite := CASE WHEN fim_de_semana THEN t.horario_limite_fim_semana ELSE t.horario_limite_semana END;
    IF limite IS NOT NULL AND _horario > limite THEN RAISE EXCEPTION 'Data ou horario indisponivel'; END IF;
  END IF;
  IF _data IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.agenda_bloqueios b
     WHERE b.tenant_id = t.id AND b.data = _data
       AND ((b.hora_inicio IS NULL AND b.hora_fim IS NULL)
         OR (_horario IS NOT NULL AND _horario >= COALESCE(b.hora_inicio, time '00:00') AND _horario <= COALESCE(b.hora_fim, time '23:59')))
  ) THEN RAISE EXCEPTION 'Data ou horario indisponivel'; END IF;
  IF _data IS NOT NULL AND _horario IS NOT NULL THEN
    SELECT count(*), count(*) FILTER (WHERE r.quantidade > 50) INTO ocupadas, grandes
      FROM public.reservas r
     WHERE r.tenant_id = t.id AND r.data = _data AND r.horario = _horario AND r.status <> 'cancelada';
    IF grandes > 0 THEN RAISE EXCEPTION 'Data ou horario indisponivel'; END IF;
    IF COALESCE(_quantidade, 0) > 50 AND ocupadas > 0 THEN RAISE EXCEPTION 'Data ou horario indisponivel'; END IF;
  END IF;
  INSERT INTO public.reservas (tenant_id, codigo_acompanhamento, tipo, nome, telefone, quantidade, data, horario, area, leva_bolo, comandas, tipo_evento, observacoes, status)
  VALUES (t.id, '', _tipo, trim(_nome), trim(_telefone), _quantidade, _data, _horario, _area, _leva_bolo, _comandas,
    NULLIF(trim(COALESCE(_tipo_evento,'')), ''), NULLIF(trim(COALESCE(_observacoes,'')), ''), 'pendente')
  RETURNING * INTO novo;
  RETURN novo.codigo_acompanhamento;
END; $function$;

CREATE OR REPLACE FUNCTION public.get_reserva_by_codigo(_codigo text) RETURNS SETOF reservas LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT * FROM public.reservas WHERE codigo_acompanhamento = upper(_codigo) LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.update_reserva_by_codigo(_codigo text, _data date, _horario time without time zone, _quantidade integer, _area reserva_area, _observacoes text) RETURNS reservas LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE r public.reservas;
BEGIN
  SELECT * INTO r FROM public.reservas WHERE codigo_acompanhamento = upper(_codigo);
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva nao encontrada'; END IF;
  IF r.status IN ('cancelada','finalizada') THEN RAISE EXCEPTION 'Reserva nao pode ser alterada'; END IF;
  UPDATE public.reservas SET data = COALESCE(_data, data), horario = COALESCE(_horario, horario), quantidade = COALESCE(_quantidade, quantidade), area = COALESCE(_area, area), observacoes = COALESCE(_observacoes, observacoes)
   WHERE id = r.id RETURNING * INTO r;
  RETURN r;
END; $function$;

CREATE OR REPLACE FUNCTION public.cancelar_reserva_por_codigo(_codigo text, _motivo text DEFAULT NULL) RETURNS reservas LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE r public.reservas;
BEGIN
  SELECT * INTO r FROM public.reservas WHERE codigo_acompanhamento = upper(_codigo);
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva nao encontrada'; END IF;
  IF r.status IN ('cancelada', 'finalizada') THEN RAISE EXCEPTION 'Reserva nao pode ser cancelada'; END IF;
  UPDATE public.reservas SET status = 'cancelada', motivo_cancelamento = _motivo WHERE id = r.id RETURNING * INTO r;
  RETURN r;
END; $function$;

CREATE OR REPLACE FUNCTION public.confirmar_reserva_por_codigo(_codigo text) RETURNS TABLE(id uuid, codigo_acompanhamento text, nome text, telefone text, status reserva_status) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE r public.reservas;
BEGIN
  SELECT * INTO r FROM public.reservas rsv WHERE rsv.codigo_acompanhamento = upper(_codigo);
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva nao encontrada'; END IF;
  IF r.status NOT IN ('pendente') THEN RAISE EXCEPTION 'Reserva nao esta pendente de confirmacao'; END IF;
  UPDATE public.reservas rsv SET status = 'confirmada' WHERE rsv.id = r.id
  RETURNING rsv.id, rsv.codigo_acompanhamento, rsv.nome, rsv.telefone, rsv.status INTO id, codigo_acompanhamento, nome, telefone, status;
  RETURN NEXT;
END; $function$;

CREATE OR REPLACE FUNCTION public.confirmar_reserva_sem_notificar(_id uuid) RETURNS reservas LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE r public.reservas;
BEGIN
  PERFORM set_config('app.skip_cliente_notify', 'true', true);
  UPDATE public.reservas SET status = 'confirmada' WHERE id = _id RETURNING * INTO r;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva nao encontrada'; END IF;
  RETURN r;
END; $function$;

CREATE OR REPLACE FUNCTION public.reserva_por_telefone_do_tenant(_slug text, _telefone text) RETURNS TABLE(codigo_acompanhamento text, tipo reserva_tipo, nome text, quantidade integer, data date, horario time without time zone, area reserva_area, status reserva_status, created_at timestamp with time zone) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT r.codigo_acompanhamento, r.tipo, r.nome, r.quantidade, r.data, r.horario, r.area, r.status, r.created_at
    FROM public.reservas r JOIN public.tenants t ON t.id = r.tenant_id
   WHERE t.slug = lower(_slug) AND t.ativo = true AND normalizar_telefone_br(r.telefone) = normalizar_telefone_br(_telefone)
   ORDER BY r.data DESC NULLS LAST, r.created_at DESC LIMIT 10;
$function$;

CREATE OR REPLACE FUNCTION public.reservas_para_lembrete_24h(_slug text) RETURNS TABLE(id uuid, nome text, telefone text, tipo reserva_tipo, data date, horario time without time zone, codigo_acompanhamento text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT r.id, r.nome, r.telefone, r.tipo, r.data, r.horario, r.codigo_acompanhamento
    FROM public.reservas r JOIN public.tenants t ON t.id = r.tenant_id
   WHERE t.slug = lower(_slug) AND t.ativo = true AND r.status = 'confirmada' AND r.lembrete_24h_enviado = false
     AND (r.data + coalesce(r.horario, time '12:00')) BETWEEN now() AND now() + interval '24 hours'
   ORDER BY r.data, r.horario;
$function$;

CREATE OR REPLACE FUNCTION public.reservas_para_aviso_7d(_slug text) RETURNS TABLE(id uuid, nome text, telefone text, tipo reserva_tipo, data date, horario time without time zone, quantidade integer, codigo_acompanhamento text, dias_restantes integer, tenant_nome text, tenant_slug text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT r.id, r.nome, r.telefone, r.tipo, r.data, r.horario, r.quantidade, r.codigo_acompanhamento,
         (r.data - (now() AT TIME ZONE 'America/Sao_Paulo')::date) AS dias_restantes, t.nome, t.slug
    FROM public.reservas r JOIN public.tenants t ON t.id = r.tenant_id
   WHERE t.slug = lower(_slug) AND t.ativo = true AND r.status = 'pendente' AND r.aviso_confirmacao_7d_enviado = false
     AND r.data >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
     AND r.data - (now() AT TIME ZONE 'America/Sao_Paulo')::date <= 7
     AND (r.created_at AT TIME ZONE 'America/Sao_Paulo')::date < r.data - 7
   ORDER BY r.data, r.horario;
$function$;

-- reservas_para_aviso_2d: stub (WHERE false), mantida apenas por compatibilidade.
-- reservas_para_aviso_pendente_2d: igual a 7d, com janela de 2 dias e flag aviso_confirmacao_2d_enviado.

CREATE OR REPLACE FUNCTION public.marcar_lembrete_24h_enviado(_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $function$
  UPDATE public.reservas SET lembrete_24h_enviado = true WHERE id = _id;
$function$;
-- marcar_aviso_7d_enviado e marcar_aviso_2d_enviado: identicas, com as flags aviso_confirmacao_7d_enviado / aviso_confirmacao_2d_enviado.

CREATE OR REPLACE FUNCTION public.bloqueios_do_tenant(_slug text) RETURNS TABLE(data date, hora_inicio time without time zone, hora_fim time without time zone, motivo text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT b.data, b.hora_inicio, b.hora_fim, NULL::text AS motivo
    FROM public.agenda_bloqueios b JOIN public.tenants t ON t.id = b.tenant_id
   WHERE t.slug = lower(_slug) AND t.ativo = true AND b.data >= current_date ORDER BY b.data;
$function$;
-- feriados_do_tenant e proximo_evento_do_tenant: mesma forma, usando current_date (UTC).

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$function$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_user_id uuid, _tenant_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND ((role = 'tenant_admin' AND tenant_id = _tenant_id) OR role = 'super_admin'));
$function$;

CREATE OR REPLACE FUNCTION public.get_my_tenant_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'tenant_admin' LIMIT 1;
$function$;

-- gen_reserva_codigo (trigger BEFORE INSERT): 'RL-' + 6 caracteres de 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' via random().
-- normalizar_telefone_br(text): remove nao-digitos e tira DDI 55 quando presente.
-- update_updated_at_column(): NEW.updated_at = now().

-- notificar_confirmacao_cliente (trigger AFTER INSERT/UPDATE): monta payload (op, id, nome, telefone, tipo, data, horario,
-- quantidade, area, codigo, motivo, dados do tenant e templates) e faz net.http_post para o webhook n8n <REDACTED>,
-- apenas com Content-Type. Respeita app.skip_cliente_notify.
-- notificar_mudanca_reserva (trigger AFTER INSERT/UPDATE): payload parecido; net.http_post para o webhook n8n <REDACTED>, sem segredo.
-- notify_new_reserva (trigger AFTER INSERT): net.http_post para <REDACTED app>/api/public/hooks/send-push com header apikey = <REDACTED anon key de outro projeto>.
