
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_new_reserva()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  base_url text := 'https://reservatestelab.lovable.app';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbWhmYW16cnpwa2dtdm5lcGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTY0NDEsImV4cCI6MjEwMDEzMjQ0MX0.XoK095gQBJhEkJZ7-XT3jDBshJNPbfO5XQQWr7u2A2M';
  tenant_slug text;
  msg_body text;
BEGIN
  SELECT slug INTO tenant_slug FROM public.tenants WHERE id = NEW.tenant_id;

  msg_body := coalesce(NEW.nome, 'Cliente') || ' — ' ||
              coalesce(NEW.quantidade::text, '?') || ' pessoas em ' ||
              to_char(NEW.data, 'DD/MM') || ' ' || to_char(NEW.horario, 'HH24:MI');

  PERFORM net.http_post(
    url := base_url || '/api/public/hooks/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', anon_key
    ),
    body := jsonb_build_object(
      'tenant_id', NEW.tenant_id,
      'title', 'Nova reserva',
      'body', msg_body,
      'url', '/' || coalesce(tenant_slug, '') || '/admin',
      'tag', 'reserva-' || NEW.id::text
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_reserva ON public.reservas;
CREATE TRIGGER trg_notify_new_reserva
AFTER INSERT ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.notify_new_reserva();
