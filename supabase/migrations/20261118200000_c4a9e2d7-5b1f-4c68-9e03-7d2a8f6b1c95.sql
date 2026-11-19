-- Atendente de WhatsApp (Dona Iracema) conectada ao Teggly
-- ========================================================
-- 1) Liga/desliga a IA no WhatsApp inteiro e por conversa (botão no painel).
-- 2) Agrupa mensagens seguidas da mesma pessoa em UMA resposta (fim das respostas repetidas).
-- 3) Alteração de reserva feita pela própria Iracema, com as mesmas regras do site.
-- 4) Base de conhecimento com dados ao vivo do Teggly (limite de sábado etc.), domínio público
--    em um lugar só e link hub no lugar do Linktree.
-- Tudo idempotente.

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ia_tel_chave(_tel text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$ SELECT right(regexp_replace(COALESCE(_tel, ''), '\D', '', 'g'), 8) $$;

CREATE OR REPLACE FUNCTION public.ia_fmt_hora(_h time without time zone)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN _h IS NULL THEN NULL
    WHEN extract(minute FROM _h) = 0 THEN to_char(_h, 'FMHH24') || 'h'
    ELSE to_char(_h, 'FMHH24') || 'h' || to_char(_h, 'MI')
  END
$$;

-- ---------------------------------------------------------------------------
-- 1) Configuração e pausa da IA
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ia_agente_config (
  tenant_slug text PRIMARY KEY,
  whatsapp_ativo boolean NOT NULL DEFAULT true,
  -- Domínio público usado nos links que a IA envia. Quando voltar para https://teggly.com.br,
  -- basta um UPDATE aqui.
  dominio_publico text NOT NULL DEFAULT 'https://teggly.bauerlab.com.br',
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid
);

INSERT INTO public.ia_agente_config (tenant_slug)
VALUES ('iracema')
ON CONFLICT (tenant_slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.ia_conversa_pausa (
  tenant_slug text NOT NULL,
  telefone_chave text NOT NULL,
  telefone text NOT NULL,
  pausado_ate timestamptz, -- NULL = até alguém religar
  criado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid,
  PRIMARY KEY (tenant_slug, telefone_chave)
);

ALTER TABLE public.ia_agente_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_conversa_pausa ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ia_agente_config FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.ia_conversa_pausa FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ia_agente_config TO service_role;
GRANT ALL ON public.ia_conversa_pausa TO service_role;
-- Sem policies: o painel só acessa pelas funções abaixo.

CREATE OR REPLACE FUNCTION public.ia_whatsapp_deve_responder(_slug text, _telefone text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE((SELECT c.whatsapp_ativo FROM public.ia_agente_config c WHERE c.tenant_slug = lower(_slug)), true)
     AND NOT EXISTS (
       SELECT 1 FROM public.ia_conversa_pausa p
        WHERE p.tenant_slug = lower(_slug)
          AND p.telefone_chave = public.ia_tel_chave(_telefone)
          AND (p.pausado_ate IS NULL OR p.pausado_ate > now())
     )
$$;

CREATE OR REPLACE FUNCTION public.ia_dominio_publico(_slug text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT regexp_replace(c.dominio_publico, '/+$', '') FROM public.ia_agente_config c WHERE c.tenant_slug = lower(_slug)),
    'https://teggly.bauerlab.com.br')
$$;

-- Painel: estado atual (só quem administra a empresa).
CREATE OR REPLACE FUNCTION public.ia_whatsapp_estado(_slug text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE t public.tenants;
BEGIN
  SELECT * INTO t FROM public.tenants WHERE slug = lower(_slug);
  IF NOT FOUND OR NOT COALESCE(public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_tenant_role(auth.uid(), t.id), false) THEN
    RAISE EXCEPTION 'Sem permissao';
  END IF;
  RETURN jsonb_build_object(
    'ativo', COALESCE((SELECT c.whatsapp_ativo FROM public.ia_agente_config c WHERE c.tenant_slug = t.slug), true),
    'pausadas', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('telefone', p.telefone, 'pausado_ate', p.pausado_ate, 'criado_em', p.criado_em)
                       ORDER BY p.criado_em DESC)
        FROM public.ia_conversa_pausa p
       WHERE p.tenant_slug = t.slug AND (p.pausado_ate IS NULL OR p.pausado_ate > now())
    ), '[]'::jsonb)
  );
