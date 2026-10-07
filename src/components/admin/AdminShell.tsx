import { AppShell } from "./AppShell";
import type { AdminTab } from "./nav-items";

export type { AdminTab } from "./nav-items";

/**
 * Contrato original do painel (`slug`, `tenantNome`, `active`) preservado: as
 * páginas ainda não redesenhadas (Agenda, Eventos, Relatórios, Clientes,
 * Ajustes, Sugestões) continuam usando AdminShell sem alteração.
 */
export function AdminShell({
  slug,
  tenantNome,
  active,
  children,
}: {
  slug: string;
  tenantNome: string;
  active: AdminTab;
  children: React.ReactNode;
}) {
  return (
    <AppShell slug={slug} tenantNome={tenantNome} active={active}>
      {children}
    </AppShell>
  );
}
