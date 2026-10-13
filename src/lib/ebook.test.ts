import { describe, expect, it, vi } from "vitest";

import {
  assinarLink,
  criarLimitador,
  normalizarInstagram,
  normalizarWhatsapp,
  processarLeadEbook,
  responderDownload,
  urlAppsScriptValida,
  validarLead,
  verificarLink,
  type ConfigEbook,
} from "@/lib/ebook";

const AGORA = 1_800_000_000_000;
const valido = {
  nome: "Maria Souza",
  negocio: "Bistrô da Maria",
  email: "Maria@Exemplo.com",
  whatsapp: "(31) 99999-1234",
  instagram: "@bistrodamaria",
  consentimento: true,
  site: "",
  t: AGORA - 10_000,
};
const config: ConfigEbook = {
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbTESTE123/exec",
  appsScriptSecret: "s1",
  tokenSecret: "tok",
  turnstileSecret: undefined,
};
const resp = (b: unknown, ok = true) => ({ ok, json: async () => b }) as unknown as Response;
const ctx = (over: Partial<Parameters<typeof processarLeadEbook>[1]> = {}) => ({
  ip: "1.1.1.1",
  agora: AGORA,
  config,
  limitador: criarLimitador(5, 60_000),
  ...over,
});

describe("validacao do lead", () => {
  it("aceita e normaliza dados validos", () => {
    const r = validarLead(valido);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.lead.email).toBe("maria@exemplo.com");
      expect(r.lead.whatsapp).toBe("31999991234");
      expect(r.lead.instagram).toBe("bistrodamaria");
    }
  });
  it("rejeita campos invalidos e falta de consentimento", () => {
    const r = validarLead({
      nome: "A",
      negocio: "",
      email: "x",
      whatsapp: "123",
      instagram: "a b",
    });
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(Object.keys(r.erros).sort()).toEqual(
        ["consentimento", "email", "instagram", "negocio", "nome", "whatsapp"].sort(),
      );
  });
  it("normaliza whatsapp com +55 e instagram por URL", () => {
    expect(normalizarWhatsapp("+55 31 99999-1234")).toBe("31999991234");
    expect(normalizarInstagram("https://www.instagram.com/Teggly/?hl=pt")).toBe("teggly");
  });
});

describe("processarLeadEbook", () => {
  it("libera o link so depois da confirmacao do Apps Script", async () => {
    const f = vi.fn().mockResolvedValue(resp({ ok: true, status: "criado" }));
    const r = await processarLeadEbook(valido, ctx({ doFetch: f }));
    expect(r.status).toBe(200);
    if (r.status === 200) {
      expect(await verificarLink("tok", r.body.token, AGORA + 1000)).toBe(true);
      expect(r.body.duplicado).toBe(false);
    }
    const enviado = JSON.parse(f.mock.calls[0][1].body);
    expect(enviado.segredo).toBe("s1");
    expect(enviado.email).toBe("maria@exemplo.com");
  });
  it("duplicidade entrega o arquivo sem novo registro", async () => {
    const f = vi.fn().mockResolvedValue(resp({ ok: true, status: "duplicado" }));
    const r = await processarLeadEbook(valido, ctx({ doFetch: f }));
    expect(r.status === 200 && r.body.duplicado).toBe(true);
  });
  it("erro do Apps Script nao libera o arquivo", async () => {
    for (const f of [
      vi.fn().mockRejectedValue(new Error("rede")),
      vi.fn().mockResolvedValue(resp({}, false)),
      vi.fn().mockResolvedValue(resp({ ok: false })),
      vi.fn().mockResolvedValue(resp({ ok: true })),
    ]) {
      const r = await processarLeadEbook(valido, ctx({ doFetch: f }));
      expect(r.status).toBe(502);
    }
  });
  it("sem configuracao, indisponivel (nunca libera)", async () => {
    const f = vi.fn();
    const r = await processarLeadEbook(
      valido,
      ctx({ doFetch: f, config: { ...config, appsScriptUrl: undefined } }),
    );
    expect(r.status).toBe(503);
    expect(f).not.toHaveBeenCalled();
  });
  it("campos invalidos nao chamam o Apps Script", async () => {
    const f = vi.fn();
    const r = await processarLeadEbook({ ...valido, email: "ruim" }, ctx({ doFetch: f }));
    expect(r.status).toBe(422);
    expect(f).not.toHaveBeenCalled();
  });
  it("bloqueia robos: honeypot, envio rapido e sem tempo", async () => {
    const f = vi.fn();
    for (const e of [
      { ...valido, site: "http://spam" },
      { ...valido, t: AGORA - 500 },
      { ...valido, t: undefined },
    ]) {
      const r = await processarLeadEbook(
        e,
        ctx({ doFetch: f, limitador: criarLimitador(99, 1000) }),
      );
      expect(r.status).toBe(400);
    }
    expect(f).not.toHaveBeenCalled();
  });
  it("limita tentativas por IP", async () => {
    const limitador = criarLimitador(2, 60_000);
    const f = vi.fn().mockResolvedValue(resp({ ok: true, status: "criado" }));
    const codigos: number[] = [];
    for (let i = 0; i < 3; i++)
      codigos.push((await processarLeadEbook(valido, ctx({ doFetch: f, limitador }))).status);
    expect(codigos).toEqual([200, 200, 429]);
  });
  it("captcha invalido bloqueia quando configurado", async () => {
    const f = vi.fn().mockResolvedValue(resp({ success: false }));
    const r = await processarLeadEbook(
      { ...valido, captcha: "x" },
      ctx({ doFetch: f, config: { ...config, turnstileSecret: "ts" } }),
    );
    expect(r.status).toBe(400);
    expect(f).toHaveBeenCalledTimes(1);
  });
});

