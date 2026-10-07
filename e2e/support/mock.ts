import fs from "node:fs";
import path from "node:path";
import type { BrowserContext, Page, Request, WebSocketRoute } from "@playwright/test";

import { addDaysISO, todayISO } from "../../src/lib/datetime";

/**
 * Supabase simulado para os testes E2E: REST, RPC, auth e realtime (Phoenix). Nenhum teste fala com
 * o banco real nem dispara WhatsApp/push.
 */

function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  const file = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)="?([^"\n]*)"?$/);
    if (m) out[m[1]!] = m[2]!;
  }
  return out;
}

const env = { ...loadEnv(), ...process.env } as Record<string, string>;
export const SUPABASE_URL = env.VITE_SUPABASE_URL ?? "https://example.supabase.co";
const REF = new URL(SUPABASE_URL).hostname.split(".")[0]!;
export const TENANT_ID = "11111111-1111-1111-1111-111111111111";

export type Mode = "data" | "empty" | "error";
export type Row = Record<string, unknown>;

export const dia = (offset = 0) => addDaysISO(todayISO(), offset);

const tenant = {
  id: TENANT_ID,
  slug: "iracema",
  nome: "Iracema",
  ativo: true,
  logo_url: null,
  cor_primaria: "#B4552D",
  whatsapp: "5531999999999",
  telefone_contato: "(31) 99999-9999",
  email_contato: "contato@iracema.test",
  endereco: "Rua das Flores, 120",
  tipos_aceitos: ["mesa", "aniversario", "evento", "casamento"],
  mensagem_confirmacao: "Ola {nome}!",
  mensagem_cancelamento: "Ola {nome}, cancelada.",
  mensagem_reconfirmacao: "Ola {nome}, confirma?",
  pixel_facebook_id: null,
  observacao_area: null,
  horario_limite_semana: "22:00",
  horario_limite_fim_semana: "23:00",
  created_at: dia(-90),
  updated_at: dia(-1),
};

export function reserva(
  i: number,
  nome: string,
  status: string,
  d: number,
  horario: string | null,
  quantidade: number,
  extra: Row = {},
): Row {
  const agora = new Date().toISOString();
  return {
    id: `r${i}`,
    tenant_id: TENANT_ID,
    nome,
    telefone: "31988887777",
    tipo: "mesa",
    status,
    data: dia(d),
    horario,
    quantidade,
    area: "salao",
    observacoes: null,
    codigo_acompanhamento: `RL-AB${100 + i}`,
    comandas: null,
    leva_bolo: null,
    tipo_evento: null,
    motivo_cancelamento: null,
    reconfirmada_em: null,
    created_at: agora,
    updated_at: agora,
    ...extra,
  };
}

function fixtures(): { reservas: Row[]; bloqueios: Row[]; feriados: Row[]; eventos: Row[] } {
  return {
    reservas: [
      reserva(1, "Marina Alves", "pendente", 0, "11:30:00", 4),
      reserva(2, "Rafael Lima", "confirmada", 0, "12:00:00", 2),
      reserva(3, "Joana Prado", "confirmada", 0, "12:10:00", 6),
      reserva(4, "Estudio Norte", "confirmada", 0, "13:00:00", 56),
      reserva(5, "Joao Pedro", "cancelada", 0, "13:30:00", 6),
      reserva(6, "Casamento Silva", "confirmada", 0, null, 80),
      reserva(7, "Paulo Henrique", "confirmada", 1, "12:00:00", 4),
      reserva(8, "Julia Prado", "pendente", 1, "13:00:00", 10),
    ],
    bloqueios: [
      {
        id: "b1",
        tenant_id: TENANT_ID,
        data: dia(0),
        hora_inicio: "12:00:00",
        hora_fim: "15:00:00",
        motivo: "Evento privado",
        created_at: dia(-1),
        updated_at: dia(-1),
      },
    ],
    feriados: [
      { id: "f1", tenant_id: TENANT_ID, data: dia(3), motivo: "Feriado", created_at: dia(-1) },
    ],
    eventos: [
      {
        id: "e1",
        tenant_id: TENANT_ID,
        titulo: "Festa Junina",
        descricao: null,
        data: dia(0),
        horario: null,
        imagem_url: null,
        created_at: dia(-1),
      },
    ],
  };
}

