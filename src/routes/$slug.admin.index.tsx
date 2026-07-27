import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell, Calendar, CalendarDays, Download, LogOut, PartyPopper, Search,
  Sparkles, User, Loader2, Check, X, CheckCircle2, Phone, Utensils, Heart, Cake,
  MessageCircle, Pencil, Trash2, Save,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  AREA_LABEL, STATUS_LABEL, STATUS_LIST, TIPO_LABEL, TIPO_SHORT,
  formatData, formatHorario, telefoneToWhatsApp,
  type Reserva, type ReservaArea, type ReservaStatus, type ReservaTipo, type ReservaUpdate,
} from "@/lib/reservations";
import { getTenantBySlug } from "@/lib/tenant";
import { buildMensagemConfirmacao, whatsappUrl } from "@/lib/confirmacao";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { AdminShell } from "@/components/admin/AdminShell";


import {
  canNotify, initInstallPrompt, isStandalone, notificationPermission,
  registerServiceWorker, requestNotificationPermission, showNotification,
  triggerInstallPrompt, pushSupported, subscribeToPush, unsubscribeFromPush,
  currentPushEndpoint,
} from "@/lib/pwa";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/$slug/admin/")({
  head: () => ({
    meta: [
      { title: "Painel — ReservaLab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: AdminDashboard,
});

type FiltroData = "hoje" | "amanha" | "semana" | "mes" | "todos";
const FILTROS_DATA: Array<{ id: FiltroData; label: string }> = [
  { id: "hoje", label: "Hoje" },
  { id: "amanha", label: "Amanhã" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "todos", label: "Todos" },
];

type FiltroStatus = "todos" | ReservaStatus;
const FILTROS_STATUS: Array<{ id: FiltroStatus; label: string }> = [
  { id: "todos", label: "Todos" },
  ...STATUS_LIST.map((s) => ({ id: s as FiltroStatus, label: STATUS_LABEL[s] })),
];

const TIPO_ICON = { mesa: Utensils, aniversario: Cake, evento: Sparkles, casamento: Heart } as const;

function todayISO() { return new Date().toISOString().slice(0, 10); }
function tomorrowISO() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }
function endOfWeekISO() { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); }
function endOfMonthISO() { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); }

