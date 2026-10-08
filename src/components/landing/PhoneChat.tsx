import { Drop } from "@/components/admin/Drop";

/**
 * Conversa de exemplo no WhatsApp. Reflete o produto real: o Assistente responde e envia o link; quem
 * reserva e o cliente, pela pagina da casa; a confirmacao com codigo, data e pessoas e enviada pelo sistema. Ilustracao: nomes e horarios sao de exemplo.
 */
export function PhoneChat() {
  return (
    <div
      className="relative mx-auto w-[272px] motion-safe:animate-drop rounded-[2.4rem] border-[7px] border-slate-900 bg-slate-900 shadow-lg sm:w-[300px]"
      role="img"
      aria-label="Exemplo de conversa no WhatsApp: o cliente pede mesa, o Assistente envia o link de reserva e a confirmação chega com o código."
    >
      <div className="overflow-hidden rounded-[1.9rem] bg-[#ECE5DD]">
        <div className="flex items-center gap-3 bg-card px-4 py-3">
          <span className="grid size-9 place-items-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
            CE
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Casa Exemplo</p>
            <p className="text-[11px] text-slate-600">Atendimento 24 horas</p>
          </div>
        </div>
        <div className="space-y-2.5 px-3 pb-10 pt-4 text-[13px] leading-snug">
          <p className="ml-auto w-fit max-w-[80%] rounded-xl rounded-tr-sm bg-[#D9FDD3] px-3 py-2 text-slate-900 shadow-xs">
            Oi! Tem mesa para sábado, 4 pessoas?
          </p>
          <div className="w-fit max-w-[85%] rounded-xl rounded-tl-sm bg-card px-3 py-2 text-slate-900 shadow-xs">
            <p className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">
              <span className="ai-pulse" aria-hidden="true" /> Assistente
            </p>
            <p>Posso te mandar o link para reservar. Quer?</p>
          </div>
          <p className="ml-auto w-fit max-w-[80%] rounded-xl rounded-tr-sm bg-[#D9FDD3] px-3 py-2 text-slate-900 shadow-xs">
            Quero, por favor.
          </p>
          <div className="w-fit max-w-[88%] rounded-xl rounded-tl-sm bg-card px-3 py-2 text-slate-900 shadow-xs">
            <p className="font-semibold">Ana, sua reserva está confirmada.</p>
            <p className="mt-1 text-slate-700">
              Sábado, 21 de junho
              <br />
              Horário: 20:00
              <br />
              Pessoas: 4
              <br />
              Código: CE-2M8Q4L
            </p>
            <p className="mt-1">Se precisar mudar algo, é só responder aqui.</p>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-7 -right-8 hidden items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 shadow-lg sm:flex">
        <Drop className="animate-drop" />
        <div className="leading-tight">
          <p className="text-xs font-semibold text-success-700">Confirmada</p>
          <p className="text-sm font-semibold">Mesa · 4 pessoas</p>
          <p className="text-xs text-slate-600">Sáb, 21 jun · 20:00</p>
        </div>
      </div>
    </div>
  );
}
