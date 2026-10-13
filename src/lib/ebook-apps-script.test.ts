/**
 * Executa o arquivo real docs/ebook/apps-script.gs com um Google Sheets simulado em memoria.
 * Garante que o codigo que sera colado no Apps Script grava, valida e evita duplicidade.
 */
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const CODIGO = readFileSync(new URL("../../docs/ebook/apps-script.gs", import.meta.url), "utf8");
const SEGREDO = "segredo-de-teste-1234567890";

type Ambiente = {
  props: Record<string, string>;
  linhas: unknown[][];
  abas: string[];
  logs: string[];
  formatos: Record<string, string>;
};

function criarAmbiente(props: Record<string, string> = { SEGREDO }) {
  const amb: Ambiente = { props: { ...props }, linhas: [], abas: [], logs: [], formatos: {} };
  const cacheDados = new Map<string, string>();
  const range = (linha: number, coluna: number, nl = 1, nc = 1) => ({
    setValues(v: unknown[][]) {
      for (let i = 0; i < nl; i++) {
        const alvo = (amb.linhas[linha - 1 + i] ??= []);
        for (let j = 0; j < nc; j++) alvo[coluna - 1 + j] = v[i][j];
      }
      return this;
    },
    setValue(v: unknown) {
      return this.setValues([[v]]);
    },
    getValues() {
      return Array.from({ length: nl }, (_, i) =>
        Array.from({ length: nc }, (_, j) => amb.linhas[linha - 1 + i]?.[coluna - 1 + j] ?? ""),
      );
    },
    setNumberFormat(f: string) {
      for (let i = 0; i < nl; i++)
        for (let j = 0; j < nc; j++) amb.formatos[`${linha + i}:${coluna + j}`] = f;
      return this;
    },
    setFontWeight() {
      return this;
    },
  });
  const aba = {
    getName: () => "Leads",
    getLastRow: () => amb.linhas.length,
    getRange: range,
    setFrozenRows() {},
  };
  const sandbox = {
    console: { log: (m: string) => amb.logs.push(String(m)) },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (t: string) => ({
        texto: t,
        setMimeType() {
          return this;
        },
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: (k: string) => amb.props[k] ?? null }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k: string) => cacheDados.get(k) ?? null,
        put: (k: string, v: string) => void cacheDados.set(k, v),
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    SpreadsheetApp: {
      flush() {},
      getActiveSpreadsheet: () => ({
        getSheetByName: (n: string) => (amb.abas.includes(n) ? aba : null),
        insertSheet: (n: string) => (amb.abas.push(n), aba),
      }),
    },
  };
  runInNewContext(CODIGO, sandbox);
  const chamar = (corpo: unknown, bruto?: string) =>
    JSON.parse(
      (sandbox as unknown as { doPost: (e: unknown) => { texto: string } }).doPost({
        postData: { contents: bruto ?? JSON.stringify(corpo) },
      }).texto,
    );
  return { amb, sandbox: sandbox as unknown as Record<string, () => unknown>, chamar };
}

const lead = {
  segredo: SEGREDO,
  nome: "Maria Souza",
  negocio: "Bistrô da Maria",
  email: "Maria@Exemplo.com",
  whatsapp: "31999991234",
  instagram: "bistrodamaria",
  origem: "ebook",
  aviso_versao: "2026-10-12",
};

describe("apps-script.gs (codigo real)", () => {
  it("cria a aba Leads com cabecalhos e grava um lead valido", () => {
    const { amb, chamar } = criarAmbiente();
    expect(chamar(lead)).toEqual({ ok: true, status: "criado" });
    expect(amb.abas).toEqual(["Leads"]);
    expect(amb.linhas[0]).toEqual([
      "recebido_em",
      "nome",
      "negocio",
      "email",
      "whatsapp",
      "instagram",
      "origem",
      "aviso_versao",
    ]);
    expect(amb.linhas).toHaveLength(2);
    expect(amb.linhas[1].slice(1)).toEqual([
      "Maria Souza",
      "Bistrô da Maria",
      "maria@exemplo.com",
      "31999991234",
      "bistrodamaria",
      "ebook",
      "2026-10-12",
    ]);
  });
  it("e-mail repetido (mesmo com outra caixa) nao cria linha nova", () => {
    const { amb, chamar } = criarAmbiente();
    chamar(lead);
    expect(chamar({ ...lead, email: " MARIA@exemplo.com ", nome: "Outro Nome" })).toEqual({
      ok: true,
      status: "duplicado",
    });
    expect(amb.linhas).toHaveLength(2);
  });
  it("campos invalidos nao gravam", () => {
    const { amb, chamar } = criarAmbiente();
    for (const parte of [
      { nome: "A" },
      { negocio: "" },
      { email: "x" },
      { whatsapp: "123" },
      { instagram: "a b" },
    ]) {
      expect(chamar({ ...lead, ...parte })).toEqual({ ok: false, erro: "dados_invalidos" });
    }
    expect(amb.linhas.slice(1)).toHaveLength(0);
  });
  it("segredo errado, ausente ou nao configurado nao grava", () => {
    const { amb, chamar } = criarAmbiente();
    expect(chamar({ ...lead, segredo: "errado" })).toEqual({ ok: false, erro: "nao_autorizado" });
    expect(chamar({ ...lead, segredo: null })).toEqual({ ok: false, erro: "nao_autorizado" });
    expect(amb.linhas).toHaveLength(0);
    const sem = criarAmbiente({});
    expect(sem.chamar({ ...lead, segredo: null })).toEqual({ ok: false, erro: "nao_configurado" });
    expect(sem.amb.linhas).toHaveLength(0);
  });
  it("corpo invalido ou grande demais", () => {
    const { chamar } = criarAmbiente();
    expect(chamar(null, "{nao e json")).toEqual({ ok: false, erro: "json" });
    expect(chamar(null, JSON.stringify({ ...lead, nome: "x".repeat(5000) }))).toEqual({
      ok: false,
      erro: "json",
    });
  });
  it("limita envios repetidos do mesmo e-mail", () => {
    const { chamar } = criarAmbiente();
    const r = Array.from({ length: 7 }, () => chamar(lead));
    expect(r.slice(0, 5).every((x) => x.ok)).toBe(true);
    expect(r[5]).toEqual({ ok: false, erro: "limite" });
  });
  it("nao escreve segredo nem dados pessoais no log", () => {
    const { amb, chamar, sandbox } = criarAmbiente();
    chamar(lead);
    sandbox.configurar();
    const tudo = amb.logs.join("\n");
    expect(tudo).not.toContain(SEGREDO);
    expect(tudo).not.toContain("exemplo.com");
  });
  it("valores com = nao viram formula (gravados como texto)", () => {
    const { amb, chamar } = criarAmbiente();
    chamar({ ...lead, nome: "=HYPERLINK(1)" });
    expect(amb.linhas[1][1]).toBe("=HYPERLINK(1)");
    // Formato "@" (texto puro) nas colunas B a H da linha gravada: o Sheets nao avalia formula.
    for (let col = 2; col <= 8; col++) expect(amb.formatos[`2:${col}`]).toBe("@");
  });
});
