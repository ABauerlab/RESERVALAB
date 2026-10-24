import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Copy, Loader2, Mic2, Plus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/PageHeader";
import { AtracaoDialog } from "@/components/admin/atracoes/AtracaoDialog";
import { formatDataCurta, todayISO } from "@/lib/admin-dates";
import {
  agruparPorDia,
  faixaHorario,
  formatBRL,
  gradeDoMes,
  mesDe,
  mudarMes,
  primeiroDia,
  resumoDoMes,
  STATUS_LABEL,
  textoDoMes,
  tituloMes,
  ultimoDia,
  type Atracao,
  type StatusAtracao,
} from "@/lib/atracoes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$slug/admin/atracoes")({
  head: ({ params }) => ({
    meta: [{ title: "Atrações | Teggly" }, { name: "robots", content: "noindex" }],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  ssr: false,
  component: AtracoesPage,
});

const ESTILO_STATUS: Record<StatusAtracao, string> = {
  ideia: "border-border bg-muted text-muted-foreground",
  negociando: "border-warning-500/30 bg-warning-50 text-warning-700",
  confirmada: "border-success-500/30 bg-success-50 text-success-700",
  cancelada: "border-error-500/30 bg-error-50 text-error-700 line-through",
};

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function AtracoesPage() {
  const { slug } = useParams({ from: "/$slug/admin/atracoes" });
  const admin = useTenantAdmin(slug);
  const tenantId = admin.tenant?.id ?? null;
  const nomeCasa = admin.tenant?.nome ?? "";

  const hoje = todayISO();
  const [mes, setMes] = useState(mesDe(hoje));
  const [dialog, setDialog] = useState<{ atracao: Atracao | null; data: string } | null>(null);

  const atracoesQ = useQuery({
    enabled: !!tenantId,
    queryKey: ["atracoes", tenantId, mes],
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atracoes")
        .select("*")
        .eq("tenant_id", tenantId!)
        .gte("data", primeiroDia(mes))
        .lte("data", ultimoDia(mes))
        .order("data", { ascending: true });
      if (error) throw error;
      return data as Atracao[];
    },
  });

  const atracoes = useMemo(() => atracoesQ.data ?? [], [atracoesQ.data]);
  const porDia = useMemo(() => agruparPorDia(atracoes), [atracoes]);
  const resumo = useMemo(() => resumoDoMes(mes, atracoes), [mes, atracoes]);
  const grade = useMemo(() => gradeDoMes(mes), [mes]);
  const diasComAtracao = [...porDia.keys()];

  async function copiarParaWhatsApp() {
    try {
      await navigator.clipboard.writeText(textoDoMes(mes, atracoes, nomeCasa));
      toast.success("Agenda copiada. É só colar no WhatsApp.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  if (!admin.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const novaNoDia = (data: string) => setDialog({ atracao: null, data });
  const dataPadrao = mesDe(hoje) === mes ? hoje : primeiroDia(mes);

  return (
    <AdminShell slug={slug} tenantNome={nomeCasa} active="atracoes">
      <div className="mx-auto max-w-5xl px-5 pb-10 pt-6">
        <PageHeader
          title="Atrações"
          description="Programação do mês para a equipe e os donos alinharem quem toca em cada dia. Só vocês veem esta agenda."
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => void copiarParaWhatsApp()}
                disabled={atracoes.length === 0}
                className="h-11 rounded-md"
              >
                <Copy className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Copiar para WhatsApp</span>
                <span className="sm:hidden">Copiar</span>
              </Button>
              <Button
                onClick={() => novaNoDia(dataPadrao)}
                className="h-11 rounded-md bg-primary text-primary-foreground hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova atração
              </Button>
            </>
          }
        />

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMes(mudarMes(mes, -1))}
              aria-label="Mês anterior"
              className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMes(mudarMes(mes, 1))}
              aria-label="Próximo mês"
              className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h2 className="flex-1 text-lg font-extrabold tracking-tight">{tituloMes(mes)}</h2>
          {mes !== mesDe(hoje) && (
            <Button variant="ghost" onClick={() => setMes(mesDe(hoje))} className="h-11 rounded-md">
              Este mês
            </Button>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Indicador rotulo="Confirmadas" valor={String(resumo.confirmadas)} />
          <Indicador
            rotulo="Em aberto"
            valor={String(resumo.emAberto)}
            dica="Ideias e negociações"
          />
          <Indicador
            rotulo="Dias sem atração"
            valor={String(resumo.diasSemAtracao)}
            dica="No mês inteiro"
          />
          <Indicador
            rotulo="Cachê previsto"
            valor={formatBRL(resumo.cachePrevisto)}
            dica="Confirmadas e em negociação"
          />
        </dl>

        {atracoesQ.isLoading ? (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : atracoesQ.isError ? (
          <p className="mt-8 rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Não foi possível carregar a agenda. Tente recarregar a página.
          </p>
        ) : (
          <>
            {/* Calendário (tablet e desktop) */}
            <div className="mt-5 hidden overflow-hidden rounded-lg border border-border bg-card md:block">
              <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-center text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {DIAS_SEMANA.map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>
              {grade.map((semana) => (
                <div
                  key={semana[0]!.iso}
                  className="grid grid-cols-7 border-b border-border last:border-b-0"
                >
                  {semana.map((c) => {
                    const lista = c.doMes ? (porDia.get(c.iso) ?? []) : [];
                    const ehHoje = c.iso === hoje;
                    return (
                      <div
                        key={c.iso}
                        className={cn(
                          "group relative min-h-28 border-r border-border p-1.5 last:border-r-0",
                          !c.doMes && "bg-muted/30",
                        )}
                      >
                        {c.doMes && (
                          <>
                            <button
                              type="button"
                              onClick={() => novaNoDia(c.iso)}
                              aria-label={`Adicionar atração em ${formatDataCurta(c.iso)}`}
                              className="absolute inset-0 rounded-sm opacity-0 transition-opacity hover:bg-primary/5 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 group-hover:opacity-100"
                            />
                            <span
                              className={cn(
                                "relative inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold",
                                ehHoje
                                  ? "bg-primary text-primary-foreground"
                                  : c.iso < hoje
                                    ? "text-muted-foreground"
                                    : "text-foreground",
                              )}
                            >
                              {Number(c.iso.slice(8))}
                            </span>
                            <ul className="relative mt-1 space-y-1">
                              {lista.map((a) => (
                                <li key={a.id}>
                                  <button
                                    type="button"
                                    onClick={() => setDialog({ atracao: a, data: a.data })}
                                    title={`${STATUS_LABEL[a.status]}: ${a.titulo}`}
                                    className={cn(
                                      "block w-full truncate rounded border px-1.5 py-1 text-left text-xs font-medium",
                                      ESTILO_STATUS[a.status],
                                    )}
                                  >
                                    {a.horario_inicio && (
                                      <span className="mr-1 opacity-70">
                                        {a.horario_inicio.slice(0, 5)}
                                      </span>
                                    )}
                                    {a.titulo}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Lista (celular) */}
            <div className="mt-5 md:hidden">
              {diasComAtracao.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
                  Nenhuma atração neste mês ainda.
                </p>
              ) : (
                <ul className="space-y-4">
                  {diasComAtracao.map((dia) => (
                    <li key={dia}>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {formatDataCurta(dia)}
                        {dia === hoje && " · hoje"}
                      </h3>
                      <ul className="mt-2 space-y-2">
                        {porDia.get(dia)!.map((a) => (
                          <li key={a.id}>
                            <button
                              type="button"
                              onClick={() => setDialog({ atracao: a, data: a.data })}
                              className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left"
                            >
                              <div className="min-w-0 flex-1">
                                <p
                                  className={cn(
                                    "font-medium",
                                    a.status === "cancelada" && "line-through opacity-60",
                                  )}
                                >
                                  {a.titulo}
                                </p>
                                {faixaHorario(a) && (
                                  <p className="text-sm text-muted-foreground">{faixaHorario(a)}</p>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold no-underline",
                                  ESTILO_STATUS[a.status],
                                  a.status === "cancelada" && "line-through",
                                )}
                              >
                                {STATUS_LABEL[a.status]}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {atracoes.length === 0 && (
              <div className="mt-5 hidden rounded-lg border border-dashed border-border bg-card/50 py-10 text-center md:block">
                <Mic2 className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-3 font-serif text-xl font-semibold">Mês sem atrações</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Clique em um dia do calendário ou em &quot;Nova atração&quot; para começar.
                </p>
              </div>
            )}

            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {(Object.keys(STATUS_LABEL) as StatusAtracao[]).map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span className={cn("inline-block h-3 w-3 rounded border", ESTILO_STATUS[s])} />
                  {STATUS_LABEL[s]}
                </span>
              ))}
            </p>
          </>
        )}
      </div>

      {tenantId && (
        <AtracaoDialog
          open={dialog !== null}
          onClose={() => setDialog(null)}
          tenantId={tenantId}
          atracao={dialog?.atracao ?? null}
          dataInicial={dialog?.data ?? dataPadrao}
        />
      )}
    </AdminShell>
  );
}

function Indicador({ rotulo, valor, dica }: { rotulo: string; valor: string; dica?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3.5">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="mt-1 text-2xl font-extrabold tracking-tight">{valor}</dd>
      {dica && <p className="text-xs text-muted-foreground">{dica}</p>}
    </div>
  );
}
