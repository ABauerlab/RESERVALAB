import { CalendarHeart, CalendarX2, Loader2, Plus, Trash2 } from "lucide-react";

import { useAgendaConfig } from "@/hooks/use-agenda-config";
import { formatData, formatHorario } from "@/lib/reservations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Criar e remover bloqueios e feriados (mesmos formulários e regras da página anterior).
 * Fica dentro de um diálogo aberto a partir da Agenda.
 */
export function AgendaGestao({ tenantId }: { tenantId: string | null }) {
  const {
    data,
    setData,
    diaTodo,
    setDiaTodo,
    horaInicio,
    setHoraInicio,
    horaFim,
    setHoraFim,
    motivo,
    setMotivo,
    bloqueiosQ,
    criar,
    remover,
    podeCriar,
    feriadoData,
    setFeriadoData,
    feriadoMotivo,
    setFeriadoMotivo,
    feriadosQ,
    criarFeriado,
    removerFeriado,
    podeCriarFeriado,
  } = useAgendaConfig(tenantId);

  return (
    <div className="space-y-2">
      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-semibold">Novo bloqueio</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[13px]">Data</Label>
            <Input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="h-11 rounded-md"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px]">Abrangência</Label>
            <div className="flex gap-1.5 rounded-[12px] bg-muted p-1">
              <button
                type="button"
                onClick={() => setDiaTodo(true)}
                className={`h-11 flex-1 xl:h-9 rounded-md text-xs font-medium transition-all ${diaTodo ? "bg-background shadow-[var(--shadow-sm)]" : "text-muted-foreground"}`}
              >
                Dia inteiro
              </button>
              <button
                type="button"
                onClick={() => setDiaTodo(false)}
                className={`h-11 flex-1 xl:h-9 rounded-md text-xs font-medium transition-all ${!diaTodo ? "bg-background shadow-[var(--shadow-sm)]" : "text-muted-foreground"}`}
              >
                Faixa de horário
              </button>
            </div>
          </div>
        </div>

        {!diaTodo && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[13px]">Das</Label>
              <Input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="h-11 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Até</Label>
              <Input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className="h-11 rounded-md"
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para bloquear até o fim do dia.
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <Label className="text-[13px]">Motivo (opcional, visível ao cliente)</Label>
          <Input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: Evento fechado"
            className="h-11 rounded-md"
          />
        </div>

        <Button
          onClick={() => criar.mutate()}
          disabled={!podeCriar}
          className="mt-5 h-11 w-full rounded-md bg-primary text-primary-foreground hover:bg-blue-700 sm:w-auto sm:px-6"
        >
          {criar.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Bloquear
        </Button>
      </section>

      <section className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Bloqueios ativos
        </h3>
        {bloqueiosQ.isLoading ? (
          <div className="mt-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (bloqueiosQ.data?.length ?? 0) === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-card/50 py-12 text-center">
            <CalendarX2 className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 font-serif font-semibold text-2xl">Nenhum bloqueio</p>
            <p className="mt-1 text-sm text-muted-foreground">A agenda está totalmente aberta.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {bloqueiosQ.data!.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{formatData(b.data)}</p>
                  <p className="text-sm text-muted-foreground">
                    {b.hora_inicio && b.hora_fim
                      ? `Das ${formatHorario(b.hora_inicio)} às ${formatHorario(b.hora_fim)}`
                      : b.hora_inicio
                        ? `A partir das ${formatHorario(b.hora_inicio)}`
                        : b.hora_fim
                          ? `Até as ${formatHorario(b.hora_fim)}`
                          : "Dia inteiro"}
                    {b.motivo ? ` · ${b.motivo}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => remover.mutate(b.id)}
                  className="flex h-11 w-11 xl:h-9 xl:w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remover bloqueio"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-border bg-card p-5">
        <h3 className="font-semibold">Feriados</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Uma data marcada como feriado passa a usar os horários de fim de semana (janela e
          horário-limite), mesmo caindo num dia de semana.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[13px]">Data</Label>
            <Input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={feriadoData}
              onChange={(e) => setFeriadoData(e.target.value)}
              className="h-11 rounded-md"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px]">Motivo (opcional)</Label>
            <Input
              value={feriadoMotivo}
              onChange={(e) => setFeriadoMotivo(e.target.value)}
              placeholder="Ex.: Independência do Brasil"
              className="h-11 rounded-md"
            />
          </div>
        </div>
        <Button
          onClick={() => criarFeriado.mutate()}
          disabled={!podeCriarFeriado}
          className="mt-5 h-11 w-full rounded-md bg-primary text-primary-foreground hover:bg-blue-700 sm:w-auto sm:px-6"
        >
          {criarFeriado.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Adicionar feriado
        </Button>
      </section>

      <section className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Próximos feriados
        </h3>
        {feriadosQ.isLoading ? (
          <div className="mt-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (feriadosQ.data?.length ?? 0) === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-card/50 py-12 text-center">
            <CalendarHeart className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 font-serif font-semibold text-2xl">Nenhum feriado cadastrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Todos os dias seguem o horário normal da semana.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {feriadosQ.data!.map((f: { id: string; data: string; motivo: string | null }) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{formatData(f.data)}</p>
                  {f.motivo && <p className="text-sm text-muted-foreground">{f.motivo}</p>}
                </div>
                <button
                  onClick={() => removerFeriado.mutate(f.id)}
                  className="flex h-11 w-11 xl:h-9 xl:w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remover feriado"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
