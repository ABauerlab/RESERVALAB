import { createFileRoute } from "@tanstack/react-router";

/**
 * Manifest dinâmico do PWA.
 *
 * O app instalável é sempre uma área de trabalho (admin da empresa ou painel
 * master) — nunca a landing page. O caminho de abertura vem em `?start=`.
 */
export const Route = createFileRoute("/api/public/manifest.webmanifest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const raw = url.searchParams.get("start") ?? "/";
        // Aceita apenas caminhos internos simples.
        const start = /^\/[A-Za-z0-9\-_/]*$/.test(raw) ? raw : "/";
        const name = url.searchParams.get("name")?.slice(0, 40) || "ReservaLab";

        const manifest = {
          id: start,
          name,
          short_name: name.slice(0, 12),
          description: "Painel de reservas ReservaLab.",
          start_url: start,
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          background_color: "#f3f5fa",
          theme_color: "#101b33",
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        };

        return new Response(JSON.stringify(manifest), {
          headers: {
            "content-type": "application/manifest+json; charset=utf-8",
            "cache-control": "public, max-age=60",
          },
        });
      },
    },
  },
});
