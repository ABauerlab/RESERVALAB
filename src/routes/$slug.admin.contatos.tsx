import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { agruparContatos, contatosToCsv } from "@/lib/contatos";
import { STATUS_LABEL, type Reserva } from "@/lib/reservations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/$slug/admin/contatos")({
  head: ({ params }) => ({
    meta: [
      { title: "Contatos — ReservaLab" },
      { name: "robots", content: "noindex" },
    ],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  ssr: false,
  component: ContatosPage,
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type Preset = "todas" | "30" | "90" | "personalizado";

function ContatosPage() {
  const { slug } = useParams({ from: "/$slug/admin/contatos" });
  const admin = useTenantAdmin(slug);
  const tenantId = admin.tenant?.id ?? null;

  const [preset, setPreset] = useState<Preset>("todas");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState(todayISO());

  const { de: deEfetivo, ate: ateEfetivo } = useMemo(() => {
    if (preset === "todas") return { de: "", ate: todayISO() };
    if (preset === "30" || preset === "90") {
      const dias = preset === "30" ? 30 : 90;
      const d = new Date();
      d.setDate(d.getDate() - dias);
      return { de: d.toISOString().slice(0, 10), ate: todayISO() };
    }
    return { de, ate: ate || todayISO() };
  }, [preset, de, ate]);

  const reservasQ = useQuery({
    enabled: !!tenantId,
    queryKey: ["contatos-reservas", tenantId, deEfetivo, ateEfetivo],
    queryFn: async () => {
      let q = supabase
        .from("reservas")
        .select("*")
        .eq("tenant_id", tenantId!)
        .lte("data", ateEfetivo);
      if (deEfetivo) q = q.gte("data", deEfetivo);
      const { data, error } = await q.order("data", { ascending: false }).limit(5000);
      if (error) throw error;
      return data as Reserva[];
    },
  });

  const contatos = useMemo(() => agruparContatos(reservasQ.data ?? []), [reservasQ.data]);

  function baixarCsv() {
    const csv = contatosToCsv(contatos);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const periodo = deEfetivo ? `${deEfetivo}_a_${ateEfetivo}` : `ate_${ateEfetivo}`;
    a.href = url;
    a.download = `contatos-${slug}-${periodo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (!admin.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AdminShell slug={slug} tenantNome={admin.tenant?.nome ?? ""} active="contatos">
      <div className="mx-auto max-w-4xl px-5 pt-6">
        <header className="animate-fade">
          <h2 className="font-serif text-3xl tracking-tight">Contatos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nome e telefone de quem já reservou, prontos para exportar e usar em remarketing.
          </p>
        </header>

        <div className="mt-6 flex flex-wrap gap-1.5 animate-in-up">
          <PresetChip active={preset === "todas"} onClick={() => setPreset("todas")}>Todas até hoje</PresetChip>
          <PresetChip active={preset === "30"} onClick={() => setPreset("30")}>Últimos 30 dias</PresetChip>
          <PresetChip active={preset === "90"} onClick={() => setPreset("90")}>Últimos 90 dias</PresetChip>
          <PresetChip active={preset === "personalizado"} onClick={() => setPreset("personalizado")}>Período personalizado</PresetChip>
        </div>

        {preset === "personalizado" && (
          <div className="mt-3 grid grid-cols-2 gap-3 animate-in-up sm:max-w-sm">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">De</Label>
              <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="h-10 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Até</Label>
              <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="h-10 rounded-lg" />
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-terracotta">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <p className="font-serif text-2xl tabular-nums leading-none">{contatos.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">contatos únicos no período</p>
            </div>
          </div>
          <button
            onClick={baixarCsv}
            disabled={contatos.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download className="h-4 w-4" /> Baixar CSV
          </button>
        </div>

        <div className="mt-5">
          {reservasQ.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : contatos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 py-14 text-center">
              <p className="font-serif text-2xl text-foreground">Nenhum contato</p>
              <p className="mt-1 text-sm text-muted-foreground">Ninguém reservou nesse período ainda.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="max-h-[520px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/70 backdrop-blur-sm">
                    <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Nome</th>
                      <th className="px-4 py-2.5 font-medium">Telefone</th>
                      <th className="px-4 py-2.5 font-medium">Reservas</th>
                      <th className="px-4 py-2.5 font-medium">Última</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contatos.map((c) => (
                      <tr key={c.telefoneWhatsapp} className="border-t border-border/60">
                        <td className="px-4 py-2.5 font-medium">{c.nome}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{c.telefone}</td>
                        <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{c.reservas}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {c.ultimaData
                            ? new Date(c.ultimaData + "T00:00:00").toLocaleDateString("pt-BR")
                            : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{STATUS_LABEL[c.ultimoStatus]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function PresetChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full px-4 text-xs font-medium transition-all ${
        active ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]" : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
