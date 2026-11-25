-- Etapa 4: detalha o bloco de 23/12/2026 na base de conhecimento (horário
-- completo 11h-18h, prato do dia e link do cardápio), conforme pedido.
UPDATE public.ia_base_conhecimento
SET conteudo = replace(
  conteudo,
  'Nesse dia o Iracema funciona até as 18h (em vez do horário normal de quarta-feira, 11h às 15h). É o último dia',
  'Nesse dia o Iracema funciona das 11h às 18h (em vez do horário normal de quarta-feira, 11h às 15h). Prato do dia: filé de tilápia, arroz branco, brócolis na manteiga e purê de batatas (mesmo prato de quarta-feira comum, sem mudança). Cardápio completo: https://teggly.com.br/iracema/cardapio (perguntar antes de enviar o link). É o último dia'
)
WHERE tenant_slug = 'iracema';
