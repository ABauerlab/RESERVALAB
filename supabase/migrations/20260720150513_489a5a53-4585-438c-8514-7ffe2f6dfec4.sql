
CREATE TYPE public.reserva_tipo AS ENUM ('mesa', 'aniversario', 'evento', 'casamento');
CREATE TYPE public.reserva_status AS ENUM ('pendente', 'confirmada', 'cancelada', 'finalizada');
CREATE TYPE public.reserva_area AS ENUM ('interna', 'externa', 'sem_preferencia');

CREATE TABLE public.reservas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo public.reserva_tipo NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  quantidade INTEGER,
  data DATE,
  horario TIME,
  area public.reserva_area,
  leva_bolo BOOLEAN,
  comandas BOOLEAN,
  tipo_evento TEXT,
  observacoes TEXT,
  status public.reserva_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservas TO authenticated;
GRANT INSERT ON public.reservas TO anon;
GRANT ALL ON public.reservas TO service_role;

ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode criar uma reserva (fluxo público do site)
CREATE POLICY "Anyone can create reservations"
  ON public.reservas FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Apenas admins autenticados podem ver/gerir reservas
CREATE POLICY "Authenticated users can view reservations"
  ON public.reservas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update reservations"
  ON public.reservas FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete reservations"
  ON public.reservas FOR DELETE
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_reservas_updated_at
  BEFORE UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_reservas_data ON public.reservas(data);
CREATE INDEX idx_reservas_status ON public.reservas(status);
CREATE INDEX idx_reservas_created_at ON public.reservas(created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.reservas;
ALTER TABLE public.reservas REPLICA IDENTITY FULL;
