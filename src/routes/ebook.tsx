import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { validarLead, type ErrosLead } from "@/lib/ebook";
import { EMAIL_CONTATO, SITE_URL } from "@/lib/site";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

type TurnstileApi = {
  render: (el: HTMLElement, o: Record<string, unknown>) => string;
  reset: (id?: string) => void;
};

export const Route = createFileRoute("/ebook")({
  head: () => ({
    meta: [
      { title: "Guia grátis: Reservas organizadas, salão tranquilo · Teggly" },
      {
        name: "description",
        content:
          "Guia prático e gratuito para receber, confirmar e lembrar reservas sem depender de caderno e de um WhatsApp lotado.",
      },
      // Fica fora do Google ate a Politica de Privacidade ser publicada.
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/ebook` }],
  }),
  component: PaginaEbook,
});

const CAMPOS = [
  { id: "nome", rotulo: "Seu nome", tipo: "text", auto: "name" },
  { id: "negocio", rotulo: "Nome do negócio", tipo: "text", auto: "organization" },
  { id: "email", rotulo: "E-mail", tipo: "email", auto: "email" },
  { id: "whatsapp", rotulo: "WhatsApp com DDD", tipo: "tel", auto: "tel" },
  { id: "instagram", rotulo: "Instagram do negócio", tipo: "text", auto: "off" },
] as const;

const MENSAGENS: Record<string, string> = {
  muitas_tentativas: "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.",
  envio_recusado: "Não foi possível enviar. Recarregue a página e tente de novo.",
  captcha_invalido: "Não conseguimos validar a verificação. Tente de novo.",
  indisponivel: "O envio está indisponível agora. Seus dados continuam aqui: tente em instantes.",
  registro_falhou:
    "Não conseguimos registrar seu pedido agora. Seus dados continuam aqui: tente em instantes.",
};

function PaginaEbook() {
  const aberto = useRef(Date.now());
  const [valores, setValores] = useState<Record<string, string>>({});
  const [consentimento, setConsentimento] = useState(false);
  const [erros, setErros] = useState<ErrosLead>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [duplicado, setDuplicado] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const captchaEl = useRef<HTMLDivElement>(null);
  const captchaId = useRef<string | null>(null);

  // Cloudflare Turnstile so aparece quando VITE_TURNSTILE_SITE_KEY existe (o servidor verifica o token).
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !captchaEl.current) return;
    const montar = () => {
      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (!api || !captchaEl.current || captchaId.current) return;
      captchaId.current = api.render(captchaEl.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (t: string) => setCaptcha(t),
        "expired-callback": () => setCaptcha(null),
        "error-callback": () => setCaptcha(null),
      });
    };
    if ((window as unknown as { turnstile?: TurnstileApi }).turnstile) return montar();
    const sc = document.createElement("script");
    sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    sc.async = true;
    sc.onload = montar;
    document.head.appendChild(sc);
  }, []);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    setErroGeral(null);
    const corpo = {
      ...valores,
      consentimento,
      site: (new FormData(e.currentTarget).get("site") as string) ?? "",
      t: aberto.current,
      captcha,
    };
    const v = validarLead(corpo);
    if (!v.ok) {
      setErros(v.erros);
      return;
    }
    if (TURNSTILE_SITE_KEY && !captcha) {
      setErroGeral("Conclua a verificação de segurança antes de enviar.");
      return;
    }
    setErros({});
    setEnviando(true);
    try {
      const r = await fetch("/api/public/ebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const j = (await r.json()) as {
        ok: boolean;
        token?: string;
        codigo?: string;
        erros?: ErrosLead;
      };
      if (j.ok && j.token) setToken(j.token);
      else if (j.erros) setErros(j.erros);
      else setErroGeral(MENSAGENS[j.codigo ?? ""] ?? MENSAGENS.registro_falhou);
    } catch {
      setErroGeral(MENSAGENS.indisponivel);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center px-5">
          <Link to="/" aria-label="Teggly, página inicial" className="flex min-h-11 items-center">
            <img
              src="/brand/Teggly_Logo_Primary.svg"
              alt="Teggly"
              width={118}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-[1200px] gap-12 px-5 py-14 lg:grid-cols-2 lg:py-20">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">
            Guia prático gratuito
          </p>
          <h1 className="mt-3 text-[2.25rem] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-5xl">
            Reservas organizadas, salão tranquilo.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Como receber, confirmar e lembrar reservas sem depender de memória, caderno e um
            WhatsApp lotado.
          </p>
          <ul className="mt-6 space-y-2 text-slate-700">
            <li>Os 7 erros mais comuns na reserva</li>
            <li>Roteiro de atendimento pelo WhatsApp</li>
            <li>Modelos de confirmação e lembrete</li>
            <li>Política de atraso e lista de espera</li>
            <li>Checklist de sexta-feira e diagnóstico da operação</li>
          </ul>
          <p className="mt-6 text-sm text-slate-600">
            O guia reúne boas práticas de operação. Não traz estatísticas de mercado nem promessa de
            resultado.
          </p>
        </section>

        <section aria-live="polite">
          {token ? (
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-2xl font-extrabold tracking-[-0.02em]">Pedido registrado.</h2>
              <p className="mt-2 text-slate-600">
                Seu guia está pronto. O link vale por 30 minutos.
              </p>
              <a
                href={`/api/public/ebook-download?t=${encodeURIComponent(token)}`}
                className="mt-6 inline-flex h-[52px] items-center justify-center rounded-[10px] bg-primary px-6 text-base font-semibold text-primary-foreground shadow-blue hover:bg-blue-700"
              >
                Baixar o guia (PDF)
              </a>
              <p className="mt-6 text-sm text-slate-600">
                Quer ver como o Teggly organiza isso por você?{" "}
                <Link to="/planos" className="font-semibold text-blue-700 underline">
                  Conhecer os planos
                </Link>
                .
              </p>
            </div>
          ) : (
            <form
              onSubmit={enviar}
              noValidate
              className="rounded-lg border border-border bg-card p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">Receba o guia</h2>
              <div className="mt-5 space-y-4">
                {CAMPOS.map((c) => (
                  <div key={c.id}>
                    <label htmlFor={c.id} className="text-sm font-medium">
                      {c.rotulo}
                    </label>
                    <input
                      id={c.id}
                      name={c.id}
                      type={c.tipo}
                      autoComplete={c.auto}
                      value={valores[c.id] ?? ""}
                      onChange={(ev) => setValores((s) => ({ ...s, [c.id]: ev.target.value }))}
                      aria-invalid={!!erros[c.id]}
                      aria-describedby={erros[c.id] ? `${c.id}-erro` : undefined}
                      className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
                    />
                    {erros[c.id] && (
                      <p id={`${c.id}-erro`} className="mt-1 text-sm text-red-700">
                        {erros[c.id]}
                      </p>
                    )}
                  </div>
                ))}
                {/* Honeypot: escondido de pessoas e de leitores de tela. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>
                    Não preencha
                    <input name="site" type="text" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
                <div>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={consentimento}
                      onChange={(ev) => setConsentimento(ev.target.checked)}
                      className="mt-1 size-5 shrink-0"
                    />
                    <span>
                      Li o{" "}
                      <Link to="/privacidade" className="font-semibold text-blue-700 underline">
                        Aviso de Privacidade
                      </Link>{" "}
                      e os{" "}
                      <Link to="/termos" className="font-semibold text-blue-700 underline">
                        Termos de Uso
                      </Link>{" "}
                      e aceito receber o guia e contato da Teggly sobre ele.
                    </span>
                  </label>
                  {erros.consentimento && (
                    <p className="mt-1 text-sm text-red-700">{erros.consentimento}</p>
                  )}
                </div>
              </div>
              {TURNSTILE_SITE_KEY && <div ref={captchaEl} className="mt-4" />}
              {erroGeral && (
                <p
                  role="alert"
                  className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {erroGeral}
                </p>
              )}
              <button
                type="submit"
                disabled={enviando}
                className="mt-6 inline-flex h-[52px] w-full items-center justify-center rounded-[10px] bg-primary px-6 text-base font-semibold text-primary-foreground shadow-blue hover:bg-blue-700 disabled:opacity-60"
              >
                {enviando ? "Enviando..." : "Quero o guia grátis"}
              </button>
              <p className="mt-4 text-xs text-slate-600">
                Usamos seus dados só para entregar o guia e falar sobre ele. Para pedir a exclusão,
                escreva para{" "}
                <a className="underline" href={`mailto:${EMAIL_CONTATO}`}>
                  {EMAIL_CONTATO}
                </a>
                .
              </p>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
