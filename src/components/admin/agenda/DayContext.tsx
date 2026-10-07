import { Link } from "@tanstack/react-router";
import { Ban, CalendarHeart, Music } from "lucide-react";

import { descreverBloqueio, type DiaContexto } from "@/lib/agenda";
import { formatHorario } from "@/lib/reservations";

function Linha({
  icon: Icon,
  rotulo,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  rotulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li className={`flex items-start gap-3 px-4 py-2.5 ${className ?? ""}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm text-foreground">
        <span className="font-semibold">{rotulo}</span>
        <span className="text-muted-foreground"> · </span>
        {children}
      </p>
    </li>
  );
}

/**
 * Contexto do dia: bloqueio (restrição), feriado e evento (contexto). Nenhum deles é reserva
 * nem capacidade. Feriado não significa restaurante fechado; evento é destaque público.
 */
export function DayContext({ contexto, slug }: { contexto: DiaContexto; slug: string }) {
  const { bloqueios, feriado, eventos } = contexto;
  if (bloqueios.length === 0 && !feriado && eventos.length === 0) return null;

  return (
    <section aria-label="Contexto do dia">
      <h3 className="mb-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
        Contexto do dia
      </h3>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-xs">
        {bloqueios.map((b) => (
          <Linha key={b.id} icon={Ban} rotulo="Bloqueio" className="bg-muted/60">
            {descreverBloqueio(b)}
            {b.motivo ? ` · ${b.motivo}` : ""}
            <span className="text-muted-foreground">
              {" "}
              · novas reservas pelo site não são aceitas
            </span>
          </Linha>
        ))}
        {feriado && (
          <Linha icon={CalendarHeart} rotulo="Feriado">
            {feriado.motivo ?? "Sem descrição"}
            <span className="text-muted-foreground"> · usa os horários de fim de semana</span>
          </Linha>
        )}
        {eventos.map((e) => (
          <Linha key={e.id} icon={Music} rotulo="Evento">
            {e.titulo}
            {e.horario ? ` · ${formatHorario(e.horario)}` : ""}
            <Link
              to="/$slug/admin/eventos"
              params={{ slug }}
              className="ml-2 inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline xl:min-h-0"
            >
              Gerenciar em Eventos
            </Link>
          </Linha>
        ))}
      </ul>
    </section>
  );
}
