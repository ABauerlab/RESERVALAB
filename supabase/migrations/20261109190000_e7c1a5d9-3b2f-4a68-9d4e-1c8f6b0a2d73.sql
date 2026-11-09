-- Base de conhecimento unica da Dona Iracema (WhatsApp e Instagram leem daqui).
CREATE TABLE IF NOT EXISTS public.ia_base_conhecimento (
  tenant_slug text PRIMARY KEY,
  conteudo text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ia_base_conhecimento ENABLE ROW LEVEL SECURITY;
-- sem policies: acesso apenas por service role / conexao direta do n8n

CREATE OR REPLACE FUNCTION public.base_conhecimento_do_tenant(_slug text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT conteudo FROM public.ia_base_conhecimento WHERE tenant_slug = _slug
$$;
REVOKE ALL ON FUNCTION public.base_conhecimento_do_tenant(text) FROM PUBLIC, anon, authenticated;

INSERT INTO public.ia_base_conhecimento (tenant_slug, conteudo)
VALUES ('iracema', $kb$# DONA IRACEMA — BASE DE CONHECIMENTO
## Iracema Bistrô Bar

---

# 1. IDENTIDADE DO IRACEMA

## Nome
IRACEMA BISTRÔ BAR

## Descrição curta
Restaurante, bar e espaço para eventos em um casarão dos anos 50, no coração de Santa Tereza.

## Conceito
COMIDA, ENCONTROS E HISTÓRIA NO SANTA TEREZA.

---

# 2. DADOS PERMANENTES DA CASA

## Endereço
Rua Almandina, 56
Santa Tereza
Belo Horizonte - MG
CEP 31010-080

## Horário oficial (fuso: São Paulo)
Segunda-feira: 11h às 15h
Terça-feira: 11h às 15h
Quarta-feira: 11h às 15h
Quinta-feira: 11h às 15h
Sexta-feira: 11h às 15h
Sábado: 12h às 19h (com música ao vivo a partir das 13h30)
Domingo: 12h às 17h

Os horários estão sujeitos a alteração conforme eventos/feriados. Veja a seção 23 (EVENTOS E HORÁRIOS ESPECIAIS CADASTRADOS) antes de responder sobre um feriado especifico. Nunca substituir por informação antiga.

---

# 3. PRATOS DA SEMANA (use exatamente o prato listado para o dia da semana atual - nunca invente outro)

Segunda-feira: Parmegiana de frango, arroz branco e batata chips.
Terça-feira: Costelinha ao molho barbecue, batatas rústicas e arroz branco.
Quarta-feira: Filé de tilápia, arroz branco, brócolis na manteiga e purê de batatas.
Quinta-feira: Sobrecoxa desossada, tutu de feijão, maionese de batata e arroz branco.
Sexta-feira: Feijoada, arroz branco, farofa, couve com alho, vinagrete e laranja.
Sábado: Filé de tilápia, arroz branco, brócolis na manteiga e purê de batatas.
Domingo: Rabada, batata cozida, agrião, salada e arroz. Preço: R$ 37,90.

Também divulgados como pratos fixos: PF Iracema, salada Caesar, talharim na manteiga, e outras opções do cardápio.

Nao inventar outro prato, nao acrescentar acompanhamentos não informados, não inventar preço. Em feriados com horario especial (secao 23), nao presumir qual prato sera servido a menos que esteja explicitamente informado - se perguntarem, diga que precisa confirmar.

---

# 4. CARDÁPIO OFICIAL
https://teggly.com.br/iracema/cardapio
Usar como referência para pratos, preços, ingredientes, opções vegetarianas/veganas e demais itens. Se não estiver aqui, não inventar. Antes de enviar o link, perguntar se a pessoa quer recebê-lo.

---

# 5. RESERVAS
Link oficial: https://teggly.com.br/iracema
Recebe reservas para: almoço, encontros, comemorações, aniversários, eventos particulares, casamentos intimistas, confraternizações, eventos corporativos, festas, gravações.
Aos sábados as reservas são aceitas até as 17h30 (último horário de reserva), com a casa funcionando até as 19h. Os horários disponíveis de cada data aparecem no link de reserva: não cite horário-limite de outros dias nem prometa um horário específico; diga que a pessoa escolhe no link e que a confirmação final é do sistema.
Nunca afirmar disponibilidade sem confirmação oficial. Nunca confirmar reserva só porque a pessoa informou data/horário.

---

# 6. ESPAÇOS PARA RESERVA
A casa possui: Salão, Fundos, Corredor, Varanda. A pessoa pode indicar preferência no sistema de reserva, mas a preferência não é garantia. Nunca prometer uma área específica.

---

# 7. GRUPOS A PARTIR DE 15 PESSOAS
O Iracema oferece comanda individual, inclusive para grupos grandes. Não confundir grupo grande com evento particular - entender a necessidade antes de orientar.

---

# 8. ANIVERSÁRIOS
Benefício: a pessoa aniversariante da semana ganha 1 drink OU 1 sobremesa. Além disso, 10% do valor gasto na própria comanda vira cashback para uma próxima visita. A partir de 15 convidados, comandas individuais. Pode levar bolo - a casa guarda e disponibiliza pratos e talheres.

---

# 9. EVENTOS PARTICULARES
Recebe: aniversários, confraternizações, eventos corporativos, casamentos intimistas, festas, gravações e outros eventos particulares.
Capacidade: mínimo 50, máximo 180 pessoas. Duração: 5 horas.
Petiscos: carne de panela com pãozinho, bolinho de linguiça, chips de jiló, coxinha de moranga com rabada, batata frita, harumaki de carne de panela.
Bebidas: água mineral, água gasosa, Eisenbahn, Guaraná, Coca-Cola normal, Coca-Cola Zero.
Pacotes: R$ 110/pessoa (menu sem bebidas); R$ 160/pessoa (menu + bebidas + Eisenbahn); R$ 180/pessoa (bebidas + Heineken); R$ 200/pessoa (bebidas + Heineken + drinks).
Couvert artístico de banda: R$ 10/pessoa quando aplicável.
Pagamento: 50% na reserva, 50% no dia do evento.
Grandes eventos (evento grande, fechamento da casa, confraternização de empresa, casamento, festa, evento personalizado): contato Simone +55 31 98801-0243. Não enviar esse contato para uma reserva comum.

---

# 10. PETS
Pet friendly. Cachorros bem-vindos na varanda ou no final do corredor. A varanda depende das condições do dia - nunca garantir.

---

# 11. CRIANÇAS
Espaço para crianças fica na varanda.

---

# 12. ACESSIBILIDADE
A casa é acessível.

---

# 13. MESAS EXTERNAS
Existem mesas externas. A pessoa pode pedir preferência na reserva, mas não é garantia.

---

# 14. WI-FI
O Iracema possui Wi-Fi.

---

# 15. ESTACIONAMENTO
Não possui estacionamento próprio. Existem vagas na rua em frente. Nunca garantir vaga disponível.

---

# 16. PAGAMENTOS
Formas confirmadas: VR, cartão de débito, cartão de crédito. Comanda individual. Não inventar outras formas.

---

# 17. COUVERT
R$ 10,00, opcional. Nunca dizer que é obrigatório.

---

# 18. OPÇÕES VEGETARIANAS E VEGANAS
Possui opções vegetarianas e veganas. Proteína vegana informada: Linguiça de cogumelos defumada da Cogumelado. Também há outras opções no cardápio. Não inventar ingredientes ou adaptações.

---

# 19. DELIVERY
iFood e 99Food. Acessos reunidos no Linktree: https://linktr.ee/iracemabh. Perguntar antes de enviar o link.

---

# 20. MÚSICA E AGENDA
Todo sábado tem música ao vivo no Iracema, a partir das 13h30. Aos sábados a casa abre às 12h e funciona até as 19h. Exceção: sábado 14/11/2026 (evento privado, veja a seção 23).
Para saber quem vai tocar em cada sábado, a agenda de artistas é divulgada no Instagram @iracemabh. Indique o Instagram e nunca invente o nome de artista, banda ou estilo de um sábado específico.
Samba é um dos gêneros que mais toca na casa. A programação muda semanalmente.
Atrações e eventos especiais cadastrados pela equipe (com data definida) vêm da ferramenta Consultar eventos em destaque: se ela trouxer algo para a data perguntada, informe também. Não invente couvert, duração ou horário diferente do informado.

---

# 21. ARTISTAS
Formulário para propostas: https://forms.gle/ZWDVHa6W7NeTx5Dr8. Perguntar antes de enviar. A equipe entra em contato se a proposta estiver alinhada.

---

# 22. LINKS OFICIAIS
Reservas: https://teggly.com.br/iracema
Cardápio: https://teggly.com.br/iracema/cardapio
Linktree: https://linktr.ee/iracemabh
Instagram: @iracemabh
Formulário artistas: https://forms.gle/ZWDVHa6W7NeTx5Dr8
Grandes eventos: Simone — +55 31 98801-0243

---

# 23. EVENTOS E HORÁRIOS ESPECIAIS CADASTRADOS

## Feriado de 12/10/2026 (segunda-feira) - Nossa Senhora Aparecida
A casa vai abrir normalmente nesse feriado (segunda-feira, 12/10/2026), com horario de fim de semana: 12h as 17h (em vez do horario normal de segunda, que seria 11h as 15h ou fechado).
Se perguntarem se abre nesse feriado, ou qual o horario do dia 12/10, responda com esse horario (12h as 17h). Essa informacao vale so para 12/10/2026.

## Sábado 14/11/2026 - evento privado (casamento)
Nesse dia a casa recebe um casamento, que começa às 16h. Por isso NÃO há reservas para 14/11/2026 (a agenda já está bloqueada no sistema e nenhuma reserva é aceita nem confirmada para essa data) e NÃO há almoço no salão: o almoço desse dia é somente por delivery (iFood e 99Food), das 12h às 15h. A casa não recebe clientes para sentar e comer, nem com reserva nem chegando sem reserva.
Se alguém pedir para reservar para 14/11 ou perguntar se pode ir almoçar, explique com gentileza que nesse dia a casa está fechada para o público por causa de um evento privado, que o almoço é somente por delivery das 12h às 15h, e ofereça enviar o Linktree com os acessos ao iFood e 99Food (pergunte antes de enviar). Não envie o link de reserva para essa data. Sugira outro dia se a pessoa quiser sentar e almoçar na casa. Não informe nomes, detalhes ou convidados do casamento. Não prometa mesa, área ou espaço. Não fale de música ao vivo nesse dia. Quem quiser fazer um evento próprio deve falar com a Simone (seção 9).
Essa informacao vale so para 14/11/2026.

## Domingo 15/11/2026 - Samba com Sergim Santhiago e Banda
Tem Sergim Santhiago e Banda no domingo 15/11/2026, a partir das 13h30. Aceita reservas: indique o link de reservas https://teggly.com.br/iracema (perguntar antes de enviar). Não invente couvert nem duração.

## Sexta 20/11/2026 (feriado) - Roda da Boua
Dia de Roda da Boua, evento SOMENTE com compra de ingressos e SEM RESERVAS neste dia (a agenda está bloqueada; não envie link de reserva). Ingressos: https://shotgun.live/en/events/roda-da-boua-iracema-20-11-14-h (também no link da bio do Instagram @iracemabh). Se pedirem o link do ingresso, envie esse link direto, sem enrolar nem prometer repasse para a equipe. Início às 14h. Não invente preço, atração ou line-up.
Condição especial de aniversariante para a Roda da Boua:
➡️ Aniversariante off
➡️ +10 nomes na lista amiga, off até as 15:30h (limite de 10 nomes; listar em https://forms.gle/H5uodKtE3ymWDj4B7)
➡️ + 2 Xeque-Mates para o aniversariante
➡️ + Desconto de 20% na compra de ingresso para os demais convidados
Essa informacao vale so para 20/11/2026. Depois dessa data, remova este bloco.

## Sábado 21/11/2026 - Samba com Sergim Santhiago e Banda
Música ao vivo com Sergim Santhiago e Banda a partir das 13h30. Aceita reservas pelo link https://teggly.com.br/iracema (perguntar antes de enviar).

## Sábado 28/11/2026 - Pagode do Sonic
Pagode do Sonic, SOMENTE com compra de ingressos e SEM RESERVAS neste dia (a agenda está bloqueada; não envie link de reserva). Ingressos: https://shotgun.live/en/events/pagode-do-sonic-iracema-28-11 (também no link da bio do Instagram @iracemabh). Se pedirem o link, envie direto. Início às 16h. Não invente preço ou line-up. Depois dessa data, remova este bloco.

## Domingo 29/11/2026 - Samba com Sergim Santhiago e Banda
Sergim Santhiago e Banda a partir das 13h30. Aceita reservas pelo link https://teggly.com.br/iracema (perguntar antes de enviar).

## ATRAÇÕES E EVENTOS ESPECIAIS
São dinâmicos e vêm da ferramenta Consultar eventos em destaque, nunca desta base. Evento com data passada nunca é apresentado como futuro. A música ao vivo de todo sábado (seção 20) vale sempre, mesmo sem evento cadastrado, exceto no sábado 14/11/2026 (casa fechada).

Outros dados que podem mudar (pratos especiais, promocoes, horarios especiais, condicoes comerciais): sempre priorizar a informacao mais recente fornecida pela equipe; se nao houver nada cadastrado aqui, nao inventar.
$kb$)
ON CONFLICT (tenant_slug) DO UPDATE SET conteudo = EXCLUDED.conteudo, updated_at = now();
