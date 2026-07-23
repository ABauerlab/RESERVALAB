import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/vapid-public-key")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env.VAPID_PUBLIC_KEY;
        if (!key) return new Response("VAPID key not configured", { status: 500 });
        return Response.json({ publicKey: key });
      },
    },
  },
});
