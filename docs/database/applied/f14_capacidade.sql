-- F14: capacidade da casa (opcional, por empresa). Aditivo e reversivel. Ja aplicado em producao
-- (wkvyhpfuezzinlaxsaap) em tres migrations: f14a (colunas), f14b (criar_reserva e
-- update_reserva_by_codigo) e f14c (capacidade_do_dia). Nao reaplicar.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS capacidade_pessoas_dia integer,
  ADD COLUMN IF NOT EXISTS capacidade_pessoas_horario integer;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_capacidade_dia_pos CHECK (capacidade_pessoas_dia IS NULL OR capacidade_pessoas_dia BETWEEN 1 AND 100000),
  ADD CONSTRAINT tenants_capacidade_horario_pos CHECK (capacidade_pessoas_horario IS NULL OR capacidade_pessoas_horario BETWEEN 1 AND 100000);

-- criar_reserva (reserva publica): depois das regras que ja existiam e antes do INSERT, soma as pessoas
-- das reservas nao canceladas do dia e do mesmo horario. Se a nova reserva passar do limite:
--   RAISE EXCEPTION 'Capacidade do dia esgotada'   / 'Capacidade do horario esgotada'
-- update_reserva_by_codigo (cliente altera pelo codigo): mesma regra, sem contar a propria reserva.
-- Reservas criadas pelo painel (admin) nao passam por aqui e nunca sao bloqueadas.
-- Sem limite configurado (NULL), o comportamento e exatamente o de antes.
-- Definicoes completas: docs/database/live-functions.sql (versao anterior) + o bloco acima.

-- Leitura publica do que ainda cabe (so numeros agregados; NULL quando a casa nao define limites):
--   capacidade_do_dia(_slug text, _data date) -> {dia_restante, horario_maximo, por_horario{"HH:MM": restante}}

-- Rollback:
--   DROP FUNCTION public.capacidade_do_dia(text, date);
--   recriar criar_reserva e update_reserva_by_codigo sem os blocos "Capacidade" (live-functions.sql);
--   ALTER TABLE public.tenants DROP COLUMN capacidade_pessoas_dia, DROP COLUMN capacidade_pessoas_horario;
