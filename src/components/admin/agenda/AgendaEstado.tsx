import { cn } from "@/lib/utils";

/**
 * Estado vazio ou de erro da Agenda: diz o que aconteceu e o que a pessoa pode fazer.
 * `alert` para erros (lido de imediato por leitores de tela).
 */
export function AgendaEstado({
  titulo,
  texto,
  acoes,
  alert,
  className,
}: {
  titulo: string;
  texto: string;
  acoes?: React.ReactNode;
  alert?: boolean;
  className?: string;
}) {
  return (
    <div
      role={alert ? "alert" : "status"}
      className={cn(
        "rounded-lg border border-dashed border-border bg-card/50 px-4 py-10 text-center",
        className,
      )}
    >
      <p className="text-xl font-extrabold tracking-tight text-foreground">{titulo}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{texto}</p>
      {acoes && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{acoes}</div>
      )}
    </div>
  );
}
