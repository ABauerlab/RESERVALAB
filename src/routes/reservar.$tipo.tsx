import { createFileRoute, Link, useNavigate, useParams, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  TIPO_LABEL,
  formatTelefone,
  type ReservaArea,
  type ReservaInsert,
  type ReservaTipo,
} from "@/lib/reservations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const TIPOS_VALIDOS: ReservaTipo[] = ["mesa", "aniversario", "evento", "casamento"];

export const Route = createFileRoute("/reservar/$tipo")({
  head: ({ params }) => ({
    meta: [
      { title: `${TIPO_LABEL[params.tipo as ReservaTipo] ?? "Reserva"} — Iracema` },
      { name: "description", content: "Envie sua solicitação de reserva em poucos toques." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: ({ params }) => {
    if (!TIPOS_VALIDOS.includes(params.tipo as ReservaTipo)) throw notFound();
  },
  component: ReservarPage,
});

function ReservarPage() {
  const { tipo } = useParams({ from: "/reservar/$tipo" }) as { tipo: ReservaTipo };
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [quantidade, setQuantidade] = useState(2);
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [area, setArea] = useState<ReservaArea>("sem_preferencia");
  const [levaBolo, setLevaBolo] = useState<"sim" | "nao">("sim");
  const [comandas, setComandas] = useState<"sim" | "nao">("nao");
  const [tipoEvento, setTipoEvento] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [enviando, setEnviando] = useState(false);

  const isMesa = tipo === "mesa";
  const isAniv = tipo === "aniversario";
  const isEvento = tipo === "evento";
  const isCasa = tipo === "casamento";
  const precisaHorario = isMesa || isAniv;

  const hoje = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const podeEnviar =
    nome.trim().length >= 2 &&
    telefone.replace(/\D/g, "").length >= 10 &&
    quantidade > 0 &&
    data &&
    (!precisaHorario || horario) &&
    (!isEvento || tipoEvento.trim().length > 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEnviar || enviando) return;

    setEnviando(true);
    const payload: ReservaInsert = {
      tipo,
      nome: nome.trim(),
      telefone: telefone.trim(),
      quantidade,
      data,
      horario: precisaHorario && horario ? horario : null,
      area: isMesa ? area : null,
      leva_bolo: isAniv ? levaBolo === "sim" : null,
      comandas: isAniv ? comandas === "sim" : null,
      tipo_evento: isEvento ? tipoEvento.trim() : null,
      observacoes:
        isEvento || isCasa
          ? mensagem.trim() || null
          : observacoes.trim() || null,
      status: "pendente",
    };

    const { error } = await supabase.from("reservas").insert(payload);
    setEnviando(false);

    if (error) {
      toast.error("Não foi possível enviar sua reserva. Tente novamente.");
      return;
    }
    navigate({ to: "/obrigado" });
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-5 pt-6 pb-24 safe-top safe-bottom">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Link>

        <header className="mt-6 animate-fade">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-terracotta">
            Iracema
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
            {TIPO_LABEL[tipo]}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Preencha e nossa equipe confirmará em seguida.
          </p>
        </header>

        <form onSubmit={onSubmit} className="mt-8 space-y-5 animate-in-up">
          <Field label="Nome">
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              autoComplete="name"
              className="h-12 rounded-xl"
              required
            />
          </Field>

          <Field label="Telefone / WhatsApp">
            <Input
              value={telefone}
              onChange={(e) => setTelefone(formatTelefone(e.target.value))}
              placeholder="(11) 91234-5678"
              inputMode="tel"
              autoComplete="tel"
              className="h-12 rounded-xl"
              required
            />
          </Field>

          <Field label={isEvento || isCasa ? "Quantidade prevista" : "Quantidade de pessoas"}>
            <Stepper value={quantidade} onChange={setQuantidade} min={1} max={500} />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Data">
              <Input
                type="date"
                min={hoje}
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-12 rounded-xl"
                required
              />
            </Field>

            {precisaHorario && (
              <Field label="Horário">
                <Input
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="h-12 rounded-xl"
                  required
                />
              </Field>
            )}
          </div>

          {isMesa && (
            <Field label="Área desejada">
              <Select value={area} onValueChange={(v) => setArea(v as ReservaArea)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interna">Interna</SelectItem>
                  <SelectItem value="externa">Externa</SelectItem>
                  <SelectItem value="sem_preferencia">Sem preferência</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}

          {isAniv && (
            <>
              <Field label="Vai levar bolo?">
                <SegmentedButtons
                  value={levaBolo}
                  onChange={setLevaBolo}
                  options={[
                    { value: "sim", label: "Sim" },
                    { value: "nao", label: "Não" },
                  ]}
                />
              </Field>
              <Field label="Comandas individuais?">
                <SegmentedButtons
                  value={comandas}
                  onChange={setComandas}
                  options={[
                    { value: "sim", label: "Sim" },
                    { value: "nao", label: "Não" },
                  ]}
                />
              </Field>
            </>
          )}

          {isEvento && (
            <Field label="Tipo do evento">
              <Input
                value={tipoEvento}
                onChange={(e) => setTipoEvento(e.target.value)}
                placeholder="Ex: confraternização de empresa"
                className="h-12 rounded-xl"
                required
              />
            </Field>
          )}

          {(isEvento || isCasa) ? (
            <Field label="Mensagem">
              <Textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Conte um pouco sobre o que você imagina."
                className="min-h-28 rounded-xl"
              />
            </Field>
          ) : (
            <Field label="Observações">
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Alguma preferência ou informação adicional?"
                className="min-h-24 rounded-xl"
              />
            </Field>
          )}

          <Button
            type="submit"
            disabled={!podeEnviar || enviando}
            className="mt-2 h-13 w-full rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 disabled:opacity-50"
            style={{ height: 52 }}
          >
            {enviando ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…</>
            ) : (
              "Enviar reserva"
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[13px] font-medium text-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Stepper({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="flex h-12 items-center justify-between rounded-xl border border-input bg-background px-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent active:scale-95 disabled:opacity-40"
        disabled={value <= min}
        aria-label="Diminuir"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="text-lg font-medium tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent active:scale-95 disabled:opacity-40"
        disabled={value >= max}
        aria-label="Aumentar"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function SegmentedButtons<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`h-10 rounded-lg text-sm font-medium transition-all ${
            value === o.value
              ? "bg-background text-foreground shadow-[var(--shadow-sm)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
