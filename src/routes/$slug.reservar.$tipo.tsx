import { createFileRoute, Link, useNavigate, useParams, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2, Minus, Plus, CalendarX2, Gift, Receipt, Cake } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  TIPO_LABEL,
  formatTelefone,
  horariosDisponiveis,
  type ReservaArea,
  type ReservaTipo,
} from "@/lib/reservations";
import { getTenantBySlug } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";


const TIPOS_VALIDOS: ReservaTipo[] = ["mesa", "aniversario", "evento", "casamento"];

export const Route = createFileRoute("/$slug/reservar/$tipo")({
  head: ({ params }) => ({
    meta: [
      { title: `${TIPO_LABEL[params.tipo as ReservaTipo] ?? "Reserva"} — ReservaLab` },
      { name: "description", content: "Envie sua solicitação de reserva em poucos toques." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params }) => {
    if (!TIPOS_VALIDOS.includes(params.tipo as ReservaTipo)) throw notFound();
    return {};
  },
  notFoundComponent: () => (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <p className="text-sm text-muted-foreground">Tipo de reserva não encontrado.</p>
    </main>
  ),
  errorComponent: () => (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <p className="text-sm text-muted-foreground">Não foi possível carregar esta página.</p>
    </main>
  ),
  component: ReservarPage,
});

function ReservarPage() {
  const { slug, tipo } = useParams({ from: "/$slug/reservar/$tipo" }) as { slug: string; tipo: ReservaTipo };
  const navigate = useNavigate();
  const tenantQ = useQuery({ queryKey: ["tenant", slug], queryFn: () => getTenantBySlug(slug), staleTime: 5 * 60_000 });

  const bloqueiosQ = useQuery({
    queryKey: ["bloqueios", slug],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("bloqueios_do_tenant", { _slug: slug });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [quantidade, setQuantidade] = useState<number>(2);
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

  const horariosOpcoes = useMemo(
    () => (precisaHorario ? horariosDisponiveis(data, quantidade) : []),
    [precisaHorario, data, quantidade],
  );

  // Mantém a seleção válida quando data/quantidade mudam.
  useEffect(() => {
    if (horario && !horariosOpcoes.includes(horario)) setHorario("");
  }, [horariosOpcoes, horario]);


  // Bloqueio de agenda aplicável à data/horário escolhidos
  const bloqueio = useMemo(() => {
    if (!data) return null;
    const doDia = (bloqueiosQ.data ?? []).filter((b) => b.data === data);
    if (doDia.length === 0) return null;
    const diaTodo = doDia.find((b) => !b.hora_inicio && !b.hora_fim);
    if (diaTodo) return { motivo: diaTodo.motivo, diaTodo: true as const };
    if (!horario) return null;
    const faixa = doDia.find((b) => {
      const ini = b.hora_inicio ?? "00:00:00";
      const fim = b.hora_fim ?? "23:59:59";
      return horario >= ini.slice(0, 5) && horario <= fim.slice(0, 5);
    });
    return faixa ? { motivo: faixa.motivo, diaTodo: false as const } : null;
  }, [bloqueiosQ.data, data, horario]);

  const podeEnviar =
    !!tenantQ.data &&
    !bloqueio &&
    nome.trim().length >= 2 &&
    telefone.replace(/\D/g, "").length >= 10 &&
    quantidade > 0 &&
    !!data &&
    (!precisaHorario || !!horario) &&
    (!isEvento || tipoEvento.trim().length > 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEnviar || enviando) return;
    const tenant = tenantQ.data;
    if (!tenant) { toast.error("Empresa indisponível no momento."); return; }

    setEnviando(true);
    // Criação via função segura no servidor: valida empresa, tipos aceitos e
    // bloqueios de agenda, e devolve o código sem expor a lista de reservas.
    const { data: codigo, error } = await supabase.rpc("criar_reserva", {
      _slug: slug,
      _tipo: tipo,
      _nome: nome.trim(),
      _telefone: telefone.trim(),
      _quantidade: quantidade,
      _data: data,
      _horario: precisaHorario && horario ? horario : undefined,
      _area: isMesa ? area : undefined,
      _leva_bolo: isAniv ? levaBolo === "sim" : undefined,
      _comandas: isAniv ? comandas === "sim" : undefined,
      _tipo_evento: isEvento ? tipoEvento.trim() : undefined,
      _observacoes: (isEvento || isCasa) ? (mensagem.trim() || undefined) : (observacoes.trim() || undefined),

    });
    setEnviando(false);

    if (error || !codigo) {
      const msg = error?.message ?? "";
      if (msg.includes("indisponivel")) toast.error("Essa data ou horário não está disponível. Escolha outro.");
      else if (msg.includes("Telefone")) toast.error("Confira o telefone informado.");
      else if (msg.includes("nao esta disponivel")) toast.error("Este tipo de reserva não está disponível.");
      else toast.error("Não foi possível enviar sua reserva. Tente novamente.");
      return;
    }
    try { sessionStorage.setItem("ultima-reserva-codigo", codigo); } catch { /* noop */ }
    navigate({ to: "/$slug/obrigado", params: { slug } });
  }


  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-5 pt-6 pb-24 safe-top safe-bottom">
        <Link
          to="/$slug"
          params={{ slug }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Link>

        <header className="mt-6 animate-fade">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-terracotta">
            {tenantQ.data?.nome ?? "Reserva"}
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
            {TIPO_LABEL[tipo]}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Preencha e nossa equipe confirmará em seguida.
          </p>
        </header>

        {isAniv && (
          <section className="mt-6 rounded-2xl border border-terracotta/25 bg-terracotta/5 p-5 animate-in-up">
            <p className="font-serif text-xl leading-snug sm:text-2xl">
              Vai ser um prazer comemorar seu aniversário no {tenantQ.data?.nome ?? "Iracema"}!
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li className="flex gap-2.5">
                <Gift className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                <span>O aniversariante da semana ganha um drink ou uma sobremesa e também 10% do valor gasto na própria comanda em cashback para uma próxima visita.</span>
              </li>
              <li className="flex gap-2.5">
                <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                <span>A partir de 15 convidados, disponibilizamos comandas individuais.</span>
              </li>
              <li className="flex gap-2.5">
                <Cake className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                <span>Pode trazer seu bolo! Nós guardamos e disponibilizamos pratos e talheres.</span>
              </li>
            </ul>
          </section>
        )}
        {isEvento && (
          <section className="mt-6 space-y-4 rounded-2xl border border-terracotta/25 bg-terracotta/5 p-5 animate-in-up">
            <div>
              <p className="font-serif text-xl leading-snug sm:text-2xl">Orçamento — eventos particulares</p>
              <p className="mt-1.5 text-sm text-muted-foreground">Mínimo de 50 pessoas • Máximo de 180 pessoas</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-card p-4">
                <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-terracotta">
                  <UtensilsCrossed className="h-3.5 w-3.5" /> Petiscos
                </p>
                <ul className="mt-2.5 space-y-1 text-sm text-muted-foreground">
                  <li>Carne de panela com pãozinho</li>
                  <li>Bolinho de linguiça</li>
                  <li>Chips de jiló</li>
                  <li>Coxinha de moranga com rabada</li>
                  <li>Batata frita</li>
                  <li>Harumaki de carne de panela</li>
                </ul>
              </div>

              <div className="rounded-xl bg-card p-4">
                <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-terracotta">
                  <Beer className="h-3.5 w-3.5" /> Bebidas
                </p>
                <ul className="mt-2.5 space-y-1 text-sm text-muted-foreground">
                  <li>Água mineral</li>
                  <li>Água gasosa</li>
                  <li>Cerveja Eisenbahn</li>
                  <li>Refrigerante Guaraná/Coca-Cola normal ou zero</li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl bg-card p-4">
              <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-terracotta">
                <Receipt className="h-3.5 w-3.5" /> Valores (5 horas de evento)
              </p>
              <ul className="mt-2.5 space-y-1.5 text-sm">
                <li className="flex flex-wrap justify-between gap-2"><span className="text-muted-foreground">Menu sem bebidas</span><span className="font-medium">R$ 110,00/pessoa</span></li>
                <li className="flex flex-wrap justify-between gap-2"><span className="text-muted-foreground">Menu, bebidas e cerveja Eisenbahn</span><span className="font-medium">R$ 160,00/pessoa</span></li>
                <li className="flex flex-wrap justify-between gap-2"><span className="text-muted-foreground">Bebidas e cerveja Heineken</span><span className="font-medium">R$ 180,00/pessoa</span></li>
                <li className="flex flex-wrap justify-between gap-2"><span className="text-muted-foreground">Bebidas, cerveja Heineken e drinks</span><span className="font-medium">R$ 200,00/pessoa</span></li>
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Couvert artístico de R$ 10,00 por pessoa caso haja interesse em banda.
              </p>
            </div>

            <p className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
              <span>Pagamento: 50% de sinal no ato da reserva e 50% restante no dia.</span>
            </p>
          </section>
        )}




        <form onSubmit={onSubmit} className="mt-8 space-y-5 animate-in-up">
          <Field label="Nome">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" autoComplete="name" className="h-12 rounded-xl" required />
          </Field>

          <Field label="Telefone / WhatsApp" hint="Se for do exterior, comece com + e o código do país">
            <Input value={telefone} onChange={(e) => setTelefone(formatTelefone(e.target.value))} placeholder="(11) 91234-5678 ou +1 555 1234" inputMode="tel" autoComplete="tel" className="h-12 rounded-xl" required />
          </Field>

          <Field label={isEvento || isCasa ? "Quantidade prevista" : "Quantidade de pessoas"}>
            <QuantityInput value={quantidade} onChange={setQuantidade} min={1} max={5000} />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Data">
              <Input type="date" min={hoje} value={data} onChange={(e) => setData(e.target.value)} className="h-12 rounded-xl" required />
            </Field>
            {precisaHorario && (
              <Field label="Horário">
                <Select value={horario} onValueChange={setHorario} disabled={!data}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder={data ? "Selecione" : "Escolha a data"} />
                  </SelectTrigger>
                  <SelectContent>
                    {horariosOpcoes.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>


          {bloqueio && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4">
              <CalendarX2 className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="text-sm">
                <p className="font-medium text-destructive">
                  {bloqueio.diaTodo ? "Esta data não está disponível" : "Este horário não está disponível"}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {bloqueio.motivo?.trim() || "Escolha outra opção para continuar."}
                </p>
              </div>
            </div>
          )}



          {isMesa && (
            <Field label="Área desejada">
              <Select value={area} onValueChange={(v) => setArea(v as ReservaArea)}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
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
                <SegmentedButtons value={levaBolo} onChange={setLevaBolo} options={[{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }]} />
              </Field>
              <Field label="Comandas individuais?">
                <SegmentedButtons value={comandas} onChange={setComandas} options={[{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }]} />
              </Field>
            </>
          )}

          {isEvento && (
            <Field label="Tipo do evento">
              <Input value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value)} placeholder="Ex: confraternização de empresa" className="h-12 rounded-xl" required />
            </Field>
          )}

          {(isEvento || isCasa) ? (
            <Field label="Mensagem">
              <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Conte um pouco sobre o que você imagina." className="min-h-28 rounded-xl" />
            </Field>
          ) : (
            <Field label="Observações">
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Alguma preferência ou informação adicional?" className="min-h-24 rounded-xl" />
            </Field>
          )}

          <Button type="submit" disabled={!podeEnviar || enviando} className="mt-2 w-full rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 disabled:opacity-50" style={{ height: 52 }}>
            {enviando ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…</>) : "Enviar reserva"}
          </Button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-[13px] font-medium text-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function QuantityInput({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  const [text, setText] = useState<string>(String(value));
  function commit(next: number) {
    const clamped = Math.max(min, Math.min(max, Number.isFinite(next) ? next : min));
    onChange(clamped); setText(String(clamped));
  }
  return (
    <div className="flex h-12 items-center justify-between rounded-xl border border-input bg-background px-2">
      <button type="button" onClick={() => commit(value - 1)} className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent active:scale-95 disabled:opacity-40" disabled={value <= min} aria-label="Diminuir">
        <Minus className="h-4 w-4" />
      </button>
      <input type="text" inputMode="numeric" pattern="[0-9]*" value={text}
        onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setText(v); if (v !== "") onChange(Math.max(min, Math.min(max, parseInt(v, 10)))); }}
        onBlur={() => { if (text === "") commit(min); else commit(parseInt(text, 10)); }}
        className="w-16 bg-transparent text-center text-lg font-medium tabular-nums outline-none" aria-label="Quantidade" />
      <button type="button" onClick={() => commit(value + 1)} className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent active:scale-95 disabled:opacity-40" disabled={value >= max} aria-label="Aumentar">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function SegmentedButtons<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`h-10 rounded-lg text-sm font-medium transition-all ${value === o.value ? "bg-background text-foreground shadow-[var(--shadow-sm)]" : "text-muted-foreground hover:text-foreground"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
