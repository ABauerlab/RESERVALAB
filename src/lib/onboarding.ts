/**
 * Onboarding pos-login. Curto, progressivo, pulavel e retomavel. O estado de quem ja viu ou pulou
 * fica no usuario (metadata de auth, sem tabela nova); o passo atual fica no navegador.
 */

export const ONBOARDING_VERSAO = 1;
export const EVENTO_REINICIAR = "teggly:onboarding:reiniciar";
/** Usuarios criados antes desta data ja conhecem o painel: o tour so abre se pedirem em Ajustes. */
export const ONBOARDING_DESDE = "2026-10-08";

export type EstadoOnboarding = {
  versao: number;
  concluido_em?: string | null;
  pulado_em?: string | null;
};

export type UsuarioOnboarding = {
  created_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

export function estadoDoUsuario(u: UsuarioOnboarding): EstadoOnboarding | null {
  const v = u.user_metadata?.teggly_onboarding;
  if (!v || typeof v !== "object") return null;
  const e = v as Partial<EstadoOnboarding>;
  return { versao: typeof e.versao === "number" ? e.versao : 0, ...e };
}

/** Novo usuario que ainda nao concluiu nem pulou esta versao. */
export function deveMostrar(u: UsuarioOnboarding, desde = ONBOARDING_DESDE): boolean {
  const e = estadoDoUsuario(u);
  if (e && e.versao >= ONBOARDING_VERSAO && (e.concluido_em || e.pulado_em)) return false;
  if (e) return false;
  // Sem data de criacao conta como novo; com data, so quem entrou a partir do lancamento.
  if (!u.created_at) return true;
  return u.created_at.slice(0, 10) >= desde;
}

export type Passo = {
  id: string;
  /** Valor de data-tour do elemento a destacar. Sem alvo visivel, o cartao aparece no centro. */
  alvo: string | null;
  titulo: string;
  texto: string;
  /**
   * Pagina real onde o passo acontece, relativa a `/{slug}/admin` ("" = Dashboard). O tour leva a
   * pessoa para la ao avancar: ensina o produto usando o proprio produto. Sem `rota`, fica onde esta.
   */
  rota?: string;
  /** Dica quando o alvo esta escondido (ex.: item dentro de "Mais" no celular). */
  dicaMobile?: string;
};

export function passosDoTour(opts: { whatsapp: boolean; assistente: boolean }): Passo[] {
  const passos: Passo[] = [
    {
      id: "inicio",
      alvo: null,
      rota: "",
      titulo: "Bem-vindo ao Teggly",
      texto:
        "Vamos passear pelas telas de verdade, em 1 minuto. Pode pular e refazer quando quiser, em Ajustes.",
    },
    {
      id: "hoje",
      alvo: "dash-atencao",
      rota: "",
      titulo: "Dashboard: o que fazer agora",
      texto:
        "Aqui aparece o que precisa de você: reservas para confirmar e reconfirmar. Abaixo, o dia e os próximos dias. Comece por aqui todo dia.",
    },
    {
      id: "reservas",
      alvo: "reservas-periodo",
      rota: "/reservas",
      titulo: "Reservas",
      texto:
        "Escolha o período ou um dia específico no calendário. Abra uma reserva para confirmar, editar ou cancelar: o cliente é avisado.",
    },
    {
      id: "agenda",
      alvo: "nav-agenda",
      rota: "/agenda",
      titulo: "Agenda",
      texto: "A semana por horário. Bloqueie datas e feriados e a página de reserva respeita.",
    },
    {
      id: "cardapio",
      alvo: "cardapio-abas",
      rota: "/cardapio",
      titulo: "Cardápio",
      texto:
        "Conteúdo é o que você vende, Aparência é como fica, Publicação é quando o cliente passa a ver. Nada vai ao ar sem você publicar.",
    },
    {
      id: "hub",
      alvo: "hub-publicar",
      rota: "/links",
      titulo: "Link Hub",
      texto:
        "Sua página para a bio do Instagram, pensada para caber em uma tela. “Reservar mesa” vem sempre em primeiro.",
    },
    {
      id: "eventos",
      alvo: "eventos-novo",
      rota: "/eventos",
      titulo: "Eventos",
      texto:
        "Cadastre o evento com o flyer em qualquer formato. Ele aparece na página de reservas e no Link Hub até a data passar.",
    },
    {
      id: "ajustes",
      alvo: "nav-configuracoes",
      rota: "/configuracoes",
      titulo: "Ajustes",
      texto:
        "Horários, áreas, WhatsApp, a marca do restaurante e o seu plano. Este passo a passo pode ser refeito aqui.",
      dicaMobile: "Fica em Mais.",
    },
  ];
  if (opts.whatsapp) {
    passos.push({
      id: "whatsapp",
      alvo: null,
      titulo: opts.assistente ? "WhatsApp e Assistente" : "WhatsApp",
      texto: opts.assistente
        ? "O Teggly confirma e lembra seus clientes, e o Assistente responde pedidos. Quando o assunto pede gente, a equipe assume."
        : "O Teggly confirma e lembra seus clientes pelo WhatsApp, sem você precisar digitar.",
    });
  }
  passos.push({
    id: "fim",
    alvo: null,
    rota: "",
    titulo: "Tudo pronto",
    texto:
      "Compartilhe o link de reserva do restaurante e as reservas passam a aparecer no Dashboard.",
  });
  return passos;
}

/** Caminho completo do passo, ou null quando ele fica na pagina atual. */
export function caminhoDoPasso(slug: string, passo: Pick<Passo, "rota">): string | null {
  return passo.rota === undefined ? null : `/${slug}/admin${passo.rota}`;
}

/** Mesma pagina, ignorando barra final. */
export function mesmaPagina(atual: string, alvo: string): boolean {
  const n = (x: string) => (x.length > 1 ? x.replace(/\/+$/, "") : x);
  return n(atual) === n(alvo);
}

export const CHAVE_TOUR_ATIVO = "teggly:onb:ativo";

export function chavePasso(userId: string): string {
  return `teggly:onb:${userId}`;
}

export function limitarPasso(i: number, total: number): number {
  if (!Number.isFinite(i)) return 0;
  return Math.min(Math.max(0, Math.floor(i)), Math.max(0, total - 1));
}
