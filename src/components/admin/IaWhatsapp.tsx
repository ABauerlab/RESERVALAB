import { useState } from "react";
import { Bot, BotOff, Loader2 } from "lucide-react";

import { useIaWhatsapp } from "@/hooks/use-ia-whatsapp";
import { chaveTelefone, conversaPausada, descreverPausa } from "@/lib/ia-whatsapp";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

/** Cartão completo (Configurações): chave geral + conversas pausadas + pausar um número. */
export function IaWhatsappCard({ slug }: { slug: string }) {
  const { estadoQ, estado, definirGlobal, definirConversa } = useIaWhatsapp(slug);
  const [numero, setNumero] = useState("");

  if (estadoQ.isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }
  if (estadoQ.isError || !estado) {
    return (
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar o estado da atendente agora. Tente de novo em instantes.
      </p>
    );
  }

  const numeroValido = chaveTelefone(numero).length === 8 && numero.replace(/\D/g, "").length >= 10;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">Atendente de WhatsApp (IA)</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {estado.ativo
              ? "Respondendo as mensagens que chegam no WhatsApp da casa."
              : "Desligada: nenhuma mensagem é respondida automaticamente. Reservas e avisos do sistema continuam saindo."}
          </p>
        </div>
        <Switch
          checked={estado.ativo}
          disabled={definirGlobal.isPending}
          onCheckedChange={(v) => definirGlobal.mutate(v)}
          aria-label="Atendente de WhatsApp ligada"
        />
      </div>

      <div className="border-t border-border/60 pt-5">
        <p className="font-medium">Pausar só uma conversa</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Útil quando você está atendendo alguém direto no WhatsApp. Também dá para pausar pela tela
          Clientes.
        </p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!numeroValido) return;
            definirConversa.mutate(
              { telefone: numero, pausado: true },
              { onSuccess: () => setNumero("") },
            );
          }}
        >
          <Input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="(31) 99999-0000"
            inputMode="tel"
            className="h-11 rounded-md"
            aria-label="Telefone da conversa a pausar"
          />
          <button
            type="submit"
            disabled={!numeroValido || definirConversa.isPending}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-40"
          >
            <BotOff className="h-4 w-4" /> Pausar
          </button>
        </form>

        {estado.pausadas.length > 0 && (
          <ul className="mt-4 divide-y divide-border/60 rounded-lg border border-border">
            {estado.pausadas.map((p) => (
              <li key={p.telefone} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium tabular-nums">{p.telefone}</p>
                  <p className="text-xs text-muted-foreground">Pausada {descreverPausa(p)}</p>
                </div>
                <button
                  type="button"
                  disabled={definirConversa.isPending}
                  onClick={() => definirConversa.mutate({ telefone: p.telefone, pausado: false })}
                  className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-accent xl:h-9"
                >
                  <Bot className="h-4 w-4" /> Religar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Faixa compacta (Clientes): estado geral com a chave ao lado. */
export function IaWhatsappFaixa({ slug }: { slug: string }) {
  const { estado, estadoQ, definirGlobal } = useIaWhatsapp(slug);
  if (estadoQ.isLoading || estadoQ.isError || !estado) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cream text-brand">
          {estado.ativo ? <Bot className="h-4 w-4" /> : <BotOff className="h-4 w-4" />}
        </span>
        <div>
          <p className="text-sm font-semibold">
            Atendente de WhatsApp {estado.ativo ? "ligada" : "desligada"}
          </p>
          <p className="text-xs text-muted-foreground">
            {estado.pausadas.length > 0
              ? `${estado.pausadas.length} ${estado.pausadas.length === 1 ? "conversa pausada" : "conversas pausadas"}`
              : "Pause uma conversa pelo botão ao lado de cada cliente."}
          </p>
        </div>
      </div>
      <Switch
        checked={estado.ativo}
        disabled={definirGlobal.isPending}
        onCheckedChange={(v) => definirGlobal.mutate(v)}
        aria-label="Atendente de WhatsApp ligada"
      />
    </div>
  );
}

/** Botão por cliente: pausa/religa a IA só nessa conversa. */
export function IaPausaBotao({
  slug,
  telefone,
  nome,
}: {
  slug: string;
  telefone: string;
  nome: string;
}) {
  const { estado, definirConversa } = useIaWhatsapp(slug);
  if (!estado) return null;
  const pausada = conversaPausada(estado, telefone);
  return (
    <button
      type="button"
      disabled={definirConversa.isPending}
      onClick={() => definirConversa.mutate({ telefone, pausado: !pausada })}
      aria-pressed={pausada}
      aria-label={
        pausada ? `Religar a IA na conversa com ${nome}` : `Pausar a IA na conversa com ${nome}`
      }
      title={
        pausada ? "IA pausada nesta conversa. Clique para religar" : "Pausar a IA nesta conversa"
      }
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-accent xl:h-9 xl:w-9 ${
        pausada ? "text-destructive" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {pausada ? <BotOff className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
    </button>
  );
}
