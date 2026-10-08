-- F16: descricoes curtas para os itens do Iracema que estavam sem texto, usando so informacao ja existente
-- no proprio cardapio (nada de ingrediente novo). "catupiry" -> "Catupiry" (marca).
update public.cardapio_itens i set descricao = v.d, updated_at = now()
from (values
 ('4d4e4894-fb2d-4427-9119-9f110844a582'::uuid,'Porção de pãozinho, para acompanhar.'),
 ('f4e44752-0546-48ad-87dd-a7083cfc9190','Porção extra de molho para acompanhar o seu prato.'),
 ('8a5e4252-0f9b-4abb-8d5a-5dad99a2833f','Sorvete de creme, para fechar a refeição com doçura.'),
 ('28b6d603-e61e-4adc-a05b-c472e6fd5fd5','Brownie para adoçar o fim da refeição. Também disponível com sorvete de creme e geleia de morango da casa.'),
 ('46e2012f-962e-4245-ba13-1deec5918289','Água com gás.'),
 ('cee4e929-4891-4ca2-a45f-f11b8b8724b1','Energético Red Bull, sabor Tropical.'),
 ('1a2ad1ea-6675-46c7-9eef-f3928e9e11b0','Cerveja Amstel, 600 ml.'),
 ('82332168-8cbb-4ea7-b484-597ad84c55e0','Cerveja Eisenbahn Pilsen, 600 ml.'),
 ('71a55c96-c6b3-46e6-88d9-cf6663059b9e','Cerveja Heineken, 600 ml.'),
 ('3eef6d90-9d7c-456d-aa47-c1f6c9332fab','Dose individual de cachaça.'),
 ('b030372b-242f-45ee-9efb-bf09e6179b33','Dose individual de Campari.'),
 ('9bd2b213-e7bb-4c6f-b1ef-d65aededa91e','Dose individual de tequila ouro.'),
 ('0fc68545-9c65-4e3e-a6ec-7f7e80f65189','Dose individual de vodca Absolut.'),
 ('ca6b849c-9e73-4c0d-8b04-49fee2dbbd2f','Dose individual de uísque Jack Daniel''s.'),
 ('55319418-cccc-446b-9115-bfa05a9b382a','Dose individual de Licor 43.'),
 ('e936da5a-7dd6-4dd3-a074-f8ca174f4320','Cubos de lombo suíno (300 g) salteados em refogado bem temperado e finalizados com Catupiry. Acompanha pãozinho francês à parte.')
) as v(id,d) where i.id = v.id;
update public.cardapio_itens set nome='Lombo cremoso com Catupiry', updated_at=now() where id='e936da5a-7dd6-4dd3-a074-f8ca174f4320';
