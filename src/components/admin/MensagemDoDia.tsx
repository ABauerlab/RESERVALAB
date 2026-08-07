import { useMemo, useState } from "react";
import { Copy, MessageSquareText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AREA_LABEL, formatHorario, type Reserva, type ReservaArea } from "@/lib/reservations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const DIAS = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function ddmm(iso: string) {
  const d = parseISO(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function areaNome(r: Reserva) {
  const area = r.area as ReservaArea | null;
  return (area ? AREA_LABEL[area] : "SEM LOCAL DEFINIDO").toUpperCase();
}

export function buildMensagemDoDia(dataISO: string, reservas: Reserva[]): string {
  if (!reservas.length) return "";

  const grupos = new Map<string, Reserva[]>();
  for (const r of reservas) {
    const key = areaNome(r);
    const arr = grupos.get(key) ?? [];
    arr.push(r);
    grupos.set(key, arr);
  }

  const partes: string[] = [
    `*RESERVAS ${DIAS[parseISO(dataISO).getDay()]} ${ddmm(dataISO)}*`,
  ];

  for (const [local, lista] of [...grupos.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))) {
    lista.sort((a, b) => (a.horario ?? "99:99").localeCompare(b.horario ?? "99:99"));
    partes.push("");
    partes.push(`*${local}*`);
    for (const r of lista) {
      partes.push("");
      partes.push(`Nome: ${r.nome}`);
      partes.push(`Data: ${r.data ? ddmm(r.data) : "-"}`);
      partes.push(`Quantidade de pessoas: ${r.quantidade ?? "-"}`);
      partes.push(`Horário: ${r.horario ? formatHorario(r.horario) : "-"}`);
      partes.push(`Telefone: ${r.telefone}`);
      const obs = (r.observacoes ?? "").trim();
      partes.push(`Observação: ${obs.length > 0 ? obs.replace(/\s*\n\s*/g, " ") : "-"}`);
    }
  }

  return partes.join("\n");
}

/** Todas as reservas a partir da data informada, agrupadas por dia. */
export function buildMensagemProximas(dataISO: string, reservas: Reserva[]): string {
  if (!reservas.length) return "";
  const porDia = new Map<string, Reserva[]>();
  for (const r of reservas) {
    if (!r.data || r.data < dataISO) continue;
    const arr = porDia.get(r.data) ?? [];
    arr.push(r);
    porDia.set(r.data, arr);
  }
  const dias = [...porDia.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return dias.map(([dia, lista]) => buildMensagemDoDia(dia, lista)).filter(Boolean).join("\n\n");
}

type Modo = "dia" | "proximas";

export function MensagemDoDiaButton({ tenantId }: { tenantId: string | null }) {
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState<Modo>("dia");
  const [data, setData] = useState(todayISO());

  const q = useQuery({
    enabled: open && !!tenantId && !!data,
    queryKey: ["mensagem-do-dia", tenantId, data, modo],
    queryFn: async () => {
      let query = supabase
        .from("reservas").select("*")
        .eq("tenant_id", tenantId!)
        .neq("status", "cancelada");
      query = modo === "dia" ? query.eq("data", data) : query.gte("data", data);
      const { data: rows, error } = await query
        .order("data", { ascending: true })
        .order("horario", { ascending: true });
      if (error) throw error;
      return rows as Reserva[];
    },
  });

  const texto = useMemo(
    () => (modo === "dia"
      ? buildMensagemDoDia(data, q.data ?? [])
      : buildMensagemProximas(data, q.data ?? [])),
    [modo, data, q.data],
  );

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Mensagem copiada.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
      >
        <MessageSquareText className="h-3.5 w-3.5 text-terracotta" /> Gerar mensagem do dia
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerar mensagem</DialogTitle>
            <DialogDescription>Escolha o período e copie o resumo das reservas.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              {([["dia", "Somente o dia"], ["proximas", "A partir da data"]] as Array<[Modo, string]>).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setModo(v)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    modo === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="msg-data">{modo === "dia" ? "Data" : "A partir de"}</Label>
              <Input id="msg-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>

            {q.isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : texto ? (
              <>
                <Textarea readOnly value={texto} rows={14} className="font-mono text-xs" />
                <Button onClick={copiar} className="w-full gap-2">
                  <Copy className="h-4 w-4" /> Copiar mensagem
                </Button>
              </>
            ) : (
              <p className="rounded-xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhuma reserva encontrada para esse período
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

