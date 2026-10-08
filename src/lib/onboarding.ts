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
  /** Dica quando o alvo esta escondido (ex.: item dentro de "Mais" no celular). */
  dicaMobile?: string;
};

export function passosDoTour(opts: { whatsapp: boolean; assistente: boolean }): Passo[] {
  const passos: Passo[] = [
    {
      id: "inicio",
      alvo: null,
      titulo: "Bem-vindo ao Teggly",
      texto:
        "Em 1 minuto você vê onde está cada coisa. Pode pular e refazer quando quiser, em Ajustes.",
    },
    {
      id: "hoje",
      alvo: "nav-hoje",
      titulo: "Hoje: o que fazer agora",
      texto:
        "Veja quem chega, o que está pendente e quem precisa reconfirmar. Comece por aqui todo dia.",
    },
    {
      id: "reservas",
      alvo: "nav-reservas",
      titulo: "Reservas",
      texto:
        "Todas as reservas, com busca e filtros. Confirme, edite ou cancele: o cliente é avisado.",
    },
    {
      id: "agenda",
      alvo: "nav-agenda",
      titulo: "Agenda",
      texto: "A semana por horário. Bloqueie datas e feriados e a página de reserva respeita.",
    },
    {
      id: "clientes",
      alvo: "nav-contatos",
      titulo: "Clientes",
      texto:
        "Cada reserva cria o perfil e o histórico do cliente. Fale com ele pelo WhatsApp em um toque.",
      dicaMobile: "Fica em Mais.",
    },
    {
      id: "cardapio",
      alvo: "nav-cardapio",
      titulo: "Cardápio",
      texto: "Monte categorias e pratos, com foto e preço. Está incluído em todos os planos.",
      dicaMobile: "Fica em Mais.",
    },
    {
      id: "hub",
      alvo: "nav-links",
      titulo: "Link Hub",
      texto: "Sua página para a bio do Instagram. “Reservar mesa” vem sempre em primeiro.",
      dicaMobile: "Fica em Mais.",
    },
    {
      id: "ajustes",
      alvo: "nav-configuracoes",
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
    titulo: "Tudo pronto",
    texto: "Compartilhe o link de reserva do restaurante e as reservas passam a aparecer em Hoje.",
  });
  return passos;
}

export function chavePasso(userId: string): string {
  return `teggly:onb:${userId}`;
}

export function limitarPasso(i: number, total: number): number {
  if (!Number.isFinite(i)) return 0;
  return Math.min(Math.max(0, Math.floor(i)), Math.max(0, total - 1));
}
