import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal/LegalPage";
import { PRIVACIDADE } from "@/lib/legal";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Aviso de Privacidade · Teggly" },
      {
        name: "description",
        content: "Como o Teggly trata dados pessoais, seus direitos e como falar com a gente.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/privacidade` }],
  }),
  component: () => <LegalPage titulo="Aviso de Privacidade" secoes={PRIVACIDADE} />,
});