function sessionJson() {
  const b = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 86400 * 30;
  const jwt = `${b({ alg: "HS256", typ: "JWT" })}.${b({ sub: "u1", aud: "authenticated", role: "authenticated", exp })}.sig`;
  return {
    access_token: jwt,
    token_type: "bearer",
    expires_in: 2592000,
    expires_at: exp,
    refresh_token: "rt",
    user: {
      id: "u1",
      aud: "authenticated",
      role: "authenticated",
      email: "admin@iracema.test",
      user_metadata: {},
      app_metadata: {},
    },
  };
}

export type Mock = {
  state: ReturnType<typeof fixtures>;
  mode: Mode;
  /** Chamadas de escrita (PATCH/POST/DELETE) e RPCs recebidas. */
  writes: Array<{ method: string; url: string; body: unknown }>;
  rpcs: Array<{ name: string; body: unknown }>;
  /** Contagem de GET em /rest/v1/reservas (para checar refetch). */
  reservasGets: () => number;
  /** Simula um evento do Realtime (postgres_changes) para o canal cujo nome contem `canal`. */
  pushRealtime: (canal: string, type: "INSERT" | "UPDATE" | "DELETE", record: Row) => void;
  setMode: (m: Mode) => void;
};

function applyFilters(rows: Row[], url: URL): Row[] {
  let out = rows;
  for (const [k, v] of url.searchParams.entries()) {
    const m = v.match(/^(eq|neq|gte|lte|is)\.(.*)$/);
    if (!m || !["data", "status", "tenant_id", "id", "reconfirmada_em"].includes(k)) continue;
    const [, op, val] = m;
    out = out.filter((r) => {
      const x = r[k];
      if (op === "eq") return String(x) === val;
      if (op === "neq") return String(x) !== val;
      if (op === "gte") return x != null && String(x) >= val!;
      if (op === "lte") return x != null && String(x) <= val!;
      if (op === "is") return val === "null" ? x == null : true;
      return true;
    });
  }
  return out;
}

