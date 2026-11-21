-- Base da Iracema: em 20/11 (Roda da Boua) e 28/11 (Pagode do Sonic) a casa abre SOMENTE para o
-- evento. Não há almoço, nem mesa, nem atendimento comum nessas datas. A IA chegou a dizer que
-- dava para almoçar em 20/11. Idempotente.

-- Regra geral (seção 5): casa aberta só para evento = sem almoço.
UPDATE public.ia_base_conhecimento
SET conteudo = replace(
      conteudo,
      E'Nunca afirmar disponibilidade sem confirmação oficial.',
      E'Em dia em que a casa abre SOMENTE para um evento (20/11/2026 e 28/11/2026, seção 23), NÃO há almoço, nem funcionamento comum, nem mesa para sentar: o horário normal de almoço e de funcionamento NÃO vale nessas datas. Nunca diga ou sugira que dá para almoçar, jantar ou ir comer nesses dias; quem perguntar deve ser informado com gentileza de que a casa abre só para o evento. Em dúvida sobre uma data com evento, não confirme almoço.\nNunca afirmar disponibilidade sem confirmação oficial.')
WHERE tenant_slug = 'iracema'
  AND conteudo LIKE E'%Nunca afirmar disponibilidade sem confirmação oficial.%'
  AND conteudo NOT LIKE '%a casa abre SOMENTE para um evento (20/11/2026 e 28/11/2026%';

-- Roda da Boua (20/11).
UPDATE public.ia_base_conhecimento
SET conteudo = replace(
      conteudo,
      E'Início às 14h. Não invente preço, atração ou line-up.',
      E'Início às 14h. Não invente preço, atração ou line-up.\nNeste dia a casa abre SOMENTE para o evento: NÃO há almoço nem funcionamento comum, apesar de ser sexta-feira. Se perguntarem sobre almoçar em 20/11, responda com gentileza que nesse dia não há almoço e que a casa abre só para o evento.')
WHERE tenant_slug = 'iracema'
  AND conteudo LIKE E'%Início às 14h. Não invente preço, atração ou line-up.%'
  AND conteudo NOT LIKE '%Se perguntarem sobre almoçar em 20/11%';

-- Pagode do Sonic (28/11).
UPDATE public.ia_base_conhecimento
SET conteudo = replace(
      conteudo,
      E'Início às 16h. Não invente preço ou line-up.\n',
      E'Início às 16h. Não invente preço ou line-up.\nNeste dia a casa abre SOMENTE para o evento: NÃO há almoço nem funcionamento comum, apesar de ser sábado. Se perguntarem sobre almoçar em 28/11, responda com gentileza que nesse dia não há almoço e que a casa abre só para o evento.\n')
WHERE tenant_slug = 'iracema'
  AND conteudo LIKE E'%Início às 16h. Não invente preço ou line-up.\n%'
  AND conteudo NOT LIKE '%Se perguntarem sobre almoçar em 28/11%';

-- 21/11/2026: domínio oficial volta a ser https://teggly.com.br (era teggly.bauerlab.com.br).
ALTER TABLE public.ia_agente_config ALTER COLUMN dominio_publico SET DEFAULT 'https://teggly.com.br';
UPDATE public.ia_agente_config SET dominio_publico = 'https://teggly.com.br'
WHERE dominio_publico LIKE '%teggly.bauerlab.com.br%';
UPDATE public.ia_base_conhecimento
SET conteudo = replace(conteudo, 'https://teggly.bauerlab.com.br', 'https://teggly.com.br')
WHERE conteudo LIKE '%teggly.bauerlab.com.br%';

CREATE OR REPLACE FUNCTION public.ia_dominio_publico(_slug text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(
    (SELECT regexp_replace(c.dominio_publico, '/+$', '') FROM public.ia_agente_config c WHERE c.tenant_slug = lower(_slug)),
    'https://teggly.com.br')
$$;

-- Bloco ao vivo da base: data de HOJE e de AMANHÃ (Brasília) e feriados pela data de Brasília
-- (antes usava current_date em UTC). A IA nunca deve chamar de "amanhã" uma reserva de hoje.
CREATE OR REPLACE FUNCTION public.ia_contexto_ao_vivo(_slug text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE t public.tenants; txt text; fer text;
        hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  SELECT * INTO t FROM public.tenants WHERE slug = lower(_slug) AND ativo = true;
  IF NOT FOUND THEN RETURN ''; END IF;

  txt := E'\n---\n\n# DADOS AO VIVO DO TEGGLY (cadastro atual da casa no sistema; PREVALECEM sobre qualquer horário ou regra citada em outro trecho desta base)\n'
      || 'HOJE é ' || to_char(hoje, 'DD/MM/YYYY') || ' e AMANHÃ é ' || to_char(hoje + 1, 'DD/MM/YYYY')
      || E' (horário de Brasília). Reserva com data igual a hoje é "hoje", nunca "amanhã".\n'
      || E'Último horário aceito para reservas de mesa e aniversário (grupos até 30 pessoas):\n'
      || '- Segunda a sexta: ' || COALESCE(public.ia_fmt_hora(t.horario_limite_semana), 'sem limite cadastrado') || E'\n'
      || '- Sábado: ' || COALESCE(public.ia_fmt_hora(COALESCE(t.horario_limite_sabado, t.horario_limite_fim_semana)), 'sem limite cadastrado') || E'\n'
      || '- Domingo e feriados: ' || COALESCE(public.ia_fmt_hora(t.horario_limite_fim_semana), 'sem limite cadastrado') || E'\n'
      || E'Ao responder sobre horário-limite de reserva, use SOMENTE estes valores. Grupos maiores e eventos são tratados pela equipe.\n';

  SELECT string_agg('- ' || to_char(f.data, 'DD/MM/YYYY') || COALESCE(' (' || f.motivo || ')', ''), E'\n' ORDER BY f.data)
    INTO fer
    FROM public.feriados_do_tenant(t.slug) f
   WHERE f.data BETWEEN hoje AND hoje + 60;
  IF fer IS NOT NULL THEN
    txt := txt || E'Feriados cadastrados nos próximos 60 dias (usam o limite de domingo):\n' || fer || E'\n';
  END IF;
  RETURN txt;
END $$;
REVOKE ALL ON FUNCTION public.ia_contexto_ao_vivo(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ia_contexto_ao_vivo(text) TO service_role;
