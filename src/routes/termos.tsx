import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal/LegalPage";
import { TERMOS } from "@/lib/legal";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso · Teggly" },
      {
        name: "description",
        content: "Termos de Uso do Teggly: planos, pagamento, responsabilidades e cancelamento.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/termos` }],
  }),
  component: () => <LegalPage titulo="Termos de Uso" secoes={TERMOS} />,
});
