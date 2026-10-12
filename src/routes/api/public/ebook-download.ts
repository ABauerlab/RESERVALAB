import { createFileRoute } from "@tanstack/react-router";

import { verificarLink } from "@/lib/ebook";

export const Route = createFileRoute("/api/public/ebook-download")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.EBOOK_TOKEN_SECRET;
        const token = new URL(request.url).searchParams.get("t");
        if (!secret || !(await verificarLink(secret, token, Date.now())))
          return new Response("Link inválido ou expirado. Peça o guia de novo em /ebook.", {
            status: 403,
            headers: { "Cache-Control": "no-store" },
          });
        // O arquivo fica so no codigo do servidor (nao em /public), entao so sai com link assinado.
        const { default: dataUri } =
          await import("@/assets/ebook/Teggly_Guia_Reservas_Organizadas.pdf?inline");
        const bytes = Uint8Array.from(atob(dataUri.split(",")[1] ?? ""), (c) => c.charCodeAt(0));
        return new Response(bytes, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="Teggly_Guia_Reservas_Organizadas.pdf"',
            "Cache-Control": "private, no-store",
            "X-Robots-Tag": "noindex",
          },
        });
      },
    },
  },
});
