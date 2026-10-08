# Teggly: onboarding

Fase D. Passo a passo curto que ensina o painel sem tutorial cansativo.

## Quando aparece

Depois do login, para todo usuário novo (conta criada a partir de 2026-10-08, ou sem data de criação). Quem já usava o painel antes não é interrompido; abre pelo botão em Ajustes.

## O que é

- Cartão pequeno com destaque no item da navegação (desktop e tablet) e, no celular, o cartão aparece acima da barra inferior. Itens que ficam em "Mais" ganham a dica "Fica em Mais".
- **Não bloqueia:** o destaque deixa passar os cliques; dá para usar o painel com o passo a passo aberto.
- **Pulável:** botão "Pular" sempre visível e tecla Esc.
- **Retomável:** o passo atual fica no navegador; ao voltar, continua de onde parou. "Pular" e "Concluir" são salvos no usuário (`teggly_onboarding` em metadata de autenticação, versão 1), sem tabela nova.
- **Refazível:** Ajustes, Ajuda, "Refazer onboarding".
- Acessível: `role=dialog`, foco no cartão a cada passo, barra de progresso, linha + gota como progresso.

## Passos (9 a 10)

1. Bem-vindo (onde está e como pular).
2. Hoje: o que fazer agora.
3. Reservas.
4. Agenda.
5. Clientes.
6. Cardápio.
7. Link Hub.
8. Ajustes (inclui plano e este passo a passo).
9. WhatsApp e Assistente, **só quando o plano inclui** confirmação no WhatsApp (e menciona o Assistente quando o plano tem).
10. Tudo pronto: ação real "Copiar link de reserva" e "Concluir".

## De onde chega e para onde vai

Chega: login. Vai: Hoje (Dashboard), de onde cada cartão leva a Reservas, Agenda, Clientes.

## Testes

Unidade: regras de quem vê, passos condicionais, sem emoji nem travessão. E2E: novo usuário até o Dashboard, pular, retomar, Esc, quem já concluiu não vê, refazer em Ajustes (desktop e mobile).

## Pendências

- Tour contextual por tela (dicas na primeira visita a Cardápio e Link Hub).
- Medir conclusão e abandono por passo (sem coletar dado pessoal).
