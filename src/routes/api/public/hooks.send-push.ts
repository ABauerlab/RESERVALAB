import { createFileRoute } from "@tanstack/react-router";
import { buildPushPayload } from "@block65/webcrypto-web-push";

type Body = {
  tenant_id: string;
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
};

export const Route = createFileRoute("/api/public/hooks/send-push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? request.headers.get("x-api-key");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!apikey || !expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: Body;
        try {
          payload = (await request.json()) as Body;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!payload.tenant_id) return new Response("tenant_id required", { status: 400 });

        const vapid = {
          subject: process.env.VAPID_SUBJECT,
          publicKey: process.env.VAPID_PUBLIC_KEY,
          privateKey: process.env.VAPID_PRIVATE_KEY,
        };
        if (!vapid.publicKey || !vapid.privateKey || !vapid.subject) {
          return new Response("VAPID not configured", { status: 500 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: subs, error } = await supabaseAdmin
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth")
          .eq("tenant_id", payload.tenant_id);

        if (error) return new Response(error.message, { status: 500 });
        if (!subs || subs.length === 0) return Response.json({ sent: 0 });

        const message = {
          data: {
            title: payload.title ?? "Nova reserva",
            body: payload.body ?? "Você recebeu uma nova reserva.",
            url: payload.url ?? "/",
            tag: payload.tag ?? `reserva-${Date.now()}`,
          },
          options: { ttl: 60 * 60 * 24, urgency: "high" as const },
        };

        let sent = 0;
        const toRemove: string[] = [];
        await Promise.all(
          subs.map(async (s) => {
            const sub = {
              endpoint: s.endpoint,
              expirationTime: null,
              keys: { auth: s.auth, p256dh: s.p256dh },
            };
            try {
              const req = await buildPushPayload(message, sub, vapid);
              const res = await fetch(s.endpoint, {
                method: req.method,
                headers: req.headers,
                body: req.body,
              });
              if (res.status === 404 || res.status === 410) {
                toRemove.push(s.id);
              } else if (res.ok) {
                sent++;
              } else {
                console.warn("[push] failed", res.status, await res.text().catch(() => ""));
              }
            } catch (e) {
              console.error("[push] error", e);
            }
          })
        );

        if (toRemove.length) {
          await supabaseAdmin.from("push_subscriptions").delete().in("id", toRemove);
        }

        return Response.json({ sent, removed: toRemove.length });
      },
    },
  },
});
