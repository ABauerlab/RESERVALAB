import { formatData, type Reserva } from "@/lib/reservations";
import { NovasReservasBanner } from "../NovasReservas";
import { ReservationRow } from "../ReservationRow";

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <section>
      <h3 className="mb-1.5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
        {title}
        <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-foreground">{count}</span>
      </h3>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">{children}</div>
    </section>
  );
}

/** Precisa de você: pendentes, reconfirmações necessárias e novos pedidos, cada um com ação clara. */
export function NeedsYou({
  tenantId, pendentes, reconfirmar, selectedId, onOpen, renderAction, loading,
}: {
  tenantId: string | null;
  pendentes: Reserva[];
  reconfirmar: Reserva[];
  selectedId?: string | null;
  onOpen: (r: Reserva) => void;
  renderAction: (r: Reserva) => React.ReactNode;
  loading?: boolean;
}) {
  const total = pendentes.length + reconfirmar.length;
  const row = (r: Reserva) => (
    <ReservationRow
      key={r.id}
      reserva={r}
      showDate={<span className="text-[13px] font-semibold text-muted-foreground">{r.data ? formatData(r.data).slice(0, 5) : "—"}</span>}
      compact
      selected={selectedId === r.id}
      onOpen={() => onOpen(r)}
      action={renderAction(r)}
    />
  );
  return (
    <div className="space-y-4">
      <NovasReservasBanner tenantId={tenantId} />
      <Group title="Pendentes" count={pendentes.length}>{pendentes.map(row)}</Group>
      <Group title="Reconfirmar" count={reconfirmar.length}>{reconfirmar.map(row)}</Group>
      {!loading && total === 0 && (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Nada esperando por você.
        </p>
      )}
    </div>
  );
}
