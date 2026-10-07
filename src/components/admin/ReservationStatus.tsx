import { STATUS_LABEL, type ReservaStatus } from "@/lib/reservations";
import { cn } from "@/lib/utils";

const STYLES: Record<ReservaStatus, string> = {
  pendente: "bg-warning-50 text-warning-700 before:bg-warning-500",
  confirmada: "bg-success-50 text-success-700 before:bg-success-500",
  cancelada: "bg-error-50 text-error-700 before:bg-error-500",
  finalizada: "bg-muted text-muted-foreground before:bg-slate-400",
};

/** Status = ponto + rótulo (nunca só cor), em pílula. Fundo 50, ponto 500, texto 700. */
export function ReservationStatus({
  status,
  className,
}: {
  status: ReservaStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold before:size-[7px] before:rounded-full before:content-['']",
        STYLES[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