describe("link de download", () => {
  it("expira, rejeita adulteracao e segredo errado", async () => {
    const t = await assinarLink("tok", AGORA);
    expect(await verificarLink("tok", t, AGORA + 60_000)).toBe(true);
    expect(await verificarLink("tok", t, AGORA + 31 * 60_000)).toBe(false);
    expect(await verificarLink("outro", t, AGORA + 1000)).toBe(false);
    const [c, s] = t.split(".");
    expect(await verificarLink("tok", `${c}x.${s}`, AGORA + 1000)).toBe(false);
    expect(await verificarLink("tok", null, AGORA)).toBe(false);
    expect(await verificarLink("tok", "lixo", AGORA)).toBe(false);
  });
});

describe("integracao com o Apps Script: casos extras", () => {
  it("resposta de limite do script vira 429 e nao libera", async () => {
    const f = vi.fn().mockResolvedValue(resp({ ok: false, erro: "limite" }));
    const r = await processarLeadEbook(valido, ctx({ doFetch: f }));
    expect(r.status).toBe(429);
  });
  it("so aceita a URL /exec do Apps Script", async () => {
    expect(urlAppsScriptValida("https://script.google.com/macros/s/AKfy-1_x/exec")).toBe(true);
    for (const u of [
      undefined,
      "",
      "http://script.google.com/macros/s/A/exec",
      "https://evil.example/exec",
      "https://script.google.com/macros/s/A/dev",
    ])
      expect(urlAppsScriptValida(u)).toBe(false);
    const f = vi.fn();
    const r = await processarLeadEbook(
      valido,
      ctx({ doFetch: f, config: { ...config, appsScriptUrl: "https://evil.example/exec" } }),
    );
    expect(r.status).toBe(503);
    expect(f).not.toHaveBeenCalled();
  });
});

describe("download protegido", () => {
  const pdf = async () => new Uint8Array([37, 80, 68, 70]);
  it("sem token, token invalido, expirado ou sem segredo: 403 e nunca le o arquivo", async () => {
    const obter = vi.fn(pdf);
    const t = await assinarLink("tok", AGORA);
    for (const [token, segredo, agora] of [
      [null, "tok", AGORA],
      ["lixo", "tok", AGORA],
      [t, "outro", AGORA + 1000],
      [t, "tok", AGORA + 31 * 60_000],
      [t, undefined, AGORA + 1000],
    ] as const) {
      const r = await responderDownload(token, segredo, agora, obter);
      expect(r.status).toBe(403);
    }
    expect(obter).not.toHaveBeenCalled();
  });
  it("com link valido entrega o PDF sem cache", async () => {
    const t = await assinarLink("tok", AGORA);
    const r = await responderDownload(t, "tok", AGORA + 1000, pdf);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("application/pdf");
    expect(r.headers.get("cache-control")).toContain("no-store");
    expect(new Uint8Array(await r.arrayBuffer())).toEqual(new Uint8Array([37, 80, 68, 70]));
  });
});
