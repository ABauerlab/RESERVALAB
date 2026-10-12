-- PROPOSTA. NAO APLICAR em producao sem: (1) reconciliar com docs/database/LIVE_STATE.md,
-- (2) backup (pg_dump das tabelas tenant_planos e reservas), (3) rodar antes em branch/dev.
-- Fica fora de supabase/migrations de proposito, para a sincronizacao do Lovable nao aplicar sozinha.

-- 1. Pedidos (um por tentativa de contratacao)
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plano text NOT NULL CHECK (plano IN ('essencial', 'pro')),
  ciclo text NOT NULL CHECK (ciclo IN ('mensal', 'anual')),
  valor_centavos integer NOT NULL CHECK (valor_centavos > 0),
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aprovado', 'recusado', 'cancelado', 'estornado')),
  ultimo_evento_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Eventos do provedor: idempotencia pela chave unica (provedor, evento_id)
CREATE TABLE IF NOT EXISTS public.pagamento_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provedor text NOT NULL,
  evento_id text NOT NULL,
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
  resultado text NOT NULL, -- aplicado | ignorado:* | rejeitado:*
  recebido_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provedor, evento_id)
  -- Sem payload bruto nem dados de cartao: so o que e preciso para auditar.
);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamento_eventos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pedidos, public.pagamento_eventos FROM anon, authenticated;
-- A empresa le apenas os proprios pedidos; escrita so por service_role (webhook no servidor).
GRANT SELECT ON public.pedidos TO authenticated;
CREATE POLICY "Empresa le os proprios pedidos" ON public.pedidos
  FOR SELECT TO authenticated USING (public.has_tenant_role(auth.uid(), tenant_id));
CREATE POLICY "Super admin le pedidos" ON public.pedidos
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 3. Direito por plano, para o servidor decidir (n8n, gatilhos e RPCs chamam isto)
CREATE OR REPLACE FUNCTION public.tenant_tem_recurso(_tenant uuid, _recurso text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE COALESCE((SELECT plano FROM public.tenant_planos
                         WHERE tenant_id = _tenant
                           AND (vigente_ate IS NULL OR vigente_ate >= current_date)), 'pro')
    WHEN 'gratuito' THEN _recurso IN ('reserva_publica', 'cardapio', 'link_hub', 'marca_opt_in')
    WHEN 'essencial' THEN _recurso IN ('reserva_publica', 'cardapio', 'link_hub', 'marca_opt_in',
      'whatsapp_confirmacao', 'reconfirmacao', 'relatorios_periodo')
    ELSE true
  END;
$$;
REVOKE ALL ON FUNCTION public.tenant_tem_recurso(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tenant_tem_recurso(uuid, text) TO authenticated, service_role;
-- Manter igual a src/lib/plans.ts (existe teste no repositorio que compara a matriz).
-- Empresa sem registro vale como Pro de lancamento, como no front.

-- 4. Proximos passos (nao incluidos aqui, dependem de reconciliar a producao):
--    a) chamar tenant_tem_recurso('whatsapp_confirmacao') em notificar_confirmacao_cliente e nos
--       RPCs de aviso 7d/2d/lembrete (hoje o n8n envia para qualquer empresa);
--    b) cota de reservas por mes em criar_reserva (Gratuito 40, com tolerancia de 7 dias).

-- ROLLBACK
--   DROP FUNCTION IF EXISTS public.tenant_tem_recurso(uuid, text);
--   DROP TABLE IF EXISTS public.pagamento_eventos;
--   DROP TABLE IF EXISTS public.pedidos;
