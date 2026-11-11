-- Base de conhecimento da Iracema (WhatsApp): horário do almoço e condição de aniversariante do Sonic.
-- Idempotente: só altera se o trecho ainda não existe. Já aplicada em produção em 11/11/2026.
UPDATE public.ia_base_conhecimento
SET conteudo = replace(
      conteudo,
      E'Domingo: 12h às 17h\n\nOs horários estão',
      E'Domingo: 12h às 17h\nAlmoço de sábado e domingo: 12h às 15h (depois disso segue o funcionamento normal da casa até o fechamento).\n\nOs horários estão')
WHERE tenant_slug = 'iracema'
  AND conteudo NOT LIKE '%Almoço de sábado e domingo: 12h às 15h%';

UPDATE public.ia_base_conhecimento
SET conteudo = replace(
      conteudo,
      E'Início às 16h. Não invente preço ou line-up. Depois dessa data, remova este bloco.',
      E'Início às 16h. Não invente preço ou line-up.\nCondição especial de aniversariante para o Pagode do Sonic:\n➡️ Aniversariante off\n➡️ +10 nomes na lista amiga, off até as 17:30h (limite de 10 nomes; listar em https://forms.gle/EjRVn6MWrA5MoRii8)\n➡️ + 2 Xeque-Mates para o aniversariante\n➡️ + Desconto de 20% na compra de ingresso para os demais convidados (favor solicitar o cupom de desconto próprio no Instagram do evento)\nEssa informacao vale so para 28/11/2026. Depois dessa data, remova este bloco.')
WHERE tenant_slug = 'iracema'
  AND conteudo NOT LIKE '%Condição especial de aniversariante para o Pagode do Sonic%';

UPDATE public.ia_base_conhecimento
SET conteudo = replace(
      conteudo,
      E'+ Desconto de 20% na compra de ingresso para os demais convidados\nEssa informacao vale so para 20/11/2026.',
      E'+ Desconto de 20% na compra de ingresso para os demais convidados (favor solicitar o cupom de desconto próprio no Instagram do evento)\nEssa informacao vale so para 20/11/2026.')
WHERE tenant_slug = 'iracema';
