import { createFileRoute } from "@tanstack/react-router";

import { responderDownload } from "@/lib/ebook";

export const Route = createFileRoute("/api/public/ebook-download")({
  server: {
    handlers: {
      GET: ({ request }) =>
        responderDownload(
          new URL(request.url).searchParams.get("t"),
          process.env.EBOOK_TOKEN_SECRET,
          Date.now(),
          async () => {
            // O arquivo fica so no codigo do servidor (nao em /public): so sai com link assinado.
            const { default: dataUri } =
              await import("@/assets/ebook/Teggly_Guia_Reservas_Organizadas.pdf?inline");
            return Uint8Array.from(atob(dataUri.split(",")[1] ?? ""), (c) => c.charCodeAt(0));
          },
        ),
    },
  },
});
