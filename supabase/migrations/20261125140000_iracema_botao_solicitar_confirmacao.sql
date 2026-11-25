-- Etapa 3: botão "Solicitar confirmação" no Teggly.
--
-- Fila de pedidos manuais da equipe para mandar uma mensagem de confirmação
-- pelo WhatsApp a uma reserva pendente. O clique no botão só registra o
-- pedido aqui; quem efetivamente manda a mensagem é o workflow n8n
-- "Iracema - Solicitar confirmacao manual (WhatsApp)", que lê esta fila,
-- envia e marca como enviado. Nunca muda o status da reserva.
--
-- Bloqueado para reservas que já não estão pendentes e para reservas
-- marcadas como "Evento - A negociar" (confirmacao_manual_necessaria) -
-- essas dependem de negociação com a equipe, não de confirmação simples do
-- cliente.

CREATE TABLE IF NOT EXISTS public.solicitacoes_confirmacao_manual (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reserva_id uuid NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  solicitado_por uuid REFERENCES auth.users(id),
  solicitado_em timestamptz NOT NULL DEFAULT now(),
  processando_em timestamptz,
  enviado boolean NOT NULL DEFAULT false,
  enviado_em timestamptz,
  erro text
);
COMMENT ON TABLE public.solicitacoes_confirmacao_manual IS
  'Pedido manual da equipe (botao "Solicitar confirmacao" no Teggly) para mandar uma mensagem de confirmacao pelo WhatsApp a uma reserva pendente. So dispara a mensagem, nunca muda o status da reserva.';

CREATE INDEX IF NOT EXISTS solicitacoes_confirmacao_manual_pendentes_idx
  ON public.solicitacoes_confirmacao_manual (tenant_id, solicitado_em) WHERE NOT enviado;

ALTER TABLE public.solicitacoes_confirmacao_manual ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admin reads own solicitacoes_confirmacao_manual" ON public.solicitacoes_confirmacao_manual
  FOR SELECT USING (has_role(auth.uid(), 'super_admin') OR has_tenant_role(auth.uid(), tenant_id));

CREATE OR REPLACE FUNCTION public.solicitar_confirmacao_manual(_reserva_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r public.reservas;
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

  INSERT INTO public.solicitacoes_confirmacao_manual (tenant_id, reserva_id, solicitado_por)
  VALUES (r.tenant_id, r.id, auth.uid());

  RETURN jsonb_build_object('ok', true);
END;
$function$;
