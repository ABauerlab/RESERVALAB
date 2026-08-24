-- Motivo de cancelamento por reserva, e mensagem de cancelamento
-- personalizável por empresa (mesmo padrão de mensagem_confirmacao).

ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS motivo_cancelamento text;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS mensagem_cancelamento text;
