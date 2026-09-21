-- Observação sobre áreas de reserva, configurável por empresa. Aparece na
-- tela pública de reserva de mesa, junto ao campo "Área desejada", avisando
-- o cliente que a área escolhida não é garantida.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS observacao_area text;
