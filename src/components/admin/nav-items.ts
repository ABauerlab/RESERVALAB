import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Lightbulb,
  Link2,
  Music,
  Settings,
  UtensilsCrossed,
  Users,
} from "lucide-react";

export type AdminTab =
  | "hoje"
  | "reservas"
  | "agenda"
  | "cardapio"
  | "links"
  | "eventos"
  | "relatorios"
  | "contatos"
  | "configuracoes"
  | "sugestoes";

export type NavItem = {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
};

// Rotas existentes preservadas. O Dashboard é a raiz do painel; Reservas é a rota nova.
export const NAV_HOJE: NavItem = {
  id: "hoje",
  label: "Dashboard",
  icon: LayoutDashboard,
  to: "/$slug/admin",
};
export const NAV_RESERVAS: NavItem = {
  id: "reservas",
  label: "Reservas",
  icon: ClipboardList,
  to: "/$slug/admin/reservas",
};
export const NAV_AGENDA: NavItem = {
  id: "agenda",
  label: "Agenda",
  icon: CalendarDays,
  to: "/$slug/admin/agenda",
};
export const NAV_EVENTOS: NavItem = {
  id: "eventos",
  label: "Eventos",
  icon: Music,
  to: "/$slug/admin/eventos",
};
export const NAV_CARDAPIO: NavItem = {
  id: "cardapio",
  label: "Cardápio",
  icon: UtensilsCrossed,
  to: "/$slug/admin/cardapio",
};
export const NAV_LINKS: NavItem = {
  id: "links",
  label: "Link Hub",
  icon: Link2,
  to: "/$slug/admin/links",
};
export const NAV_CLIENTES: NavItem = {
  id: "contatos",
  label: "Clientes",
  icon: Users,
  to: "/$slug/admin/contatos",
};
export const NAV_RELATORIOS: NavItem = {
  id: "relatorios",
  label: "Relatórios",
  icon: BarChart3,
  to: "/$slug/admin/relatorios",
};
export const NAV_SUGESTOES: NavItem = {
  id: "sugestoes",
  label: "Sugestões",
  icon: Lightbulb,
  to: "/$slug/admin/sugestoes",
};
export const NAV_AJUSTES: NavItem = {
  id: "configuracoes",
  label: "Ajustes",
  icon: Settings,
  to: "/$slug/admin/configuracoes",
};

/** Desktop: todos os destinos, nada deixa de ser alcançável. */
export const SIDEBAR_GROUPS: NavItem[][] = [
  [NAV_HOJE, NAV_RESERVAS, NAV_AGENDA, NAV_EVENTOS],
  [NAV_CARDAPIO, NAV_LINKS],
  [NAV_CLIENTES, NAV_RELATORIOS],
];
export const SIDEBAR_FOOTER: NavItem[] = [NAV_SUGESTOES, NAV_AJUSTES];

/** Mobile: barra inferior (Agenda aponta para a página atual até a F2) + "Mais". */
export const BOTTOM_ITEMS: NavItem[] = [NAV_HOJE, NAV_RESERVAS, NAV_AGENDA];
export const MORE_ITEMS: NavItem[] = [
  NAV_EVENTOS,
  NAV_CARDAPIO,
  NAV_LINKS,
  NAV_CLIENTES,
  NAV_RELATORIOS,
  NAV_SUGESTOES,
  NAV_AJUSTES,
];
