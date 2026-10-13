/**
 * Captura de leads do e-book. Regra: o arquivo so e liberado depois que o Google Apps Script confirma
 * o registro do lead. Tudo aqui e puro e recebe dependencias por parametro para ser testavel.
 */
import { verificarTurnstile } from "@/lib/captcha";
import { VERSAO_TEXTOS } from "@/lib/legal";

export const VERSAO_AVISO_EBOOK = VERSAO_TEXTOS;
const TEMPO_MINIMO_MS = 3000;
const TEMPO_MAXIMO_MS = 1000 * 60 * 60 * 6;
export const VALIDADE_LINK_MS = 1000 * 60 * 30;

export type LeadEbookEntrada = {
  nome?: unknown;
  negocio?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  instagram?: unknown;
  consentimento?: unknown;
  /** Honeypot: humanos nao veem nem preenchem. */
  site?: unknown;
  /** Momento (ms) em que o formulario foi exibido. */
  t?: unknown;
  captcha?: unknown;
};

export type LeadEbook = {
  nome: string;
  negocio: string;
  email: string;
  whatsapp: string;
  instagram: string;
};

export type ErrosLead = Partial<Record<keyof LeadEbook | "consentimento", string>>;

const limpar = (v: unknown, max: number) =>
  String(v ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export function normalizarWhatsapp(v: unknown): string {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  return d;
}

export function normalizarInstagram(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
}

export function validarLead(
  e: LeadEbookEntrada,
): { ok: true; lead: LeadEbook } | { ok: false; erros: ErrosLead } {
  const erros: ErrosLead = {};
  const nome = limpar(e.nome, 100);
  const negocio = limpar(e.negocio, 100);
  const email = limpar(e.email, 160).toLowerCase();
  const whatsapp = normalizarWhatsapp(e.whatsapp);
  const instagram = normalizarInstagram(e.instagram);
  if (nome.length < 2) erros.nome = "Informe seu nome.";
  if (negocio.length < 2) erros.negocio = "Informe o nome do seu negócio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) erros.email = "Informe um e-mail válido.";
  if (!/^[1-9]{2}9?\d{8}$/.test(whatsapp))
    erros.whatsapp = "Informe o WhatsApp com DDD, por exemplo (31) 99999-9999.";
  if (!/^[a-z0-9._]{1,30}$/.test(instagram))
    erros.instagram = "Informe o Instagram do negócio, por exemplo @seurestaurante.";
  if (e.consentimento !== true) erros.consentimento = "Marque a ciência do aviso de privacidade.";
  if (Object.keys(erros).length) return { ok: false, erros };
  return { ok: true, lead: { nome, negocio, email, whatsapp, instagram } };
}

/* ------------------------------ link de download ------------------------------ */

const enc = new TextEncoder();
const b64url = (b: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(b instanceof Uint8Array ? b : new Uint8Array(b))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

async function hmac(secret: string, dados: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(dados)));
}

export async function assinarLink(secret: string, agora: number): Promise<string> {
  const corpo = b64url(enc.encode(JSON.stringify({ exp: agora + VALIDADE_LINK_MS })));
  return `${corpo}.${await hmac(secret, corpo)}`;
}

