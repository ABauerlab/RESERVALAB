-- Reconfirmação de reservas grandes (30+ pessoas) e alerta de mesa grande.
--
-- reconfirmacao_enviada_em: quando a mensagem de reconfirmação foi enviada
--   (a resposta do cliente continua em reconfirmada_em / status).
-- reconfirmacao_chat_base: maior id da memória do chat no momento do envio,
--   para o painel mostrar só as respostas dadas depois da mensagem.
-- alerta_mesa_grande_enviado: reservas existentes entram como true para não
--   disparar alertas retroativos no deploy.
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS reconfirmacao_enviada_em timestamptz,
  ADD COLUMN IF NOT EXISTS reconfirmacao_chat_base integer,
  ADD COLUMN IF NOT EXISTS alerta_mesa_grande_enviado boolean NOT NULL DEFAULT true;
ALTER TABLE public.reservas
  ALTER COLUMN alerta_mesa_grande_enviado SET DEFAULT false;

-- Reservas grandes ativas, dentro da janela, ainda sem mensagem de reconfirmação.
CREATE OR REPLACE FUNCTION public.reservas_para_reconfirmacao_grande(_slug text, _min_pessoas integer DEFAULT 30, _dias integer DEFAULT 15)
 RETURNS TABLE(id uuid, nome text, telefone text, tipo reserva_tipo, status reserva_status, data date, horario time without time zone, quantidade integer, codigo_acompanhamento text, dias_restantes integer, tenant_nome text, tenant_slug text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT r.id, r.nome, r.telefone, r.tipo, r.status, r.data, r.horario, r.quantidade,
         r.codigo_acompanhamento,
         (r.data - (now() AT TIME ZONE 'America/Sao_Paulo')::date) AS dias_restantes,
         t.nome, t.slug
    FROM public.reservas r
    JOIN public.tenants t ON t.id = r.tenant_id
   WHERE t.slug = lower(_slug) AND t.ativo = true
     AND r.status IN ('pendente', 'confirmada')
     AND r.quantidade >= _min_pessoas
     AND r.reconfirmacao_enviada_em IS NULL
     AND r.reconfirmada_em IS NULL
     AND r.data >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
     AND r.data - (now() AT TIME ZONE 'America/Sao_Paulo')::date <= _dias
   ORDER BY r.data, r.horario NULLS LAST;
$function$;

CREATE OR REPLACE FUNCTION public.marcar_reconfirmacao_enviada(_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.reservas
     SET reconfirmacao_enviada_em = now(),
         reconfirmacao_chat_base = COALESCE((SELECT max(c.id) FROM public.n8n_chat_histories_iracema c), 0)
   WHERE id = _id;
$function$;

-- Mesas grandes que podem ser evento fechado, para a casa classificar.
CREATE OR REPLACE FUNCTION public.reservas_mesa_grande_a_classificar(_slug text, _min_pessoas integer DEFAULT 30)
 RETURNS TABLE(id uuid, nome text, telefone text, status reserva_status, data date, horario time without time zone, quantidade integer, codigo_acompanhamento text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT r.id, r.nome, r.telefone, r.status, r.data, r.horario, r.quantidade, r.codigo_acompanhamento
    FROM public.reservas r
    JOIN public.tenants t ON t.id = r.tenant_id
   WHERE t.slug = lower(_slug) AND t.ativo = true
     AND r.tipo = 'mesa'
     AND r.status IN ('pendente', 'confirmada')
     AND r.quantidade >= _min_pessoas
     AND r.alerta_mesa_grande_enviado = false
     AND r.data >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
   ORDER BY r.data, r.horario NULLS LAST;
$function$;

CREATE OR REPLACE FUNCTION public.marcar_alerta_mesa_grande_enviado(_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.reservas SET alerta_mesa_grande_enviado = true WHERE id = _id;
$function$;

-- Painel: situação de cada reserva grande futura (status + última resposta
-- do cliente no WhatsApp depois da mensagem de reconfirmação).
CREATE OR REPLACE FUNCTION public.painel_reservas_grandes(_slug text, _min_pessoas integer DEFAULT 30)
 RETURNS TABLE(id uuid, codigo_acompanhamento text, nome text, telefone text, tipo reserva_tipo, status reserva_status, data date, horario time without time zone, quantidade integer, reconfirmacao_enviada_em timestamptz, reconfirmada_em timestamptz, ultima_resposta text, situacao text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT r.id, r.codigo_acompanhamento, r.nome, r.telefone, r.tipo, r.status, r.data, r.horario,
         r.quantidade, r.reconfirmacao_enviada_em, r.reconfirmada_em, resp.texto,
         CASE
           WHEN r.status = 'cancelada' THEN 'cancelada'
           WHEN r.status = 'pendente' AND r.reconfirmacao_enviada_em IS NOT NULL THEN 'pendente: sem resposta'
           WHEN r.status = 'pendente' THEN 'pendente'
           WHEN r.reconfirmada_em IS NOT NULL THEN 'reconfirmada'
           WHEN resp.texto IS NOT NULL THEN 'confirmada: respondeu, conferir'
           WHEN r.reconfirmacao_enviada_em IS NOT NULL THEN 'confirmada: aguardando resposta'
           ELSE 'confirmada: reconfirmação não enviada'
         END
    FROM public.reservas r
    JOIN public.tenants t ON t.id = r.tenant_id
    LEFT JOIN LATERAL (
      SELECT regexp_replace(c.message->>'content', '^.*Mensagem do cliente: ', '', 's') AS texto
        FROM public.n8n_chat_histories_iracema c
       WHERE c.message->>'type' = 'human'
         AND r.reconfirmacao_chat_base IS NOT NULL
         AND c.id > r.reconfirmacao_chat_base
         AND right(regexp_replace(c.session_id, '\D', '', 'g'), 8) = right(regexp_replace(r.telefone, '\D', '', 'g'), 8)
       ORDER BY c.id DESC
       LIMIT 1
    ) resp ON true
   WHERE t.slug = lower(_slug)
     AND r.quantidade >= _min_pessoas
     AND (r.data >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
          OR (r.status = 'cancelada' AND r.data >= (now() AT TIME ZONE 'America/Sao_Paulo')::date - 30))
   ORDER BY r.data, r.horario NULLS LAST;
$function$;

-- Só o n8n (conexão direta) e o service role usam estas funções.
REVOKE ALL ON FUNCTION public.reservas_para_reconfirmacao_grande(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.marcar_reconfirmacao_enviada(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reservas_mesa_grande_a_classificar(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.marcar_alerta_mesa_grande_enviado(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.painel_reservas_grandes(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reservas_para_reconfirmacao_grande(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.marcar_reconfirmacao_enviada(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reservas_mesa_grande_a_classificar(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.marcar_alerta_mesa_grande_enviado(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.painel_reservas_grandes(text, integer) TO service_role;