END $$;

-- Painel: liga/desliga a IA no WhatsApp inteiro.
CREATE OR REPLACE FUNCTION public.ia_whatsapp_definir_global(_slug text, _ativo boolean)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE t public.tenants;
BEGIN
  SELECT * INTO t FROM public.tenants WHERE slug = lower(_slug);
  IF NOT FOUND OR NOT COALESCE(public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_tenant_role(auth.uid(), t.id), false) THEN
    RAISE EXCEPTION 'Sem permissao';
  END IF;
  INSERT INTO public.ia_agente_config (tenant_slug, whatsapp_ativo, atualizado_em, atualizado_por)
  VALUES (t.slug, COALESCE(_ativo, true), now(), auth.uid())
  ON CONFLICT (tenant_slug) DO UPDATE
    SET whatsapp_ativo = EXCLUDED.whatsapp_ativo, atualizado_em = now(), atualizado_por = auth.uid();
  RETURN public.ia_whatsapp_estado(t.slug);
END $$;

-- Painel: pausa/retoma a IA numa conversa só. _horas NULL = até religar.
CREATE OR REPLACE FUNCTION public.ia_whatsapp_definir_conversa(_slug text, _telefone text, _pausado boolean, _horas integer DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE t public.tenants; chave text;
BEGIN
  SELECT * INTO t FROM public.tenants WHERE slug = lower(_slug);
  IF NOT FOUND OR NOT COALESCE(public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_tenant_role(auth.uid(), t.id), false) THEN
    RAISE EXCEPTION 'Sem permissao';
  END IF;
  chave := public.ia_tel_chave(_telefone);
  IF length(chave) < 8 THEN RAISE EXCEPTION 'Telefone invalido'; END IF;
  IF COALESCE(_pausado, false) THEN
    INSERT INTO public.ia_conversa_pausa (tenant_slug, telefone_chave, telefone, pausado_ate, criado_por)
    VALUES (t.slug, chave, regexp_replace(_telefone, '\D', '', 'g'),
            CASE WHEN _horas IS NULL THEN NULL ELSE now() + make_interval(hours => _horas) END, auth.uid())
    ON CONFLICT (tenant_slug, telefone_chave) DO UPDATE
      SET pausado_ate = EXCLUDED.pausado_ate, criado_em = now(), criado_por = auth.uid();
  ELSE
    DELETE FROM public.ia_conversa_pausa WHERE tenant_slug = t.slug AND telefone_chave = chave;
  END IF;
  RETURN public.ia_whatsapp_estado(t.slug);
END $$;

REVOKE ALL ON FUNCTION public.ia_whatsapp_estado(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ia_whatsapp_definir_global(text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ia_whatsapp_definir_conversa(text, text, boolean, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ia_whatsapp_estado(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_whatsapp_definir_global(text, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_whatsapp_definir_conversa(text, text, boolean, integer) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.ia_whatsapp_deve_responder(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ia_dominio_publico(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ia_whatsapp_deve_responder(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ia_dominio_publico(text) TO service_role;

-- ---------------------------------------------------------------------------
-- 2) Agrupamento de mensagens seguidas (debounce por telefone)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ia_msg_buffer (
  id bigserial PRIMARY KEY,
  tenant_slug text NOT NULL,
  telefone_chave text NOT NULL,
  telefone text NOT NULL,
  texto text NOT NULL,
  msg_id text,
  consumido boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ia_msg_buffer_msg_id_uniq
  ON public.ia_msg_buffer (tenant_slug, msg_id) WHERE msg_id IS NOT NULL AND msg_id <> '';
CREATE INDEX IF NOT EXISTS ia_msg_buffer_fila
  ON public.ia_msg_buffer (tenant_slug, telefone_chave, id) WHERE NOT consumido;

ALTER TABLE public.ia_msg_buffer ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ia_msg_buffer FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ia_msg_buffer TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ia_msg_buffer_id_seq TO service_role;

-- Registra a mensagem recebida. responder=false quando a IA está desligada (geral ou nesta conversa)
-- ou quando o webhook veio duplicado.
CREATE OR REPLACE FUNCTION public.ia_buffer_add(_slug text, _telefone text, _texto text, _msg_id text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE novo_id bigint;
BEGIN
  IF NOT public.ia_whatsapp_deve_responder(_slug, _telefone) THEN
    RETURN jsonb_build_object('responder', false, 'duplicada', false, 'buffer_id', NULL, 'motivo', 'ia_desligada');
  END IF;

  DELETE FROM public.ia_msg_buffer WHERE criado_em < now() - interval '2 days';

  INSERT INTO public.ia_msg_buffer (tenant_slug, telefone_chave, telefone, texto, msg_id)
  VALUES (lower(_slug), public.ia_tel_chave(_telefone), regexp_replace(_telefone, '\D', '', 'g'), COALESCE(_texto, ''), NULLIF(_msg_id, ''))
  ON CONFLICT DO NOTHING
  RETURNING id INTO novo_id;

  IF novo_id IS NULL THEN
    RETURN jsonb_build_object('responder', false, 'duplicada', true, 'buffer_id', NULL, 'motivo', 'duplicada');
  END IF;
  RETURN jsonb_build_object('responder', true, 'duplicada', false, 'buffer_id', novo_id);
END $$;

-- Depois da espera: só a execução da mensagem MAIS RECENTE coleta tudo e responde.
CREATE OR REPLACE FUNCTION public.ia_buffer_coletar(_slug text, _telefone text, _buffer_id bigint)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE chave text := public.ia_tel_chave(_telefone); juntas text; qtd int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(lower(_slug) || ':' || chave));

  IF EXISTS (SELECT 1 FROM public.ia_msg_buffer b
              WHERE b.tenant_slug = lower(_slug) AND b.telefone_chave = chave
                AND b.id > _buffer_id AND NOT b.consumido) THEN
    RETURN jsonb_build_object('coletar', false, 'motivo', 'ha_mensagem_mais_nova');
  END IF;

  -- A IA pode ter sido pausada durante a espera.
  IF NOT public.ia_whatsapp_deve_responder(_slug, _telefone) THEN
    UPDATE public.ia_msg_buffer SET consumido = true
     WHERE tenant_slug = lower(_slug) AND telefone_chave = chave AND id <= _buffer_id AND NOT consumido;
    RETURN jsonb_build_object('coletar', false, 'motivo', 'ia_desligada');
  END IF;

  WITH pend AS (
    UPDATE public.ia_msg_buffer SET consumido = true
     WHERE tenant_slug = lower(_slug) AND telefone_chave = chave
       AND id <= _buffer_id AND NOT consumido
       AND criado_em > now() - interval '10 minutes'
    RETURNING id, texto
  )
  SELECT string_agg(texto, E'\n' ORDER BY id), count(*) INTO juntas, qtd FROM pend;

  IF juntas IS NULL THEN
    RETURN jsonb_build_object('coletar', false, 'motivo', 'ja_coletada');
  END IF;
  RETURN jsonb_build_object('coletar', true, 'texto', juntas, 'qtd', qtd);
END $$;

REVOKE ALL ON FUNCTION public.ia_buffer_add(text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ia_buffer_coletar(text, text, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ia_buffer_add(text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ia_buffer_coletar(text, text, bigint) TO service_role;

-- ---------------------------------------------------------------------------
-- 3) Alteração de reserva pela Iracema (mesmas regras do site)
-- ---------------------------------------------------------------------------
-- O telefone vem do WhatsApp (não da IA): só altera reserva do próprio número.
-- Devolve {ok, erro, ...}; os códigos de erro deixam a Iracema explicar o motivo com dados reais.
CREATE OR REPLACE FUNCTION public.agente_alterar_reserva(
  _slug text, _telefone text, _codigo text,
  _data date DEFAULT NULL, _horario time without time zone DEFAULT NULL, _quantidade integer DEFAULT NULL,
  _area text DEFAULT NULL, _observacoes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  t public.tenants;
  r public.reservas;
  v_data date; v_hor time; v_qtd int; v_area public.reserva_area;
  limite time; fds boolean; cap jsonb; precisa int; restante int; col text;
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

  -- Evento, casamento e grupos grandes são negociados pela equipe.
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

  -- Horário-limite (mesma regra de criar_reserva).
  IF v_data IS NOT NULL AND v_hor IS NOT NULL THEN
    fds := extract(dow FROM v_data) IN (0, 6)
      OR EXISTS (SELECT 1 FROM public.feriados f WHERE f.tenant_id = t.id AND f.data = v_data);
    limite := CASE WHEN fds THEN t.horario_limite_fim_semana ELSE t.horario_limite_semana END;
    IF extract(dow FROM v_data) = 6 AND t.horario_limite_sabado IS NOT NULL THEN limite := t.horario_limite_sabado; END IF;
    IF limite IS NOT NULL AND v_hor > limite THEN
      RETURN jsonb_build_object('ok', false, 'erro', 'HORARIO_ACIMA_DO_LIMITE', 'limite', public.ia_fmt_hora(limite), 'data', v_data::text);
    END IF;
  END IF;

  -- Bloqueio de agenda.
  IF v_data IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.agenda_bloqueios b
     WHERE b.tenant_id = t.id AND b.data = v_data
       AND ((b.hora_inicio IS NULL AND b.hora_fim IS NULL)
            OR (v_hor IS NOT NULL AND v_hor >= COALESCE(b.hora_inicio, time '00:00') AND v_hor <= COALESCE(b.hora_fim, time '23:59')))
  ) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'DATA_OU_HORARIO_BLOQUEADO', 'data', v_data::text);
  END IF;

  -- Lotação do dia (se a casa definiu limite). A reserva atual já conta no dia antigo.
  IF v_data IS NOT NULL AND v_qtd IS NOT NULL AND (v_data IS DISTINCT FROM r.data OR v_qtd > COALESCE(r.quantidade, 0)) THEN
    BEGIN
      cap := (public.capacidade_do_dia(t.slug, v_data))::text::jsonb;
      restante := NULLIF(cap ->> 'dia_restante', '')::int;
      precisa := CASE WHEN v_data IS DISTINCT FROM r.data THEN v_qtd ELSE v_qtd - COALESCE(r.quantidade, 0) END;
      IF restante IS NOT NULL AND precisa > restante THEN
        RETURN jsonb_build_object('ok', false, 'erro', 'SEM_VAGAS', 'dia_restante', restante, 'data', v_data::text);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- sem informação de capacidade: segue (a confirmação final é da equipe)
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

  -- Data nova: os avisos/lembretes automáticos precisam valer para a nova data.
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
END $$;

REVOKE ALL ON FUNCTION public.agente_alterar_reserva(text, text, text, date, time without time zone, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agente_alterar_reserva(text, text, text, date, time without time zone, integer, text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 4) Base de conhecimento com dados ao vivo
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ia_contexto_ao_vivo(_slug text)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE t public.tenants; txt text; fer text;
BEGIN
  SELECT * INTO t FROM public.tenants WHERE slug = lower(_slug) AND ativo = true;
  IF NOT FOUND THEN RETURN ''; END IF;

  txt := E'\n---\n\n# DADOS AO VIVO DO TEGGLY (cadastro atual da casa no sistema; PREVALECEM sobre qualquer horário ou regra citada em outro trecho desta base)\n'
      || E'Último horário aceito para reservas de mesa e aniversário (grupos até 30 pessoas):\n'
      || '- Segunda a sexta: ' || COALESCE(public.ia_fmt_hora(t.horario_limite_semana), 'sem limite cadastrado') || E'\n'
      || '- Sábado: ' || COALESCE(public.ia_fmt_hora(COALESCE(t.horario_limite_sabado, t.horario_limite_fim_semana)), 'sem limite cadastrado') || E'\n'
      || '- Domingo e feriados: ' || COALESCE(public.ia_fmt_hora(t.horario_limite_fim_semana), 'sem limite cadastrado') || E'\n'
      || E'Ao responder sobre horário-limite de reserva, use SOMENTE estes valores. Grupos maiores e eventos são tratados pela equipe.\n';

  SELECT string_agg('- ' || to_char(f.data, 'DD/MM/YYYY') || COALESCE(' (' || f.motivo || ')', ''), E'\n' ORDER BY f.data)
    INTO fer
    FROM public.feriados_do_tenant(t.slug) f
   WHERE f.data BETWEEN current_date AND current_date + 60;
  IF fer IS NOT NULL THEN
    txt := txt || E'Feriados cadastrados nos próximos 60 dias (usam o limite de domingo):\n' || fer || E'\n';
  END IF;
  RETURN txt;
END $$;

-- Base final entregue à IA: texto da base + domínio público configurável + dados ao vivo.
CREATE OR REPLACE FUNCTION public.base_conhecimento_final(_slug text)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE base text; dom text := public.ia_dominio_publico(_slug);
BEGIN
  base := COALESCE(public.base_conhecimento_do_tenant(_slug), '');
  IF base = '' THEN RETURN ''; END IF;
  base := replace(replace(base, 'https://teggly.bauerlab.com.br', dom), 'https://teggly.com.br', dom);
  RETURN base || public.ia_contexto_ao_vivo(_slug);
END $$;

REVOKE ALL ON FUNCTION public.ia_contexto_ao_vivo(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.base_conhecimento_final(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ia_contexto_ao_vivo(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.base_conhecimento_final(text) TO service_role;

-- Texto da base (Iracema)
-- 4a) Horário-limite de reserva deixa de ser texto fixo: vem do bloco DADOS AO VIVO.
UPDATE public.ia_base_conhecimento
SET conteudo = regexp_replace(
      conteudo,
      'Aos sábados as reservas são aceitas até as 17h30[^\n]*',
      E'O último horário aceito para reservas de cada dia está no bloco DADOS AO VIVO DO TEGGLY, no fim desta base (é o cadastro atual do sistema e prevalece sobre qualquer horário citado em outro trecho). Informe o limite do dia perguntado exatamente como está lá. Não prometa um horário específico: a pessoa escolhe no link e a confirmação final é do sistema. Aos sábados a casa funciona até as 19h.')
WHERE tenant_slug = 'iracema'
  AND conteudo ~ 'Aos sábados as reservas são aceitas até as 17h30';

-- 4b) Almoço de fim de semana.
UPDATE public.ia_base_conhecimento
SET conteudo = regexp_replace(
      conteudo,
      'Almoço de sábado e domingo:[^\n]*',
      E'Almoço de sábado e domingo: 12h às 15h (depois disso segue o funcionamento normal da casa até o fechamento), exceto em dias de evento ou com a casa fechada (veja a seção 23 e a ferramenta Consultar eventos em destaque).')
WHERE tenant_slug = 'iracema'
  AND conteudo ~ 'Almoço de sábado e domingo:'
  AND conteudo !~ 'exceto em dias de evento ou com a casa fechada';

-- 4c) Linktree sai; entra o link hub do Teggly (o domínio é trocado em base_conhecimento_final).
UPDATE public.ia_base_conhecimento
SET conteudo = replace(replace(replace(conteudo,
      'https://linktr.ee/iracemabh', 'https://teggly.bauerlab.com.br/iracema/links'),
      'Acessos reunidos no Linktree', 'Acessos reunidos no link hub da casa'),
      'Linktree:', 'Link hub (delivery iFood e 99Food, cardápio, reservas e Instagram):')
WHERE tenant_slug = 'iracema'
  AND (conteudo LIKE '%linktr.ee%' OR conteudo LIKE '%Linktree%');

UPDATE public.ia_base_conhecimento
SET conteudo = replace(conteudo, 'Linktree', 'link hub')
WHERE tenant_slug = 'iracema' AND conteudo LIKE '%Linktree%';

UPDATE public.ia_base_conhecimento
SET conteudo = replace(
      conteudo,
      E'Instagram: @iracemabh\n',
      E'Instagram: @iracemabh\nNunca envie o link antigo de agregador (linktr.ee): foi substituído pelo link hub acima.\n')
WHERE tenant_slug = 'iracema'
  AND conteudo LIKE E'%Instagram: @iracemabh\n%'
  AND conteudo NOT LIKE '%Nunca envie o link antigo de agregador%';