export async function verificarLink(
  secret: string,
  token: string | null | undefined,
  agora: number,
): Promise<boolean> {
  if (!token || token.length > 300) return false;
  const [corpo, sig] = token.split(".");
  if (!corpo || !sig) return false;
  const esperado = await hmac(secret, corpo);
  if (esperado.length !== sig.length) return false;
  let dif = 0;
  for (let i = 0; i < sig.length; i++) dif |= esperado.charCodeAt(i) ^ sig.charCodeAt(i);
  if (dif !== 0) return false;
  try {
    const p = JSON.parse(atob(corpo.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof p.exp === "number" && p.exp > agora;
  } catch {
    return false;
  }
}

/** So aceita a URL de implantacao do Apps Script, para uma variavel errada nao virar um destino qualquer. */
export function urlAppsScriptValida(url: string | undefined): url is string {
  return (
    !!url && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.trim())
  );
}

/** Resposta do download: so entrega o arquivo com link assinado valido. */
export async function responderDownload(
  token: string | null,
  secret: string | undefined,
  agora: number,
  obterPdf: () => Promise<Uint8Array>,
): Promise<Response> {
  if (!secret || !(await verificarLink(secret, token, agora)))
    return new Response("Link inválido ou expirado. Peça o guia de novo em /ebook.", {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
  return new Response((await obterPdf()) as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Teggly_Guia_Reservas_Organizadas.pdf"',
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

/* ------------------------------ limite de tentativas ------------------------------ */

export type LimitadorTentativas = (chave: string, agora: number) => boolean;

/** Janela deslizante em memoria. Melhor esforco por instancia; o Apps Script limita de novo. */
export function criarLimitador(max: number, janelaMs: number): LimitadorTentativas {
  const hits = new Map<string, number[]>();
  return (chave, agora) => {
    const recentes = (hits.get(chave) ?? []).filter((t) => agora - t < janelaMs);
    if (recentes.length >= max) {
      hits.set(chave, recentes);
      return false;
    }
    recentes.push(agora);
    hits.set(chave, recentes);
    if (hits.size > 5000)
      for (const k of hits.keys())
        if (!hits.get(k)?.some((t) => agora - t < janelaMs)) hits.delete(k);
    return true;
  };
}

/* ------------------------------ processamento ------------------------------ */

export type ConfigEbook = {
  appsScriptUrl: string | undefined;
  appsScriptSecret: string | undefined;
  tokenSecret: string | undefined;
  turnstileSecret: string | undefined;
};

export type RespostaEbook =
  | { status: 200; body: { ok: true; token: string; duplicado: boolean } }
  | { status: 400 | 422 | 429 | 502 | 503; body: { ok: false; codigo: string; erros?: ErrosLead } };

export async function processarLeadEbook(
  entrada: LeadEbookEntrada,
  ctx: {
    ip: string | null;
    agora: number;
    config: ConfigEbook;
    limitador: LimitadorTentativas;
    doFetch?: typeof fetch;
  },
): Promise<RespostaEbook> {
  const { config, agora } = ctx;
  const doFetch = ctx.doFetch ?? fetch;

  if (!ctx.limitador(ctx.ip ?? "sem-ip", agora))
    return { status: 429, body: { ok: false, codigo: "muitas_tentativas" } };

  // Honeypot preenchido ou envio rapido demais: resposta generica, nada e registrado.
  const t = Number(entrada.t);
  if (
    (typeof entrada.site === "string" && entrada.site.trim() !== "") ||
    !Number.isFinite(t) ||
    agora - t < TEMPO_MINIMO_MS ||
    agora - t > TEMPO_MAXIMO_MS
  )
    return { status: 400, body: { ok: false, codigo: "envio_recusado" } };

  const v = validarLead(entrada);
  if (!v.ok) return { status: 422, body: { ok: false, codigo: "dados_invalidos", erros: v.erros } };

  if (!urlAppsScriptValida(config.appsScriptUrl) || !config.appsScriptSecret || !config.tokenSecret)
    return { status: 503, body: { ok: false, codigo: "indisponivel" } };

  if (config.turnstileSecret) {
    const c = await verificarTurnstile(
      typeof entrada.captcha === "string" ? entrada.captcha : null,
      config.turnstileSecret,
      ctx.ip,
      doFetch,
    );
    if (c === "invalido") return { status: 400, body: { ok: false, codigo: "captcha_invalido" } };
    if (c === "indisponivel") return { status: 503, body: { ok: false, codigo: "indisponivel" } };
  }

  let resultado: { ok?: boolean; status?: string; erro?: string } | null = null;
  try {
    const r = await doFetch(config.appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        segredo: config.appsScriptSecret,
        ...v.lead,
        origem: "ebook",
        aviso_versao: VERSAO_AVISO_EBOOK,
        recebido_em: new Date(agora).toISOString(),
      }),
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return { status: 502, body: { ok: false, codigo: "registro_falhou" } };
    resultado = (await r.json()) as { ok?: boolean; status?: string; erro?: string };
  } catch {
    return { status: 502, body: { ok: false, codigo: "registro_falhou" } };
  }

  if (resultado?.ok === false && resultado.erro === "limite")
    return { status: 429, body: { ok: false, codigo: "muitas_tentativas" } };
  // Sem confirmacao explicita do registro, nao libera o arquivo.
  if (
    !resultado ||
    resultado.ok !== true ||
    !["criado", "duplicado"].includes(resultado.status ?? "")
  )
    return { status: 502, body: { ok: false, codigo: "registro_falhou" } };

  return {
    status: 200,
    body: {
      ok: true,
      token: await assinarLink(config.tokenSecret, agora),
      duplicado: resultado.status === "duplicado",
    },
  };
}
