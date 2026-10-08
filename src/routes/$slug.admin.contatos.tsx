import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Search, Users } from "lucide-react";

import { IconeWhatsApp } from "@/components/brand/BrandIcons";

import { supabase } from "@/integrations/supabase/client";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  agruparContatos,
  contatosToCsv,
  filtrarOrdenarContatos,
  type Contato,
  type OrdemContatos,
} from "@/lib/contatos";
import { addDaysISO, todayISO } from "@/lib/datetime";
import { STATUS_LABEL, type Reserva } from "@/lib/reservations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/$slug/admin/contatos")({
  head: ({ params }) => ({
    meta: [{ title: "Contatos | Teggly" }, { name: "robots", content: "noindex" }],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  ssr: false,
  component: ContatosPage,
});

const LIMITE = 5000;

type Preset = "todas" | "30" | "90" | "personalizado";

function ContatosPage() {
  const { slug } = useParams({ from: "/$slug/admin/contatos" });
  const admin = useTenantAdmin(slug);
  const tenantId = admin.tenant?.id ?? null;

  const [preset, setPreset] = useState<Preset>("todas");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<OrdemContatos>("recentes");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState(todayISO());

  const { de: deEfetivo, ate: ateEfetivo } = useMemo(() => {
    if (preset === "todas") return { de: "", ate: todayISO() };
    if (preset === "30" || preset === "90") {
      const dias = preset === "30" ? 30 : 90;
      return { de: addDaysISO(todayISO(), -dias), ate: todayISO() };
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
      const { data, error } = await q.order("data", { ascending: false }).limit(LIMITE);
      if (error) throw error;
      return data as Reserva[];
    },
  });

  const contatos = useMemo(() => agruparContatos(reservasQ.data ?? []), [reservasQ.data]);
  const visiveis = useMemo(
    () => filtrarOrdenarContatos(contatos, busca, ordem),
    [contatos, busca, ordem],
  );
  const truncado = (reservasQ.data?.length ?? 0) >= LIMITE;

  function baixarCsv() {
    const csv = contatosToCsv(visiveis);
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
      <div className="mx-auto max-w-4xl px-5 pb-10 pt-6">
        <PageHeader
          title="Clientes"
          description="Nome e telefone de quem já reservou, prontos para exportar e usar em remarketing."
        />

        <div className="mt-6 flex flex-wrap gap-1.5 animate-in-up">
          <PresetChip active={preset === "todas"} onClick={() => setPreset("todas")}>
            Todas até hoje
          </PresetChip>
          <PresetChip active={preset === "30"} onClick={() => setPreset("30")}>
            Últimos 30 dias
          </PresetChip>
          <PresetChip active={preset === "90"} onClick={() => setPreset("90")}>
            Últimos 90 dias
          </PresetChip>
          <PresetChip
            active={preset === "personalizado"}
            onClick={() => setPreset("personalizado")}
          >
            Período personalizado
          </PresetChip>
        </div>

        {preset === "personalizado" && (
          <div className="mt-3 grid grid-cols-2 gap-3 animate-in-up sm:max-w-sm">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">De</Label>
              <Input
                type="date"
                value={de}
                onChange={(e) => setDe(e.target.value)}
                className="h-11 rounded-md"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Até</Label>
              <Input
                type="date"
                value={ate}
                onChange={(e) => setAte(e.target.value)}
                className="h-11 rounded-md"
              />
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou telefone"
              aria-label="Buscar contato"
              className="h-11 rounded-md pl-9"
            />
          </div>
          <div className="flex gap-1.5" role="group" aria-label="Ordem">
            <PresetChip active={ordem === "recentes"} onClick={() => setOrdem("recentes")}>
              Recentes
            </PresetChip>
            <PresetChip active={ordem === "frequentes"} onClick={() => setOrdem("frequentes")}>
              Mais frequentes
            </PresetChip>
            <PresetChip active={ordem === "nome"} onClick={() => setOrdem("nome")}>
              A a Z
            </PresetChip>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cream text-terracotta">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <p className="text-2xl font-extrabold tabular-nums leading-none">{visiveis.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {busca.trim() ? "contatos encontrados" : "contatos únicos no período"}
              </p>
            </div>
          </div>
          <button
            onClick={baixarCsv}
            disabled={visiveis.length === 0}
            className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download className="h-4 w-4" /> Baixar CSV
          </button>
        </div>

        {truncado && (
          <p className="mt-3 text-xs text-muted-foreground">
            Mostrando as {LIMITE} reservas mais recentes do período.
          </p>
        )}

        <div className="mt-5">
          {reservasQ.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : reservasQ.isError ? (
            <div
              role="alert"
              className="rounded-xl border border-dashed border-border bg-card py-12 text-center"
            >
              <p className="text-lg font-semibold text-foreground">Não foi possível carregar</p>
              <p className="mt-1 text-sm text-muted-foreground">Tente novamente em instantes.</p>
              <button
                type="button"
                onClick={() => reservasQ.refetch()}
                className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : visiveis.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 py-14 text-center">
              <p className="text-lg font-semibold text-foreground">
                {busca.trim() ? "Nenhum contato encontrado" : "Nenhum contato"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {busca.trim()
                  ? "Tente outro nome ou telefone."
                  : "Ninguém reservou nesse período ainda."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <ul className="max-h-[520px] divide-y divide-border/60 overflow-y-auto sm:hidden">
                {visiveis.map((c) => (
                  <li key={c.telefoneWhatsapp} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words font-medium">{c.nome}</p>
                        <p className="text-sm text-muted-foreground">{c.telefone}</p>
                      </div>
                      <WhatsLink c={c} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.reservas} {c.reservas === 1 ? "reserva" : "reservas"} · última{" "}
                      {c.ultimaData
                        ? new Date(c.ultimaData + "T00:00:00").toLocaleDateString("pt-BR")
                        : "—"}{" "}
                      · {STATUS_LABEL[c.ultimoStatus]}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="hidden max-h-[520px] overflow-auto sm:block">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/70 backdrop-blur-sm">
                    <tr className="text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Nome</th>
                      <th className="px-4 py-2.5 font-medium">Telefone</th>
                      <th className="px-4 py-2.5 font-medium">Reservas</th>
                      <th className="px-4 py-2.5 font-medium">Última</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">
                        <span className="sr-only">Conversar</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.map((c) => (
                      <tr key={c.telefoneWhatsapp} className="border-t border-border/60">
                        <td className="px-4 py-2.5 font-medium">{c.nome}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{c.telefone}</td>
                        <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                          {c.reservas}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {c.ultimaData
                            ? new Date(c.ultimaData + "T00:00:00").toLocaleDateString("pt-BR")
                            : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {STATUS_LABEL[c.ultimoStatus]}
                        </td>
                        <td className="px-4 py-1.5 text-right">
                          <WhatsLink c={c} />
                        </td>
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

function WhatsLink({ c }: { c: Contato }) {
  return (
    <a
      href={`https://wa.me/${c.telefoneWhatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Conversar com ${c.nome} no WhatsApp`}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground xl:h-9 xl:w-9"
    >
      <IconeWhatsApp className="h-4 w-4" />
    </a>
  );
}

function PresetChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-11 xl:h-9 shrink-0 rounded-full px-4 text-xs font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
