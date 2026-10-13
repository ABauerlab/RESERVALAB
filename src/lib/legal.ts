/**
 * Textos legais publicos do Teggly. Versao e data aparecem nas paginas e sao gravadas junto do aceite
 * (e-book). Ao alterar qualquer texto, atualize VERSAO_TEXTOS e a data.
 * Rascunho redigido a partir do que o produto realmente faz; recomenda-se revisao juridica.
 */
import { EMAIL_CONTATO } from "@/lib/site";

export const VERSAO_TEXTOS = "2026-10-13";
export const DATA_TEXTOS = "13 de outubro de 2026";

export type Secao = { titulo: string; paragrafos?: string[]; itens?: string[] };

export const PRIVACIDADE: Secao[] = [
  {
    titulo: "1. Quem somos e a quem este aviso se aplica",
    paragrafos: [
      "O Teggly é uma plataforma de reservas e atendimento para restaurantes e bares, com página de reserva, cardápio digital, Link Hub, clientes e automações de WhatsApp. Este aviso explica como tratamos dados pessoais no site teggly.com.br, na página do guia gratuito e no painel do Teggly.",
      `Contato para qualquer assunto de privacidade: ${EMAIL_CONTATO}.`,
    ],
  },
  {
    titulo: "2. Dois papéis diferentes",
    paragrafos: [
      "Visitantes, interessados e restaurantes clientes: quando você preenche um formulário do Teggly ou contrata o serviço, o Teggly decide como tratar esses dados e atua como controlador.",
      "Clientes finais dos restaurantes: quando você faz uma reserva na página de um restaurante, o restaurante decide para que usar seus dados e é o controlador. O Teggly atua como operador, tratando os dados em nome do restaurante e conforme as instruções dele. Para exercer seus direitos sobre uma reserva, fale primeiro com o restaurante.",
    ],
  },
  {
    titulo: "3. Quais dados tratamos",
    itens: [
      "Guia gratuito: nome, nome do negócio, e-mail, WhatsApp, Instagram do negócio, versão do aviso aceito e data e hora do pedido.",
      "Contratação e uso do painel: nome, e-mail de acesso, nome do restaurante, dados de contato e da conta, plano contratado e registros de uso necessários ao funcionamento e à segurança.",
      "Reservas (em nome do restaurante): nome, telefone, quantidade de pessoas, data, horário, observações e o histórico das mensagens trocadas sobre a reserva.",
      "Dados técnicos: endereço IP e dados do navegador, usados para segurança, prevenção de fraude e de envios automatizados.",
    ],
  },
  {
    titulo: "4. Para que usamos e em qual base legal",
    itens: [
      "Entregar o guia gratuito e entrar em contato sobre ele: consentimento, que você pode retirar a qualquer momento.",
      "Criar e manter sua conta, prestar o serviço e cobrar: execução de contrato e procedimentos preliminares.",
      "Processar reservas de clientes finais: em nome do restaurante, conforme a base legal que ele indicar.",
      "Segurança, prevenção de abuso e fraude e cumprimento de obrigações legais: legítimo interesse e obrigação legal.",
    ],
    paragrafos: [
      "Não vendemos dados pessoais e não os usamos para decisões automatizadas que produzam efeitos jurídicos sobre você.",
    ],
  },
  {
    titulo: "5. Com quem compartilhamos",
    paragrafos: [
      "Usamos prestadores que tratam dados em nosso nome, apenas para operar o serviço:",
    ],
    itens: [
      "Hospedagem e banco de dados da aplicação (Supabase e a infraestrutura de hospedagem do site).",
      "Google (Planilhas e Apps Script), onde registramos os pedidos do guia gratuito.",
      "Serviços de automação e envio de mensagens por WhatsApp, usados nas confirmações, lembretes e avisos de reserva.",
      "Cloudflare Turnstile, quando ativo, para verificar que o envio é feito por uma pessoa.",
    ],
  },
  {
    titulo: "6. Transferência internacional",
    paragrafos: [
      "Alguns prestadores podem armazenar ou processar dados fora do Brasil. Nesses casos, buscamos prestadores que ofereçam salvaguardas adequadas, conforme a LGPD.",
    ],
  },
  {
    titulo: "7. Por quanto tempo guardamos",
    paragrafos: [
      "Guardamos os dados pelo tempo necessário para a finalidade para a qual foram coletados, para cumprir obrigações legais e para exercer direitos em processos. Pedidos do guia gratuito são mantidos enquanto você não pedir a exclusão. Dados de reservas seguem as instruções do restaurante. Quando uma conta é encerrada, não apagamos os dados automaticamente: eles são exportados ou excluídos mediante pedido do restaurante, salvo o que a lei nos obrigue a manter.",
    ],
  },
  {
    titulo: "8. Seus direitos",
    paragrafos: ["Conforme a LGPD, você pode pedir:"],
    itens: [
      "Confirmação de que tratamos seus dados e acesso a eles.",
      "Correção de dados incompletos, inexatos ou desatualizados.",
      "Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desacordo com a lei.",
      "Portabilidade dos dados.",
      "Informação sobre com quem compartilhamos seus dados.",
      "Retirada do consentimento e eliminação dos dados tratados com base nele.",
      "Revisão de decisões tomadas apenas de forma automatizada.",
    ],
  },
  {
    titulo: "9. Como exercer seus direitos",
    paragrafos: [
      `Escreva para ${EMAIL_CONTATO} informando o e-mail ou telefone usado. Podemos pedir uma confirmação de identidade antes de atender. Se for dado de uma reserva, indicaremos o restaurante responsável. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
    ],
  },
  {
    titulo: "10. Segurança",
    paragrafos: [
      "Adotamos medidas técnicas e organizacionais para proteger os dados, como controle de acesso por empresa, senhas protegidas pelo sistema de autenticação, conexão criptografada, limites contra envios automatizados e registro mínimo do necessário. Nenhum sistema é totalmente imune a incidentes. Se ocorrer um incidente que possa causar risco relevante, comunicaremos os afetados e a ANPD conforme a lei.",
    ],
  },
  {
    titulo: "11. Cookies e armazenamento no navegador",
    paragrafos: [
      "O site e o painel usam armazenamento do navegador para funcionar, por exemplo manter você conectado e lembrar preferências. As páginas públicas de alguns restaurantes podem carregar o pixel de mensuração configurado pelo próprio restaurante, que é responsável por ele.",
    ],
  },
  {
    titulo: "12. Crianças e adolescentes",
    paragrafos: ["O Teggly é voltado a empresas e não coleta dados de crianças intencionalmente."],
  },
  {
    titulo: "13. Mudanças neste aviso",
    paragrafos: [
      `Podemos atualizar este aviso. A versão em vigor e a data aparecem no topo da página (versão ${VERSAO_TEXTOS}). Mudanças relevantes serão comunicadas pelos nossos canais.`,
    ],
  },
];

export const TERMOS: Secao[] = [
  {
    titulo: "1. O que é o Teggly",
    paragrafos: [
      "O Teggly é uma plataforma para restaurantes e bares receberem e organizarem reservas, com página de reserva, cardápio digital, Link Hub, cadastro de clientes, relatórios e automações de mensagens por WhatsApp, conforme o plano contratado. Ao criar uma conta ou usar o serviço, você concorda com estes Termos e com o Aviso de Privacidade.",
    ],
  },
  {
    titulo: "2. Quem pode usar",
    paragrafos: [
      "O serviço é destinado a empresas e a pessoas maiores de 18 anos com poderes para contratar em nome do estabelecimento. Você é responsável pelas informações que fornece no cadastro.",
    ],
  },
  {
    titulo: "3. Conta e acesso",
    paragrafos: [
      "Cada restaurante tem sua conta. Hoje as contas são ativadas pela equipe do Teggly após o contato. Guarde sua senha e não a compartilhe. Você responde pelas ações feitas com seu acesso e deve nos avisar em caso de uso indevido.",
    ],
  },
  {
    titulo: "4. Planos e recursos",
    paragrafos: [
      "Os recursos, limites e preços de cada plano são os publicados em teggly.com.br/planos. O Cardápio Digital e o Link Hub estão em todos os planos, inclusive no Gratuito, que também inclui a página pública de reserva até o limite de reservas por mês informado. Recursos como confirmação e lembrete por WhatsApp, relatórios e assistente dependem do plano contratado. Os valores podem ser ajustados, e o ajuste não afeta o período já pago.",
    ],
  },
  {
    titulo: "5. Pagamento",
    paragrafos: [
      "Os planos pagos são cobrados nos valores e ciclos informados na contratação. Um plano pago só é liberado depois da confirmação do pagamento. Sem fidelidade e sem taxa por reserva ou comissão. Se o pagamento não for confirmado, a conta continua com os recursos gratuitos, sem apagar seus dados.",
    ],
  },
  {
    titulo: "6. Cancelamento",
    paragrafos: [
      `Você pode cancelar quando quiser, pedindo por ${EMAIL_CONTATO}. O plano pago segue até o fim do período já pago. Depois disso a conta volta aos recursos gratuitos. Você pode pedir a exportação ou a exclusão dos dados.`,
    ],
  },
  {
    titulo: "7. Responsabilidades do restaurante",
    itens: [
      "Informar dados corretos de horários, capacidade, cardápio e contato.",
      "Tratar os dados dos seus clientes conforme a LGPD, com base legal adequada, e informá-los sobre isso. Para esses dados o restaurante é o controlador e o Teggly é o operador.",
      "Ter autorização para enviar mensagens aos clientes e cumprir as regras do WhatsApp.",
      "Não usar o serviço para conteúdo ilegal, enganoso ou que viole direitos de terceiros.",
      "Não tentar burlar limites, atacar, copiar ou sobrecarregar o serviço.",
    ],
  },
  {
    titulo: "8. Mensagens de WhatsApp e serviços de terceiros",
    paragrafos: [
      "As automações dependem de serviços de terceiros, como o WhatsApp e provedores de hospedagem e mensagens. Esses serviços podem mudar regras, sofrer instabilidade ou bloquear números por motivos que não controlamos. A entrega de cada mensagem não é garantida, e a confirmação final de uma reserva é sempre feita pelo sistema e pela casa.",
    ],
  },
  {
    titulo: "9. Disponibilidade",
    paragrafos: [
      "Trabalhamos para manter o serviço disponível, mas ele pode ter interrupções para manutenção ou por falhas de terceiros. Não garantimos funcionamento ininterrupto nem ausência total de erros.",
    ],
  },
  {
    titulo: "10. Propriedade intelectual",
    paragrafos: [
      "O Teggly, sua marca, interface e software pertencem aos seus titulares. Você recebe o direito de usar o serviço durante a vigência do plano, sem transferência de propriedade. Os conteúdos que você publica, como logo, fotos e textos do cardápio, continuam seus, e você nos autoriza a exibi-los nas páginas do seu restaurante.",
    ],
  },
  {
    titulo: "11. Limitação de responsabilidade",
    paragrafos: [
      "O Teggly é uma ferramenta de apoio e não garante resultados de vendas ou de ocupação. Na extensão permitida em lei, não respondemos por lucros cessantes ou danos indiretos, nem por falhas causadas por serviços de terceiros, uso indevido ou informações incorretas fornecidas pelo restaurante. Nada aqui limita responsabilidades que a lei não permita limitar.",
    ],
  },
  {
    titulo: "12. Suspensão e encerramento",
    paragrafos: [
      "Podemos suspender uma conta em caso de violação destes Termos, uso abusivo ou risco à segurança, avisando sempre que possível. Não apagamos dados automaticamente por suspensão ou falta de pagamento.",
    ],
  },
  {
    titulo: "13. Mudanças nos Termos",
    paragrafos: [
      `Podemos atualizar estes Termos. A versão em vigor e a data aparecem no topo (versão ${VERSAO_TEXTOS}). Mudanças relevantes serão avisadas antes de valer. Continuar usando depois do aviso significa concordar com a nova versão.`,
    ],
  },
  {
    titulo: "14. Lei aplicável e contato",
    paragrafos: [
      `Estes Termos seguem as leis do Brasil. Dúvidas e solicitações: ${EMAIL_CONTATO}.`,
    ],
  },
];