function AdminDashboard() {
  const { slug } = useParams({ from: "/$slug/admin/" });
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Guarda única: sessão, vínculo com a empresa e troca de senha obrigatória.
  const admin = useTenantAdmin(slug);
  const ready = admin.ready;
  const tenantId = admin.tenant?.id ?? null;
  const tenantNome = admin.tenant?.nome ?? "";

  const [filtroData, setFiltroData] = useState<FiltroData>("hoje");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [busca, setBusca] = useState("");
  const [selected, setSelected] = useState<Reserva | null>(null);
  const [notifPerm, setNotifPerm] = useState<string>("default");
  const [installReady, setInstallReady] = useState(false);
  const [pushEndpoint, setPushEndpoint] = useState<string | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);


  useEffect(() => {
    registerServiceWorker();
    initInstallPrompt(() => setInstallReady(true));
    if (canNotify()) setNotifPerm(notificationPermission());
    currentPushEndpoint().then((ep) => setPushEndpoint(ep));
  }, []);

  useEffect(() => {
    if (!ready || !tenantId) return;
    const channel = supabase
      .channel(`reservas-admin-${tenantId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reservas", filter: `tenant_id=eq.${tenantId}` },
        (payload) => {
          const r = payload.new as Reserva;
          qc.invalidateQueries({ queryKey: ["reservas", tenantId] });
          qc.invalidateQueries({ queryKey: ["reservas-stats", tenantId] });
          const line = `${TIPO_SHORT[r.tipo]} • ${r.quantidade ?? "?"} pessoas • ${formatData(r.data)}${r.horario ? ` às ${formatHorario(r.horario)}` : ""}`;
          toast.success(`Nova reserva — ${r.nome}`, { description: line });
          showNotification(`Nova reserva — ${r.nome}`, line);
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "reservas", filter: `tenant_id=eq.${tenantId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["reservas", tenantId] });
          qc.invalidateQueries({ queryKey: ["reservas-stats", tenantId] });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ready, tenantId, qc]);

  const stats = useQuery({
    enabled: ready && !!tenantId,
    queryKey: ["reservas-stats", tenantId],
    queryFn: async () => {
      const base = () => supabase.from("reservas").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId!);
      const [hoje, pendentes, semana, eventos] = await Promise.all([
        base().eq("data", todayISO()),
        base().eq("status", "pendente"),
        base().gte("data", todayISO()).lte("data", endOfWeekISO()),
        base().in("tipo", ["evento", "casamento", "aniversario"]).gte("data", todayISO()),
      ]);
      return {
        hoje: hoje.count ?? 0,
        pendentes: pendentes.count ?? 0,
        semana: semana.count ?? 0,
        eventos: eventos.count ?? 0,
      };
    },
  });

  const listaQ = useQuery({
    enabled: ready && !!tenantId,
    queryKey: ["reservas", tenantId, filtroData, filtroStatus, busca],
    queryFn: async () => {
      let q = supabase.from("reservas").select("*").eq("tenant_id", tenantId!)
        .order("data", { ascending: true, nullsFirst: false })
        .order("horario", { ascending: true })
        .order("created_at", { ascending: false });

      if (filtroData === "hoje") q = q.eq("data", todayISO());
      else if (filtroData === "amanha") q = q.eq("data", tomorrowISO());
      else if (filtroData === "semana") q = q.gte("data", todayISO()).lte("data", endOfWeekISO());
      else if (filtroData === "mes") q = q.gte("data", todayISO()).lte("data", endOfMonthISO());

      if (filtroStatus !== "todos") q = q.eq("status", filtroStatus);

      const term = busca.trim();
      if (term) q = q.or(`nome.ilike.%${term}%,telefone.ilike.%${term}%,codigo_acompanhamento.ilike.%${term.toUpperCase()}%`);

      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data as Reserva[];
    },
  });

  const updateReserva = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ReservaUpdate }) => {
      const { error } = await supabase.from("reservas").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["reservas", tenantId] });
      qc.invalidateQueries({ queryKey: ["reservas-stats", tenantId] });
      setSelected((s) => (s && s.id === vars.id ? { ...s, ...vars.patch } as Reserva : s));
    },
    onError: () => toast.error("Não foi possível atualizar."),
  });

  const deleteReserva = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva excluída.");
      qc.invalidateQueries({ queryKey: ["reservas", tenantId] });
      qc.invalidateQueries({ queryKey: ["reservas-stats", tenantId] });
      setSelected(null);
    },
    onError: () => toast.error("Não foi possível excluir."),
  });

  async function handleConfirm(r: Reserva) {
    await updateReserva.mutateAsync({ id: r.id, patch: { status: "confirmada" } });
    toast.success("Reserva confirmada.");
    const tenant = await getTenantBySlug(slug);
    const numero = telefoneToWhatsApp(r.telefone);
    if (!numero) return;
    const msg = buildMensagemConfirmacao(tenant?.mensagem_confirmacao, {
      reserva: r,
      empresaNome: tenant?.nome ?? "",
      endereco: tenant?.endereco,
      telefoneEmpresa: tenant?.telefone_contato,
      linkAcompanhar: `${window.location.origin}/${slug}/acompanhar/${r.codigo_acompanhamento}`,
    });
    window.open(whatsappUrl(numero, msg), "_blank", "noopener");
  }


  async function handleEnablePush() {
    if (!tenantId) return;
    setPushBusy(true);
    try {
      const p = await requestNotificationPermission();
      setNotifPerm(p);
      if (p !== "granted") {
        if (p === "denied") toast.error("Permissão negada nas configurações do navegador.");
        return;
      }
      const sub = await subscribeToPush();
      if (!sub) { toast.error("Não foi possível ativar push neste dispositivo."); return; }
      const { data: sess } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
          { tenant_id: tenantId, user_id: sess.session?.user.id ?? null,
            endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          { onConflict: "endpoint" },
        );
      if (error) { toast.error("Falha ao registrar dispositivo: " + error.message); return; }
      setPushEndpoint(sub.endpoint);
      toast.success("Notificações push ativadas.");
    } finally { setPushBusy(false); }
  }

  async function handleDisablePush() {
    setPushBusy(true);
    try {
      const endpoint = pushEndpoint ?? (await currentPushEndpoint());
      const removed = await unsubscribeFromPush();
      const ep = endpoint ?? removed;
      if (ep) await supabase.from("push_subscriptions").delete().eq("endpoint", ep);
      setPushEndpoint(null);
      toast.success("Notificações push desativadas.");
    } finally { setPushBusy(false); }
  }

  async function handleInstall() {
    const r = await triggerInstallPrompt();
    if (r === "accepted") { toast.success("Aplicativo instalado."); setInstallReady(false); }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/$slug/admin/login", params: { slug } });
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const showInstall = installReady && !isStandalone();
  const canUsePush = pushSupported();
  const pushActive = !!pushEndpoint;
  const showPushCTA = canUsePush && !pushActive && notifPerm !== "unsupported";
  const showLegacyNotifCTA = !canUsePush && canNotify() && notifPerm !== "granted" && notifPerm !== "unsupported";

  return (
    <main className="min-h-screen bg-background pb-16 safe-top safe-bottom">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-terracotta">
              ReservaLab · {tenantNome}
            </p>
            <h1 className="truncate text-lg font-medium">Painel de reservas</h1>
          </div>
          <button onClick={signOut} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" aria-label="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 pt-6">
        {(showInstall || showPushCTA || showLegacyNotifCTA || pushActive) && (
          <div className="mb-5 flex flex-wrap gap-2 animate-fade">
            {showPushCTA && (
              <button disabled={pushBusy} onClick={handleEnablePush} className="inline-flex items-center gap-2 rounded-full border border-terracotta/30 bg-terracotta/5 px-3.5 py-1.5 text-xs font-medium text-terracotta transition-colors hover:bg-terracotta/10 disabled:opacity-50">
                <Bell className="h-3.5 w-3.5" /> {pushBusy ? "Ativando…" : "Ativar notificações push"}
              </button>
            )}
            {pushActive && (
              <button disabled={pushBusy} onClick={handleDisablePush} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent">
                <Bell className="h-3.5 w-3.5 text-terracotta" /> Push ativo — desativar
              </button>
            )}
            {showLegacyNotifCTA && (
              <button onClick={handleEnablePush} className="inline-flex items-center gap-2 rounded-full border border-terracotta/30 bg-terracotta/5 px-3.5 py-1.5 text-xs font-medium text-terracotta transition-colors hover:bg-terracotta/10">
                <Bell className="h-3.5 w-3.5" /> Ativar notificações
              </button>
            )}
            {showInstall && (
              <button onClick={handleInstall} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent">
                <Download className="h-3.5 w-3.5" /> Instalar aplicativo
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={CalendarDays} label="Hoje"          value={stats.data?.hoje}      loading={stats.isLoading} />
          <StatCard icon={Bell}         label="Pendentes"     value={stats.data?.pendentes} loading={stats.isLoading} accent />
          <StatCard icon={Calendar}     label="Próx. 7 dias"  value={stats.data?.semana}    loading={stats.isLoading} />
          <StatCard icon={PartyPopper}  label="Eventos"       value={stats.data?.eventos}   loading={stats.isLoading} />
        </div>

        <div className="mt-6 relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, telefone ou código…" className="h-11 rounded-xl pl-10" />
        </div>

        <div className="mt-4 -mx-5 overflow-x-auto px-5 pb-1 scrollbar-none">
          <div className="flex gap-1.5">
            {FILTROS_DATA.map((f) => (
              <FilterChip key={f.id} active={filtroData === f.id} onClick={() => setFiltroData(f.id)}>{f.label}</FilterChip>
            ))}
          </div>
        </div>

        <div className="mt-2 -mx-5 overflow-x-auto px-5 pb-1 scrollbar-none">
          <div className="flex gap-1.5">
            {FILTROS_STATUS.map((f) => (
              <FilterChip key={f.id} active={filtroStatus === f.id} onClick={() => setFiltroStatus(f.id)} variant="status">{f.label}</FilterChip>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {listaQ.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-[88px] w-full rounded-2xl" />))
          ) : listaQ.data && listaQ.data.length > 0 ? (
            listaQ.data.map((r, i) => (<ReservaCard key={r.id} r={r} onClick={() => setSelected(r)} delay={i * 30} />))
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      <ReservaDialog
        reserva={selected}
        onClose={() => setSelected(null)}
        onConfirm={() => selected && handleConfirm(selected)}
        onSetStatus={(status) => selected && updateReserva.mutate({ id: selected.id, patch: { status } })}
        onSave={(patch) => selected ? updateReserva.mutateAsync({ id: selected.id, patch }) : Promise.resolve()}
        onDelete={() => selected && deleteReserva.mutate(selected.id)}
        pending={updateReserva.isPending || deleteReserva.isPending}
      />

      <audio ref={audioRef} preload="auto" />
    </main>
  );
}

function FilterChip({ active, onClick, children, variant }: { active: boolean; onClick: () => void; children: React.ReactNode; variant?: "status" }) {
  const activeCls = variant === "status" ? "bg-terracotta/15 text-terracotta shadow-[var(--shadow-sm)]" : "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]";
  return (
    <button onClick={onClick} className={`h-9 shrink-0 rounded-full px-4 text-xs font-medium transition-all ${active ? activeCls : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
      {children}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, loading, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: number; loading?: boolean; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 transition-colors ${accent ? "bg-cream" : ""}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${accent ? "text-terracotta" : "text-muted-foreground"}`} />
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2.5 font-serif text-3xl tabular-nums text-foreground">
        {loading ? <span className="inline-block h-7 w-8 rounded shimmer" /> : (value ?? 0)}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: ReservaStatus }) {
  const styles: Record<ReservaStatus, string> = {
    pendente:   "bg-warning/15 text-[oklch(0.45_0.11_65)]",
    confirmada: "bg-success/15 text-[oklch(0.4_0.12_150)]",
    cancelada:  "bg-destructive/12 text-destructive",
    finalizada: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium ${styles[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function ReservaCard({ r, onClick, delay }: { r: Reserva; onClick: () => void; delay: number }) {
  const Icon = TIPO_ICON[r.tipo as ReservaTipo] ?? Utensils;
  return (
    <button onClick={onClick} style={{ animationDelay: `${delay}ms` }}
      className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-terracotta/40 hover:shadow-[var(--shadow-md)] active:scale-[0.995] animate-in-up">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream text-terracotta">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{r.nome}</p>
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
              {TIPO_SHORT[r.tipo as ReservaTipo]}
              {r.quantidade ? ` • ${r.quantidade} pessoas` : ""}
              {r.data ? ` • ${formatData(r.data)}` : ""}
              {r.horario ? ` às ${formatHorario(r.horario)}` : ""}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-mono text-muted-foreground/70">{r.codigo_acompanhamento}</p>
          </div>
        </div>
        <StatusPill status={r.status} />
      </div>
    </button>
  );
}

function ReservaDialog({
  reserva, onClose, onConfirm, onSetStatus, onSave, onDelete, pending,
}: {
  reserva: Reserva | null;
  onClose: () => void;
  onConfirm: () => void;
  onSetStatus: (s: ReservaStatus) => void;
  onSave: (patch: ReservaUpdate) => Promise<void>;
  onDelete: () => void;
  pending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ReservaUpdate>({});

  useEffect(() => { setEditing(false); setForm({}); }, [reserva?.id]);

  const r = reserva;

  function startEdit() {
    if (!r) return;
    setForm({
      nome: r.nome, telefone: r.telefone, quantidade: r.quantidade, data: r.data, horario: r.horario,
      area: r.area, tipo: r.tipo, tipo_evento: r.tipo_evento, observacoes: r.observacoes,
      leva_bolo: r.leva_bolo, comandas: r.comandas, status: r.status,
    });
    setEditing(true);
  }

  async function saveEdit() {
    if (!r) return;
    await onSave(form);
    toast.success("Reserva atualizada.");
    setEditing(false);
  }

  function confirmDelete() {
    if (!r) return;
    if (window.confirm(`Excluir a reserva de ${r.nome}? Esta ação não pode ser desfeita.`)) onDelete();
  }

  return (
    <Dialog open={!!r} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
        {r && (
          <>
            <DialogHeader className="border-b border-border/70 p-5 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <DialogTitle className="truncate font-serif text-2xl font-normal tracking-tight">{r.nome}</DialogTitle>
                  <DialogDescription className="mt-1 text-[13px] text-muted-foreground">
                    {TIPO_LABEL[r.tipo as ReservaTipo]} · <span className="font-mono">{r.codigo_acompanhamento}</span>
                  </DialogDescription>
                </div>
                <StatusPill status={r.status} />
              </div>
            </DialogHeader>

            <div className="max-h-[55vh] overflow-y-auto p-5">
              {editing ? (
                <EditFields r={r} form={form} setForm={setForm} />
              ) : (
                <div className="space-y-3.5 text-sm">
                  <DetailRow icon={Phone} label="Telefone" value={r.telefone} link={`tel:${telefoneToWhatsApp(r.telefone)}`} />
                  {r.quantidade != null && <DetailRow icon={User} label="Pessoas" value={String(r.quantidade)} />}
                  {r.data && <DetailRow icon={CalendarDays} label="Data" value={formatData(r.data)} />}
                  {r.horario && <DetailRow icon={Calendar} label="Horário" value={formatHorario(r.horario)} />}
                  {r.area && <DetailRow icon={Utensils} label="Área" value={AREA_LABEL[r.area]} />}
                  {r.tipo_evento && <DetailRow icon={Sparkles} label="Tipo do evento" value={r.tipo_evento} />}
                  {r.leva_bolo !== null && r.tipo === "aniversario" && (<DetailRow icon={Cake} label="Leva bolo" value={r.leva_bolo ? "Sim" : "Não"} />)}
                  {r.comandas !== null && r.tipo === "aniversario" && (<DetailRow icon={Check} label="Comandas individuais" value={r.comandas ? "Sim" : "Não"} />)}
                  {r.observacoes && (
                    <div className="rounded-xl bg-muted p-3.5">
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Observações</p>
                      <p className="leading-relaxed text-foreground">{r.observacoes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-border/70 bg-muted/40 p-4 flex-col gap-2 sm:flex-col sm:space-x-0">
              {editing ? (
                <div className="grid w-full grid-cols-2 gap-2">
                  <ActionBtn onClick={() => setEditing(false)} icon={X}>Cancelar</ActionBtn>
                  <ActionBtn onClick={saveEdit} disabled={pending} variant="primary" icon={Save}>Salvar</ActionBtn>
                </div>
              ) : (
                <>
                  <div className="grid w-full grid-cols-2 gap-2">
                    <ActionBtn disabled={pending || r.status === "confirmada"} onClick={onConfirm} variant="primary" icon={MessageCircle}>Confirmar + WhatsApp</ActionBtn>
                    <ActionBtn onClick={startEdit} icon={Pencil}>Editar</ActionBtn>
                  </div>
                  <div className="grid w-full grid-cols-3 gap-2">
                    <ActionBtn disabled={pending || r.status === "finalizada"} onClick={() => onSetStatus("finalizada")} icon={CheckCircle2}>Finalizar</ActionBtn>
                    <ActionBtn disabled={pending || r.status === "cancelada"} onClick={() => onSetStatus("cancelada")} variant="danger" icon={X}>Cancelar</ActionBtn>
                    <ActionBtn disabled={pending} onClick={confirmDelete} variant="danger" icon={Trash2}>Excluir</ActionBtn>
                  </div>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditFields({ r, form, setForm }: { r: Reserva; form: ReservaUpdate; setForm: (f: ReservaUpdate) => void }) {
  function set<K extends keyof ReservaUpdate>(key: K, value: ReservaUpdate[K]) { setForm({ ...form, [key]: value }); }
  return (
    <div className="space-y-4 text-sm">
      <FieldRow label="Nome"><Input value={form.nome ?? ""} onChange={(e) => set("nome", e.target.value)} className="h-10 rounded-lg" /></FieldRow>
      <FieldRow label="Telefone"><Input value={form.telefone ?? ""} onChange={(e) => set("telefone", e.target.value)} className="h-10 rounded-lg" /></FieldRow>
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Data"><Input type="date" value={form.data ?? ""} onChange={(e) => set("data", e.target.value || null)} className="h-10 rounded-lg" /></FieldRow>
        <FieldRow label="Horário"><Input type="time" value={form.horario ?? ""} onChange={(e) => set("horario", e.target.value || null)} className="h-10 rounded-lg" /></FieldRow>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Quantidade"><Input type="number" min={1} value={form.quantidade ?? ""} onChange={(e) => set("quantidade", e.target.value ? parseInt(e.target.value, 10) : null)} className="h-10 rounded-lg" /></FieldRow>
        <FieldRow label="Status">
          <Select value={form.status ?? r.status} onValueChange={(v) => set("status", v as ReservaStatus)}>
            <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
          </Select>
        </FieldRow>
      </div>
      <FieldRow label="Tipo">
        <Select value={form.tipo ?? r.tipo} onValueChange={(v) => set("tipo", v as ReservaTipo)}>
          <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mesa">Mesa</SelectItem>
            <SelectItem value="aniversario">Aniversário</SelectItem>
            <SelectItem value="evento">Evento</SelectItem>
            <SelectItem value="casamento">Casamento</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      {(form.tipo ?? r.tipo) === "mesa" && (
        <FieldRow label="Área">
          <Select value={form.area ?? "sem_preferencia"} onValueChange={(v) => set("area", v as ReservaArea)}>
            <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="interna">Interna</SelectItem>
              <SelectItem value="externa">Externa</SelectItem>
              <SelectItem value="sem_preferencia">Sem preferência</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      )}
      {(form.tipo ?? r.tipo) === "evento" && (
        <FieldRow label="Tipo do evento"><Input value={form.tipo_evento ?? ""} onChange={(e) => set("tipo_evento", e.target.value)} className="h-10 rounded-lg" /></FieldRow>
      )}
      <FieldRow label="Observações"><Textarea value={form.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} className="min-h-20 rounded-lg" /></FieldRow>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, link }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; link?: string }) {
  const content = <span className="font-medium text-foreground">{value}</span>;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[13px]">{label}</span>
      </div>
      {link ? <a href={link} className="text-right underline-offset-2 hover:underline">{content}</a> : content}
    </div>
  );
}

function ActionBtn({ children, onClick, disabled, variant, icon: Icon }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; variant?: "primary" | "danger"; icon: React.ComponentType<{ className?: string }>; }) {
  const base = "flex h-11 items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";
  const styles = variant === "primary" ? "bg-primary text-primary-foreground hover:bg-primary/90"
    : variant === "danger" ? "bg-background text-destructive border border-border hover:bg-destructive/5"
    : "bg-background text-foreground border border-border hover:bg-accent";
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      <Icon className="h-3.5 w-3.5" />{children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 py-14 text-center animate-fade">
      <p className="font-serif text-2xl text-foreground">Nenhuma reserva</p>
      <p className="mt-1 text-sm text-muted-foreground">Nada por aqui neste filtro.</p>
    </div>
  );
}
