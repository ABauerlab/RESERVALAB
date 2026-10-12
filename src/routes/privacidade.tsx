import { createFileRoute, Link } from "@tanstack/react-router";

import { EMAIL_CONTATO } from "@/lib/site";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [{ title: "Privacidade · Teggly" }, { name: "robots", content: "noindex" }],
  }),
  component: Privacidade,
});

// PENDENTE (bloqueador de lancamento): o texto da Politica de Privacidade precisa ser fornecido ou
// aprovado pelo responsavel legal. Nao escrever texto juridico aqui sem essa aprovacao.
function Privacidade() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-20">
      <h1 className="text-3xl font-extrabold tracking-[-0.03em]">Política de Privacidade</h1>
      <p className="mt-4 text-slate-600">
        Esta página está em revisão e será publicada em breve. Dúvidas sobre dados pessoais:{" "}
        <a className="font-semibold text-blue-700 underline" href={`mailto:${EMAIL_CONTATO}`}>
          {EMAIL_CONTATO}
        </a>
        .
      </p>
      <Link to="/" className="mt-8 inline-flex min-h-11 items-center font-semibold text-blue-700">
        Voltar ao início
      </Link>
    </main>
  );
}
