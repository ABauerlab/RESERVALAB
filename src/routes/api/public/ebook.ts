import { createFileRoute } from "@tanstack/react-router";

import { criarLimitador, processarLeadEbook } from "@/lib/ebook";

// Melhor esforco por instancia do servidor. O Apps Script aplica o seu proprio limite.
const limitador = criarLimitador(5, 10 * 60_000);

export const Route = createFileRoute("/api/public/ebook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let corpo: Record<string, unknown>;
        try {
          corpo = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ ok: false, codigo: "envio_recusado" }, { status: 400 });
        }
        const ip =
          request.headers.get("cf-connecting-ip") ??
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          null;
        const r = await processarLeadEbook(corpo, {
          ip,
          agora: Date.now(),
          limitador,
          config: {
            appsScriptUrl: process.env.EBOOK_APPS_SCRIPT_URL,
            appsScriptSecret: process.env.EBOOK_APPS_SCRIPT_SECRET,
            tokenSecret: process.env.EBOOK_TOKEN_SECRET,
            turnstileSecret: process.env.TURNSTILE_SECRET_KEY,
          },
        });
        return Response.json(r.body, {
          status: r.status,
          headers: { "Cache-Control": "no-store" },
        });
      },
    },
  },
});
