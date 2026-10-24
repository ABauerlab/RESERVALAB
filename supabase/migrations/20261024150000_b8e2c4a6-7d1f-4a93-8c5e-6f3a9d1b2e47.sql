-- Destacar atração no site: uma atração CONFIRMADA marcada como destaque vira (e se mantém
-- sincronizada com) um registro de eventos_destaque, que já alimenta a página de reservas.
-- O mesmo registro alimenta a base de conhecimento do WhatsApp (Dona Iracema), então o que
-- está no site é exatamente o que ela sabe. Sem job: o gatilho cuida de criar, atualizar e remover.

ALTER TABLE public.atracoes
  ADD COLUMN destaque boolean NOT NULL DEFAULT false,
  ADD COLUMN descricao_publica text,
  ADD COLUMN imagem_url text,
  ADD COLUMN imagem_largura integer,
  ADD COLUMN imagem_altura integer;

ALTER TABLE public.eventos_destaque
  ADD COLUMN atracao_id uuid UNIQUE REFERENCES public.atracoes(id) ON DELETE CASCADE;

-- Só atração confirmada pode estar em destaque (cancelar ou voltar para negociação tira do site).
-- Reaproveita a função e o gatilho de UPDATE existentes (sem DROP) e adiciona o de INSERT.
CREATE OR REPLACE FUNCTION public.atracoes_before_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status <> 'confirmada' THEN
    NEW.destaque := false;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
    NEW.atualizado_por := auth.uid();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER atracoes_before_insert
  BEFORE INSERT ON public.atracoes
  FOR EACH ROW EXECUTE FUNCTION public.atracoes_before_update();

-- Projeta a atração em destaque para eventos_destaque.
CREATE OR REPLACE FUNCTION public.atracoes_sync_destaque()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.destaque THEN
    INSERT INTO public.eventos_destaque
      (tenant_id, atracao_id, titulo, descricao, data, horario, imagem_url, imagem_largura, imagem_altura)
    VALUES
      (NEW.tenant_id, NEW.id, NEW.titulo, NEW.descricao_publica, NEW.data, NEW.horario_inicio,
       NEW.imagem_url, NEW.imagem_largura, NEW.imagem_altura)
    ON CONFLICT (atracao_id) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      descricao = EXCLUDED.descricao,
      data = EXCLUDED.data,
      horario = EXCLUDED.horario,
      imagem_url = EXCLUDED.imagem_url,
      imagem_largura = EXCLUDED.imagem_largura,
      imagem_altura = EXCLUDED.imagem_altura;
  ELSE
    DELETE FROM public.eventos_destaque WHERE atracao_id = NEW.id;
  END IF;
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.atracoes_sync_destaque() FROM PUBLIC, anon, authenticated;

-- Excluir a atração remove o destaque pelo ON DELETE CASCADE; aqui só insert e update.
CREATE TRIGGER atracoes_sync_destaque
  AFTER INSERT OR UPDATE ON public.atracoes
  FOR EACH ROW EXECUTE FUNCTION public.atracoes_sync_destaque();

-- Próximos eventos em destaque para o WhatsApp (n8n lê via conexão direta ao banco).
-- Inclui os cadastrados à mão em Eventos e os vindos de atrações, com horário de término
-- e tipo quando existirem. Mesmo fuso e mesmo filtro da página pública. Só devolve o que a
-- página pública já mostra, então mantém o acesso padrão como as outras funções *_do_tenant.
CREATE OR REPLACE FUNCTION public.eventos_em_destaque_do_tenant(_slug text)
 RETURNS TABLE(titulo text, descricao text, data date, horario time without time zone,
               horario_fim time without time zone, tipo text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT e.titulo, e.descricao, e.data, e.horario, a.horario_fim, a.tipo
    FROM public.eventos_destaque e
    JOIN public.tenants t ON t.id = e.tenant_id
    LEFT JOIN public.atracoes a ON a.id = e.atracao_id
   WHERE t.slug = lower(_slug) AND t.ativo = true
     AND e.data >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
   ORDER BY e.data ASC, e.horario ASC NULLS LAST
   LIMIT 10;
$function$;
