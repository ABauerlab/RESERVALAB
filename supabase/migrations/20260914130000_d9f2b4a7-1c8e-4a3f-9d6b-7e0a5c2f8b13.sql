-- Reconfirmação de reserva: campo de mensagem customizável por empresa
-- (mesmo padrão de mensagem_confirmacao/mensagem_cancelamento) e o registro
-- de quando a reconfirmação foi enviada a cada reserva.

ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS reconfirmada_em timestamptz;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS mensagem_reconfirmacao text;
