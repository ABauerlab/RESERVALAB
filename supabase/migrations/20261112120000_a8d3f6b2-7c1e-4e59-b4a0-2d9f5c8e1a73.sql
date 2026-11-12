-- Base da Iracema: dias de evento só com ingresso (20/11 e 28/11) NÃO têm mesa garantida, reservada
-- nem separada. Corrige uma resposta em que a Dona Iracema disse a uma cliente que ela tinha mesa
-- garantida no evento de 20/11. Idempotente.

-- Regra geral (seção 5): vale para qualquer bloco da seção 23 marcado "SEM RESERVAS".
UPDATE public.ia_base_conhecimento
SET conteudo = replace(
      conteudo,
      E'Nunca afirmar disponibilidade sem confirmação oficial.',
      E'Em dia de evento SOMENTE com ingresso (blocos da seção 23 marcados "SEM RESERVAS"), não existe reserva de mesa por causa da lotação: NUNCA diga ou sugira que a pessoa tem mesa garantida, reservada, separada ou "sua mesa". O ingresso dá entrada no evento, não mesa. Se alguém disser que tem mesa nesses dias, não confirme: explique com gentileza que nesses dias não há reserva de mesas por causa da lotação e que vai encaminhar para a equipe conferir.\nNunca afirmar disponibilidade sem confirmação oficial.')
WHERE tenant_slug = 'iracema'
  AND conteudo NOT LIKE '%NUNCA diga ou sugira que a pessoa tem mesa garantida%';

-- Roda da Boua (20/11).
UPDATE public.ia_base_conhecimento
SET conteudo = replace(
      conteudo,
      E'Início às 14h. Não invente preço, atração ou line-up.',
      E'Início às 14h. Não invente preço, atração ou line-up.\nNão há mesa garantida, reservada ou separada neste dia, nem para quem comprou ingresso: o evento tem lotação e não aceita reserva de mesas. Nunca diga que a pessoa "tem mesa". Se ela afirmar que tem mesa ou reserva para 20/11, não confirme: diga que nesse dia não há reserva de mesas por causa da lotação e que vai encaminhar para a equipe conferir.')
WHERE tenant_slug = 'iracema'
  AND conteudo NOT LIKE '%para 20/11, não confirme%';

-- Pagode do Sonic (28/11).
UPDATE public.ia_base_conhecimento
SET conteudo = replace(
      conteudo,
      E'Início às 16h. Não invente preço ou line-up.\n',
      E'Início às 16h. Não invente preço ou line-up.\nNão há mesa garantida, reservada ou separada neste dia, nem para quem comprou ingresso: o evento tem lotação e não aceita reserva de mesas. Nunca diga que a pessoa "tem mesa". Se ela afirmar que tem mesa ou reserva para 28/11, não confirme: diga que nesse dia não há reserva de mesas por causa da lotação e que vai encaminhar para a equipe conferir.\n')
WHERE tenant_slug = 'iracema'
  AND conteudo NOT LIKE '%para 28/11, não confirme%';
