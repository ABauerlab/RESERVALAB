import { Link } from "@tanstack/react-router";

import { DATA_TEXTOS, VERSAO_TEXTOS, type Secao } from "@/lib/legal";

export function LegalPage({ titulo, secoes }: { titulo: string; secoes: Secao[] }) {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5">
          <Link to="/" aria-label="Teggly, página inicial" className="flex min-h-11 items-center">
            <img
              src="/brand/Teggly_Logo_Primary.svg"
              alt="Teggly"
              width={118}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
          <nav aria-label="Textos legais" className="ml-auto flex gap-4 text-sm font-medium">
            <Link
              to="/privacidade"
              className="flex min-h-11 items-center text-slate-700 hover:text-foreground"
            >
              Privacidade
            </Link>
            <Link
              to="/termos"
              className="flex min-h-11 items-center text-slate-700 hover:text-foreground"
            >
              Termos de Uso
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-14 md:py-20">
        <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-4xl">
          {titulo}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Versão {VERSAO_TEXTOS} · Atualizado em {DATA_TEXTOS}
        </p>
        {secoes.map((s) => (
          <section key={s.titulo} className="mt-10">
            <h2 className="text-xl font-semibold">{s.titulo}</h2>
            {s.paragrafos?.map((p) => (
              <p key={p} className="mt-3 leading-relaxed text-slate-700">
                {p}
              </p>
            ))}
            {s.itens && (
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-slate-700">
                {s.itens.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
