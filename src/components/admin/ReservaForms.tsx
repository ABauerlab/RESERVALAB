import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MOTIVO_CANCELAMENTO_OPCOES,
  STATUS_LABEL,
  STATUS_LIST,
  type Reserva,
  type ReservaArea,
  type ReservaStatus,
  type ReservaTipo,
  type ReservaUpdate,
} from "@/lib/reservations";

export function EditFields({
  r,
  form,
  setForm,
}: {
  r: Reserva;
  form: ReservaUpdate;
  setForm: (f: ReservaUpdate) => void;
}) {
  function set<K extends keyof ReservaUpdate>(key: K, value: ReservaUpdate[K]) {
    setForm({ ...form, [key]: value });
  }
  return (
    <div className="space-y-4 text-sm">
      <FieldRow label="Nome">
        <Input
          value={form.nome ?? ""}
          onChange={(e) => set("nome", e.target.value)}
          className="h-11 rounded-md"
        />
      </FieldRow>
      <FieldRow label="Telefone">
        <Input
          value={form.telefone ?? ""}
          onChange={(e) => set("telefone", e.target.value)}
          className="h-11 rounded-md"
        />
      </FieldRow>
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Data">
          <Input
            type="date"
            value={form.data ?? ""}
            onChange={(e) => set("data", e.target.value || null)}
            className="h-11 rounded-md"
          />
        </FieldRow>
        <FieldRow label="Horário">
          <Input
            type="time"
            value={form.horario ?? ""}
            onChange={(e) => set("horario", e.target.value || null)}
            className="h-11 rounded-md"
          />
        </FieldRow>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Quantidade">
          <Input
            type="number"
            min={1}
            value={form.quantidade ?? ""}
            onChange={(e) =>
              set("quantidade", e.target.value ? parseInt(e.target.value, 10) : null)
            }
            className="h-11 rounded-md"
          />
        </FieldRow>
        <FieldRow label="Status">
          <Select
            value={form.status ?? r.status}
            onValueChange={(v) => set("status", v as ReservaStatus)}
          >
            <SelectTrigger className="h-11 rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_LIST.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
      <FieldRow label="Tipo">
        <Select value={form.tipo ?? r.tipo} onValueChange={(v) => set("tipo", v as ReservaTipo)}>
          <SelectTrigger className="h-11 rounded-md">
            <SelectValue />
          </SelectTrigger>
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
          <Select
            value={form.area ?? "sem_preferencia"}
            onValueChange={(v) => set("area", v as ReservaArea)}
          >
            <SelectTrigger className="h-11 rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="salao">Salão</SelectItem>
              <SelectItem value="fundos">Fundos</SelectItem>
              <SelectItem value="corredor">Corredor</SelectItem>
              <SelectItem value="varanda">Varanda</SelectItem>
              <SelectItem value="sem_preferencia">Sem preferência</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      )}
      {(form.tipo ?? r.tipo) === "evento" && (
        <FieldRow label="Tipo do evento">
          <Input
            value={form.tipo_evento ?? ""}
            onChange={(e) => set("tipo_evento", e.target.value)}
            className="h-11 rounded-md"
          />
        </FieldRow>
      )}
      <FieldRow label="Observações">
        <Textarea
          value={form.observacoes ?? ""}
          onChange={(e) => set("observacoes", e.target.value)}
          className="min-h-20 rounded-md"
        />
      </FieldRow>
    </div>
  );
}

export function CancelFields({
  motivo,
  setMotivo,
  motivoDetalhe,
  setMotivoDetalhe,
  onRemarcar,
}: {
  motivo: string;
  setMotivo: (v: string) => void;
  motivoDetalhe: string;
  setMotivoDetalhe: (v: string) => void;
  onRemarcar: () => void;
}) {
  return (
    <div className="space-y-4 text-sm">
      <button
        onClick={onRemarcar}
        className="w-full rounded-lg border border-terracotta/30 bg-terracotta/5 p-4 text-left transition-colors hover:bg-terracotta/10"
      >
        <p className="font-medium text-terracotta">Remarcar em vez de cancelar</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Altere a data ou o horário e mantenha a reserva — o cliente não precisa fazer tudo de
          novo.
        </p>
      </button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> ou cancele mesmo assim{" "}
        <div className="h-px flex-1 bg-border" />
      </div>

      <FieldRow label="Motivo do cancelamento">
        <Select value={motivo} onValueChange={setMotivo}>
          <SelectTrigger className="h-11 rounded-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOTIVO_CANCELAMENTO_OPCOES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>

      {motivo === "Outro" && (
        <FieldRow label="Detalhe">
          <Textarea
            value={motivoDetalhe}
            onChange={(e) => setMotivoDetalhe(e.target.value)}
            placeholder="Descreva o motivo…"
            className="min-h-20 rounded-md"
          />
        </FieldRow>
      )}

      <p className="text-xs text-muted-foreground">
        Ao confirmar, o cliente recebe um aviso no WhatsApp com o motivo e um link para fazer uma
        nova reserva quando quiser.
      </p>
    </div>
  );
}

export function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function DetailRow({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  link?: string;
}) {
  const content = <span className="font-medium text-foreground">{value}</span>;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[13px]">{label}</span>
      </div>
      {link ? (
        <a
          href={link}
          className="inline-flex min-h-11 items-center text-right underline-offset-2 hover:underline"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

export function ActionBtn({
  children,
  onClick,
  disabled,
  variant,
  icon: Icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "danger";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const base =
    "flex h-11 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-blue-700"
      : variant === "danger"
        ? "bg-background text-destructive border border-border hover:bg-destructive/5"
        : "bg-background text-foreground border border-border hover:bg-accent";
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
