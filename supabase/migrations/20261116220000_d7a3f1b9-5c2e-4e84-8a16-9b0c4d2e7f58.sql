-- Base da Iracema: (1) links de formulário sem pontuação colada (")" e "." grudados no link quebravam o acesso
-- ao Google Forms/Linktree quando copiados) e (2) aviso ao dono para criar o cupom de 20% do aniversariante
-- da Roda da Boua (20/11) e do Pagode do Sonic (28/11). Idempotente.

UPDATE public.ia_base_conhecimento
SET conteudo = replace(replace(replace(replace(conteudo,
  E'(limite de 10 nomes; listar em https://forms.gle/H5uodKtE3ymWDj4B7)',
  E'(limite de 10 nomes). Formulário da lista amiga: https://forms.gle/H5uodKtE3ymWDj4B7'),
  E'(limite de 10 nomes; listar em https://forms.gle/EjRVn6MWrA5MoRii8)',
  E'(limite de 10 nomes). Formulário da lista amiga: https://forms.gle/EjRVn6MWrA5MoRii8'),
  E'Acessos reunidos no Linktree: https://linktr.ee/iracemabh. Perguntar antes de enviar o link.',
  E'Acessos reunidos no Linktree (perguntar antes de enviar o link): https://linktr.ee/iracemabh'),
  E'Formulário para propostas: https://forms.gle/ZWDVHa6W7NeTx5Dr8. Perguntar antes de enviar. A equipe entra em contato se a proposta estiver alinhada.',
  E'Formulário para propostas (perguntar antes de enviar; a equipe entra em contato se a proposta estiver alinhada): https://forms.gle/ZWDVHa6W7NeTx5Dr8')
WHERE tenant_slug = 'iracema';

UPDATE public.ia_base_conhecimento
SET conteudo = replace(conteudo,
  E'Essa informacao vale so para 20/11/2026.',
  E'Aniversariante que disser que fez ou vai fazer a lista amiga: se ainda não souber, pergunte o nome completo do aniversariante (uma pergunta por vez) e chame UMA vez a ferramenta "Avisar dono: cupom de aniversariante" com evento=roda_da_boua. Depois responda em 1 frase que a equipe vai providenciar o cupom de 20% no nome da pessoa e retorna por aqui. Nunca prometa prazo nem invente cupom.\nEssa informacao vale so para 20/11/2026.')
WHERE tenant_slug = 'iracema'
  AND conteudo NOT LIKE '%com evento=roda_da_boua%';

UPDATE public.ia_base_conhecimento
SET conteudo = replace(conteudo,
  E'Essa informacao vale so para 28/11/2026.',
  E'Aniversariante que disser que fez ou vai fazer a lista amiga: se ainda não souber, pergunte o nome completo do aniversariante (uma pergunta por vez) e chame UMA vez a ferramenta "Avisar dono: cupom de aniversariante" com evento=pagode_do_sonic. Depois responda em 1 frase que a equipe vai providenciar o cupom de 20% no nome da pessoa e retorna por aqui. Nunca prometa prazo nem invente cupom.\nEssa informacao vale so para 28/11/2026.')
WHERE tenant_slug = 'iracema'
  AND conteudo NOT LIKE '%com evento=pagode_do_sonic%';

-- Cupom de aniversariante agora é pedido pelo WhatsApp (antes: Instagram do evento). O dono cria e envia.
UPDATE public.ia_base_conhecimento
SET conteudo = replace(replace(replace(conteudo,
  E'(favor solicitar o cupom de desconto próprio no Instagram do evento)',
  E'(cupom próprio em nome do aniversariante: é pedido aqui pelo WhatsApp, a equipe cria e envia ao aniversariante; nunca mande a pessoa pedir no Instagram)'),
  E'que a equipe vai providenciar o cupom de 20% no nome da pessoa e retorna por aqui.',
  E'que a equipe vai criar o cupom de 20% no nome da pessoa e enviar por aqui no WhatsApp.'),
  E'e retorna por aqui. Nunca prometa prazo',
  E'e envia por aqui no WhatsApp. Nunca prometa prazo')
WHERE tenant_slug = 'iracema';
