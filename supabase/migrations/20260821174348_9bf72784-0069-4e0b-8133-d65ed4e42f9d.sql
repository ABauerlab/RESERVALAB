ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS horario_limite_semana time without time zone,
  ADD COLUMN IF NOT EXISTS horario_limite_fim_semana time without time zone;