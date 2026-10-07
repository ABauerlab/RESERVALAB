import { useEffect, useState } from "react";
import {
  Calendar, CalendarDays, Cake, Check, MoreHorizontal, Phone, PartyPopper, User, Utensils, X,
  Pencil, Trash2, CheckCircle2, BellRing, MessageCircle, RotateCcw, Save, Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  AREA_LABEL, MOTIVO_CANCELAMENTO_OPCOES, TIPO_LABEL, formatData, formatHorario, telefoneToWhatsApp,
  type Reserva, type ReservaStatus, type ReservaTipo, type ReservaUpdate,
} from "@/lib/reservations";
import { detailActions, type DetailAction } from "@/lib/reservation-actions";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BottomSheet } from "./BottomSheet";
import { CancelFields, DetailRow, EditFields } from "./ReservaForms";
import { ReservationStatus } from "./ReservationStatus";
import { SidePanel } from "./SidePanel";

const LABEL: Record<DetailAction, string> = {
  confirmar: "Confirmar e avisar no WhatsApp",
  confirmar_sem_avisar: "Confirmar sem avisar",
  reconfirmar: "Reconfirmar no WhatsApp",
  finalizar: "Finalizar",
  editar: "Editar",
  cancelar: "Cancelar reserva",
  reativar: "Reativar",
  reabrir: "Reabrir",
  excluir: "Excluir",
};
const ICON: Record<DetailAction, React.ComponentType<{ className?: string }>> = {
  confirmar: MessageCircle, confirmar_sem_avisar: CheckCircle2, reconfirmar: BellRing, finalizar: CheckCircle2,
  editar: Pencil, cancelar: X, reativar: RotateCcw, reabrir: RotateCcw, excluir: Trash2,
};

/**
 * Detalhe da reserva. Desktop: SidePanel (a lista continua visível). Mobile: tela cheia
 * com a ação principal fixa na base. Ações: as mesmas já existentes, organizadas por status.
 */
