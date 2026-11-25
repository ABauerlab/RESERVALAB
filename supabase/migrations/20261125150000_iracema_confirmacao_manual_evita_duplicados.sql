-- Evita que cliques repetidos no botão "Solicitar confirmação" do Teggly
-- criem pedidos duplicados (e, por consequência, mensagens duplicadas ao
-- cliente) para a mesma reserva enquanto o pedido anterior ainda não foi
-- enviado.

CREATE UNIQUE INDEX IF NOT EXISTS solicitacoes_confirmacao_manual_uma_pendente_idx
  ON public.solicitacoes_confirmacao_manual (reserva_id) WHERE NOT enviado;

CREATE OR REPLACE FUNCTION public.solicitar_confirmacao_manual(_reserva_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r public.reservas;
  ja_pendente boolean;
BEGIN
  SELECT * INTO r FROM public.reservas WHERE id = _reserva_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'RESERVA_NAO_ENCONTRADA');
  END IF;
  IF NOT (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), r.tenant_id)) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'SEM_PERMISSAO');
  END IF;
  IF r.status <> 'pendente' THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'RESERVA_NAO_PENDENTE', 'status', r.status::text);
  END IF;
  IF r.confirmacao_manual_necessaria THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'EVENTO_EM_NEGOCIACAO');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.solicitacoes_confirmacao_manual WHERE reserva_id = r.id AND NOT enviado
  ) INTO ja_pendente;

  IF ja_pendente THEN
    RETURN jsonb_build_object('ok', true, 'ja_pendente', true);
  END IF;

  INSERT INTO public.solicitacoes_confirmacao_manual (tenant_id, reserva_id, solicitado_por)
  VALUES (r.tenant_id, r.id, auth.uid());

  RETURN jsonb_build_object('ok', true);
END;
$function$;