export async function installMock(context: BrowserContext, initial: Mode = "data"): Promise<Mock> {
  const mock: Mock = {
    state: fixtures(),
    mode: initial,
    writes: [],
    rpcs: [],
    reservasGets: () => 0,
    pushRealtime: () => undefined,
    setMode: (m) => {
      mock.mode = m;
    },
  };
  let reservasGetCount = 0;
  mock.reservasGets = () => reservasGetCount;

  await context.addInitScript(
    ([k, v]) => {
      try {
        localStorage.setItem(k as string, v as string);
      } catch {
        /* sem storage */
      }
    },
    [`sb-${REF}-auth-token`, JSON.stringify(sessionJson())],
  );

  const json = (
    route: import("@playwright/test").Route,
    body: unknown,
    status = 200,
    headers = {},
  ) =>
    route.fulfill({
      status,
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": "*",
        "access-control-expose-headers": "content-range",
        ...headers,
      },
      body: JSON.stringify(body),
    });

  await context.route(
    new RegExp("^" + SUPABASE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "/.*"),
    async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const p = url.pathname;
      const method = req.method();
      if (method === "OPTIONS") {
        return route.fulfill({
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "*",
            "access-control-allow-methods": "*",
          },
        });
      }
      if (p.startsWith("/auth/v1")) return json(route, sessionJson().user);

      if (p.includes("/rpc/")) {
        const name = p.split("/rpc/")[1]!;
        let body: unknown = null;
        try {
          body = req.postDataJSON();
        } catch {
          body = null;
        }
        mock.rpcs.push({ name, body });
        if (name === "has_tenant_role") return json(route, true);
        if (name === "has_role") return json(route, false);
        if (name === "criar_reserva") return json(route, "RL-TESTE1");
        if (name === "confirmar_reserva_sem_notificar") return json(route, mock.state.reservas[0]);
        if (name === "bloqueios_do_tenant") return json(route, []);
        if (name === "feriados_do_tenant") return json(route, []);
        if (name === "proximo_evento_do_tenant") return json(route, []);
        return json(route, []);
      }

      const table = p.split("/rest/v1/")[1] ?? "";
      const isReservasGet = table === "reservas" && method === "GET";
      if (isReservasGet) reservasGetCount += 1;

      if (method === "PATCH" || method === "POST" || method === "DELETE") {
        let body: unknown = null;
        try {
          body = req.postDataJSON();
        } catch {
          body = null;
        }
        mock.writes.push({ method, url: req.url(), body });
        if (table === "reservas" && method === "PATCH") {
          const alvo = applyFilters(mock.state.reservas, url);
          for (const r of alvo) Object.assign(r, body as Row);
          return json(route, alvo, 200, { "content-range": `0-${alvo.length}/*` });
        }
        if (table === "reservas" && method === "DELETE") {
          const ids = new Set(applyFilters(mock.state.reservas, url).map((r) => r.id));
          mock.state.reservas = mock.state.reservas.filter((r) => !ids.has(r.id));
          return json(route, [], 200);
        }
        return json(route, [], 201);
      }

      if (mock.mode === "error" && isReservasGet && url.searchParams.get("limit") === "500") {
        return json(route, { message: "falha simulada", code: "500" }, 500);
      }

      const vazio = mock.mode === "empty";
      const rows: Row[] =
        (
          {
            tenants: [tenant],
            reservas: vazio ? [] : applyFilters(mock.state.reservas, url),
            agenda_bloqueios: vazio ? [] : applyFilters(mock.state.bloqueios, url),
            feriados: vazio ? [] : applyFilters(mock.state.feriados, url),
            eventos_destaque: vazio ? [] : applyFilters(mock.state.eventos, url),
          } as Record<string, Row[]>
        )[table] ?? [];

      if (method === "HEAD") {
        return route.fulfill({
          status: 200,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-expose-headers": "content-range",
            "content-range": `0-0/${rows.length}`,
          },
        });
      }
      const single = (req.headers()["accept"] ?? "").includes("vnd.pgrst.object");
      if (single) {
        return route.fulfill({
          status: rows.length ? 200 : 406,
          contentType: "application/json",
          headers: { "access-control-allow-origin": "*" },
          body: JSON.stringify(rows.length ? rows[0] : { message: "none" }),
        });
      }
      return json(route, rows, 200, {
        "content-range": rows.length ? `0-${rows.length - 1}/${rows.length}` : "*/0",
      });
    },
  );

  // Realtime (Phoenix): aceita os joins e permite empurrar eventos.
  const canais: Array<{
    ws: WebSocketRoute;
    topic: string;
    pcs: Array<{ id: number; event: string; [k: string]: unknown }>;
  }> = [];
  let nextId = 1;
  await context.routeWebSocket(/realtime/, (ws) => {
    ws.onMessage((msg) => {
      let m: [
        string | null,
        string | null,
        string,
        string,
        { config?: { postgres_changes?: Array<{ event: string }> } } | undefined,
      ];
      try {
        m = JSON.parse(String(msg));
      } catch {
        return;
      }
      const [jr, ref, topic, ev, payload] = m;
      if (ev === "heartbeat") {
        ws.send(JSON.stringify([jr, ref, "phoenix", "phx_reply", { status: "ok", response: {} }]));
      } else if (ev === "phx_join") {
        const pcs = ((payload?.config?.postgres_changes ?? []) as Array<{ event: string }>).map(
          (c) => ({ ...c, id: nextId++ }),
        );
        canais.push({ ws, topic, pcs });
        ws.send(
          JSON.stringify([
            jr,
            ref,
            topic,
            "phx_reply",
            { status: "ok", response: { postgres_changes: pcs } },
          ]),
        );
      }
    });
  });
  mock.pushRealtime = (canal, type, record) => {
    const c = canais.find((x) => x.topic.includes(canal));
    if (!c) throw new Error(`canal realtime nao encontrado: ${canal}`);
    const ids = c.pcs.filter((p) => p.event === type || p.event === "*").map((p) => p.id);
    c.ws.send(
      JSON.stringify([
        null,
        null,
        c.topic,
        "postgres_changes",
        {
          ids,
          data: {
            schema: "public",
            table: "reservas",
            type,
            record: type === "DELETE" ? null : record,
            old_record: type === "INSERT" ? null : { id: record.id },
            columns: [],
            commit_timestamp: new Date().toISOString(),
            errors: null,
          },
        },
      ]),
    );
  };

  await context.route("**/fonts.googleapis.com/**", (r) => r.abort());
  await context.route("**/fonts.gstatic.com/**", (r) => r.abort());
  return mock;
}

export async function esperarRequisicao(
  page: Page,
  metodo: string,
  trecho: string,
): Promise<Request> {
  return page.waitForRequest((r) => r.method() === metodo && r.url().includes(trecho));
}
