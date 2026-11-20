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
