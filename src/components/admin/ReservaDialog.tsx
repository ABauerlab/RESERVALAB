import { useEffect, useState } from "react";
import {
  Calendar, CalendarDays, Cake, Check, CheckCircle2, MessageCircle, Pencil, Phone, PartyPopper,
  BellRing, Save, Trash2, User, Utensils, X,
} from "lucide-react";
import { toast } from "sonner";

import {
  AREA_LABEL, MOTIVO_CANCELAMENTO_OPCOES, TIPO_LABEL, formatData, formatHorario, telefoneToWhatsApp,
  type Reserva, type ReservaStatus, type ReservaUpdate, type ReservaTipo,
} from "@/lib/reservations";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReservationStatus } from "./ReservationStatus";
import { CancelFields, DetailRow, EditFields, ActionBtn } from "./ReservaForms";

export function ReservaDialog({
  reserva, onClose, onConfirm, onConfirmSemNotificar, onReconfirm, onSetStatus, onSave, onCancel, onDelete, pending,
}: {
  reserva: Reserva | null;
  onClose: () => void;
  onConfirm: () => void;
  onConfirmSemNotificar: () => void;
  onReconfirm: () => void;
  onSetStatus: (s: ReservaStatus) => void;
  onSave: (patch: ReservaUpdate) => Promise<void>;
  onCancel: (motivo: string) => Promise<void>;
  onDelete: () => void;
  pending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState<string>(MOTIVO_CANCELAMENTO_OPCOES[0]);
  const [motivoDetalhe, setMotivoDetalhe] = useState("");
  const [form, setForm] = useState<ReservaUpdate>({});

  useEffect(() => {
    setEditing(false);
    setCancelando(false);
    setMotivo(MOTIVO_CANCELAMENTO_OPCOES[0]);
    setMotivoDetalhe("");
    setForm({});
  }, [reserva?.id]);

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

  function startRemarcar() {
    setCancelando(false);
    startEdit();
  }

  async function confirmarCancelamento() {
    const motivoFinal = motivo === "Outro" && motivoDetalhe.trim() ? motivoDetalhe.trim() : motivo;
    await onCancel(motivoFinal);
    setCancelando(false);
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
      <DialogContent className="max-w-md rounded-xl p-0 overflow-hidden">
        {r && (
          <>
            <DialogHeader className="border-b border-border/70 p-5 text-left">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div className="min-w-0">
                  <DialogTitle className="truncate font-serif font-semibold text-2xl tracking-tight">{r.nome}</DialogTitle>
                  <DialogDescription className="mt-1 text-[13px] text-muted-foreground">
                    {TIPO_LABEL[r.tipo as ReservaTipo]} · <span className="font-mono">{r.codigo_acompanhamento}</span>
                  </DialogDescription>
                </div>
                <ReservationStatus status={r.status} />
              </div>
            </DialogHeader>

            <div className="max-h-[55vh] overflow-y-auto p-5">
              {cancelando ? (
                <CancelFields
                  motivo={motivo}
                  setMotivo={setMotivo}
                  motivoDetalhe={motivoDetalhe}
                  setMotivoDetalhe={setMotivoDetalhe}
                  onRemarcar={startRemarcar}
                />
              ) : editing ? (
                <EditFields r={r} form={form} setForm={setForm} />
              ) : (
                <div className="space-y-3.5 text-sm">
                  <DetailRow icon={Phone} label="Telefone" value={r.telefone} link={`tel:${telefoneToWhatsApp(r.telefone)}`} />
                  {r.quantidade != null && <DetailRow icon={User} label="Pessoas" value={String(r.quantidade)} />}
                  {r.data && <DetailRow icon={CalendarDays} label="Data" value={formatData(r.data)} />}
                  {r.horario && <DetailRow icon={Calendar} label="Horário" value={formatHorario(r.horario)} />}
                  {r.area && <DetailRow icon={Utensils} label="Área" value={AREA_LABEL[r.area]} />}
                  {r.tipo_evento && <DetailRow icon={PartyPopper} label="Tipo do evento" value={r.tipo_evento} />}
                  {r.leva_bolo !== null && r.tipo === "aniversario" && (<DetailRow icon={Cake} label="Leva bolo" value={r.leva_bolo ? "Sim" : "Não"} />)}
                  {r.comandas !== null && r.tipo === "aniversario" && (<DetailRow icon={Check} label="Comandas individuais" value={r.comandas ? "Sim" : "Não"} />)}
                  {r.observacoes && (
                    <div className="rounded-lg bg-muted p-3.5">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Observações</p>
                      <p className="leading-relaxed text-foreground">{r.observacoes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-border/70 bg-muted/40 p-4 flex-col gap-2 sm:flex-col sm:space-x-0">
              {cancelando ? (
                <div className="grid w-full grid-cols-2 gap-2">
                  <ActionBtn onClick={() => setCancelando(false)} icon={X}>Voltar</ActionBtn>
                  <ActionBtn onClick={confirmarCancelamento} disabled={pending} variant="danger" icon={X}>Confirmar cancelamento</ActionBtn>
                </div>
              ) : editing ? (
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
                  {r.status !== "confirmada" && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={onConfirmSemNotificar}
                      className="flex w-full items-center justify-center gap-1.5 text-[12px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirmar sem avisar o cliente
                    </button>
                  )}
                  {r.status === "confirmada" && (
                    <div className="grid w-full grid-cols-1 gap-1.5">
                      <ActionBtn disabled={pending} onClick={onReconfirm} icon={BellRing}>Reconfirmar + WhatsApp</ActionBtn>
                      {r.reconfirmada_em && (
                        <p className="text-center text-xs text-muted-foreground">
                          Última reconfirmação enviada em {new Date(r.reconfirmada_em).toLocaleString("pt-BR")}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="grid w-full grid-cols-3 gap-2">
                    <ActionBtn disabled={pending || r.status === "finalizada"} onClick={() => onSetStatus("finalizada")} icon={CheckCircle2}>Finalizar</ActionBtn>
                    <ActionBtn disabled={pending || r.status === "cancelada"} onClick={() => setCancelando(true)} variant="danger" icon={X}>Cancelar</ActionBtn>
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