export function ReservaDetail({
  reserva, onClose, onConfirm, onConfirmSemNotificar, onReconfirm, onSetStatus, onSave, onCancel, onDelete, pending,
}: {
  reserva: Reserva | null;
  onClose: () => void;
  onConfirm: () => unknown;
  onConfirmSemNotificar: () => unknown;
  onReconfirm: () => unknown;
  onSetStatus: (s: ReservaStatus) => void;
  onSave: (patch: ReservaUpdate) => Promise<void>;
  onCancel: (motivo: string) => Promise<void>;
  onDelete: () => void;
  pending: boolean;
}) {
  const desktop = useIsDesktop();
  const [editing, setEditing] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [motivo, setMotivo] = useState<string>(MOTIVO_CANCELAMENTO_OPCOES[0]);
  const [motivoDetalhe, setMotivoDetalhe] = useState("");
  const [form, setForm] = useState<ReservaUpdate>({});

  useEffect(() => {
    setEditing(false);
    setCancelando(false);
    setMoreOpen(false);
    setMotivo(MOTIVO_CANCELAMENTO_OPCOES[0]);
    setMotivoDetalhe("");
    setForm({});
  }, [reserva?.id]);

  const r = reserva;
  if (!r) return <SidePanel open={false} onClose={onClose} title="">{null}</SidePanel>;

  function startEdit() {
    if (!r) return;
    setForm({
      nome: r.nome, telefone: r.telefone, quantidade: r.quantidade, data: r.data, horario: r.horario,
      area: r.area, tipo: r.tipo, tipo_evento: r.tipo_evento, observacoes: r.observacoes,
      leva_bolo: r.leva_bolo, comandas: r.comandas, status: r.status,
    });
    setCancelando(false);
    setEditing(true);
  }

  async function confirmarCancelamento() {
    const motivoFinal = motivo === "Outro" && motivoDetalhe.trim() ? motivoDetalhe.trim() : motivo;
    await onCancel(motivoFinal);
    setCancelando(false);
  }

  async function saveEdit() {
    await onSave(form);
    toast.success("Reserva atualizada.");
    setEditing(false);
  }

  function run(a: DetailAction) {
    if (!r) return;
    setMoreOpen(false);
    switch (a) {
      case "confirmar": return void onConfirm();
      case "confirmar_sem_avisar": return void onConfirmSemNotificar();
      case "reconfirmar": return void onReconfirm();
      case "finalizar": return onSetStatus("finalizada");
      case "reativar":
      case "reabrir": return onSetStatus("pendente");
      case "editar": return startEdit();
      case "cancelar": return setCancelando(true);
      case "excluir":
        if (window.confirm(`Excluir a reserva de ${r.nome}? Esta ação não pode ser desfeita.`)) onDelete();
    }
  }

  const { primary, more } = detailActions(r);
  const normal = more.filter((a) => a !== "excluir");
  const hasDelete = more.includes("excluir");

  const moreTrigger = (
    <button
      type="button"
      aria-label="Mais ações"
      aria-haspopup="menu"
      disabled={pending}
      onClick={desktop ? undefined : () => setMoreOpen(true)}
      className={cn(
        "flex h-12 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50",
        primary ? "w-12" : "w-full",
      )}
    >
      <MoreHorizontal className="h-5 w-5" />
      {!primary && "Mais ações"}
    </button>
  );

  const PrimaryIcon = primary ? ICON[primary] : null;
  const footer = cancelando ? (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => setCancelando(false)} className="flex h-12 items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-semibold hover:bg-muted">Voltar</button>
      <button type="button" disabled={pending} onClick={confirmarCancelamento} className="flex h-12 items-center justify-center gap-2 rounded-md bg-destructive text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">Confirmar cancelamento</button>
    </div>
  ) : editing ? (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => setEditing(false)} className="flex h-12 items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-semibold hover:bg-muted">Cancelar edição</button>
      <button type="button" disabled={pending} onClick={saveEdit} className="flex h-12 items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow-blue hover:bg-blue-700 disabled:opacity-50"><Save className="h-4 w-4" />Salvar</button>
    </div>
  ) : (
    <div className="flex gap-2">
      {primary && PrimaryIcon && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(primary)}
          className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 text-[15px] font-semibold text-primary-foreground shadow-blue transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PrimaryIcon className="h-4 w-4 shrink-0" />}
          <span className="truncate">{LABEL[primary]}</span>
        </button>
      )}
      {desktop ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{moreTrigger}</DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {normal.map((a) => {
              const Icon = ICON[a];
              return <DropdownMenuItem key={a} onSelect={() => run(a)} className="h-10 gap-2"><Icon className="h-4 w-4" />{LABEL[a]}</DropdownMenuItem>;
            })}
            {hasDelete && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => run("excluir")} className="h-10 gap-2 text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" />Excluir</DropdownMenuItem></>}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : moreTrigger}
    </div>
  );

  return (
    <>
      <SidePanel
        open
        onClose={onClose}
        title={r.nome}
        subtitle={<>{TIPO_LABEL[r.tipo as ReservaTipo]} · <span className="font-mono">{r.codigo_acompanhamento}</span></>}
        footer={footer}
      >
        {cancelando ? (
          <CancelFields motivo={motivo} setMotivo={setMotivo} motivoDetalhe={motivoDetalhe} setMotivoDetalhe={setMotivoDetalhe} onRemarcar={startEdit} />
        ) : editing ? (
          <EditFields r={r} form={form} setForm={setForm} />
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <ReservationStatus status={r.status} />
              {r.status === "confirmada" && (
                <span className="text-xs text-muted-foreground">{r.reconfirmada_em ? "Reconfirmada" : "Aguardando reconfirmação"}</span>
              )}
            </div>
            <div className="space-y-3.5">
              <DetailRow icon={Phone} label="Telefone" value={r.telefone} link={`tel:${telefoneToWhatsApp(r.telefone)}`} />
              {r.quantidade != null && <DetailRow icon={User} label="Pessoas" value={String(r.quantidade)} />}
              {r.data && <DetailRow icon={CalendarDays} label="Data" value={formatData(r.data)} />}
              {r.horario && <DetailRow icon={Calendar} label="Horário" value={formatHorario(r.horario)} />}
              {r.area && <DetailRow icon={Utensils} label="Área" value={AREA_LABEL[r.area]} />}
              {r.tipo_evento && <DetailRow icon={PartyPopper} label="Tipo do evento" value={r.tipo_evento} />}
              {r.leva_bolo !== null && r.tipo === "aniversario" && <DetailRow icon={Cake} label="Leva bolo" value={r.leva_bolo ? "Sim" : "Não"} />}
              {r.comandas !== null && r.tipo === "aniversario" && <DetailRow icon={Check} label="Comandas individuais" value={r.comandas ? "Sim" : "Não"} />}
            </div>
            {r.observacoes && (
              <div className="rounded-lg bg-muted p-3.5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Observações</p>
                <p className="leading-relaxed text-foreground">{r.observacoes}</p>
              </div>
            )}
            {r.status === "confirmada" && r.reconfirmada_em && (
              <p className="text-xs text-muted-foreground">
                Última reconfirmação enviada em {new Date(r.reconfirmada_em).toLocaleString("pt-BR")}
              </p>
            )}
            {r.status === "cancelada" && r.motivo_cancelamento && (
              <p className="text-xs text-muted-foreground">Motivo do cancelamento: {r.motivo_cancelamento}</p>
            )}
          </div>
        )}
      </SidePanel>

      {!desktop && (
        <BottomSheet open={moreOpen} onOpenChange={setMoreOpen} title="Mais ações" className="z-[60]">
          <ul className="space-y-1 pb-2">
            {normal.map((a) => {
              const Icon = ICON[a];
              return (
                <li key={a}>
                  <button type="button" onClick={() => run(a)} className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-[15px] font-medium hover:bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />{LABEL[a]}
                  </button>
                </li>
              );
            })}
            {hasDelete && (
              <li className="mt-2 border-t border-border pt-2">
                <button type="button" onClick={() => run("excluir")} className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-[15px] font-medium text-destructive hover:bg-destructive/5">
                  <Trash2 className="h-5 w-5" />Excluir
                </button>
              </li>
            )}
          </ul>
        </BottomSheet>
      )}
    </>
  );
}

