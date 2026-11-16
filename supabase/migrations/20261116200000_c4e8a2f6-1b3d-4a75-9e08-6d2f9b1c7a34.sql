-- Troca do domínio público teggly.com.br por teggly.bauerlab.com.br na base de conhecimento da Iracema (WhatsApp/Instagram).
-- Idempotente: 'teggly.com.br' não é trecho de 'teggly.bauerlab.com.br', então reexecutar não altera mais nada.
-- Só links (https://teggly.com.br e teggly.com.br/caminho); o e-mail contato@teggly.com.br não é tocado.
UPDATE public.ia_base_conhecimento
SET conteudo = replace(replace(conteudo, 'https://teggly.com.br', 'https://teggly.bauerlab.com.br'), 'teggly.com.br/', 'teggly.bauerlab.com.br/')
WHERE tenant_slug = 'iracema'
  AND (conteudo LIKE '%https://teggly.com.br%' OR conteudo LIKE '%teggly.com.br/%');
