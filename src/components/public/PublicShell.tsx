import { useMarcaLogo } from "@/components/public/MarcaScope";
import { cn } from "@/lib/utils";

/**
 * Casca das paginas publicas do restaurante (Cardapio, Link Hub). A identidade do restaurante vem
 * primeiro; o Teggly aparece como infraestrutura ("powered by"). O slot `marca` fica pronto para o
 * logo do restaurante quando o white-label for ativado.
 */
export function PublicShell({
  nome,
  marca,
  subtitulo,
  children,
  rodape = true,
  className,
}: {
  nome: string;
  marca?: React.ReactNode;
  subtitulo?: string;
  children: React.ReactNode;
  rodape?: boolean;
  className?: string;
}) {
  const logo = useMarcaLogo();
  return (
    <main className="min-h-screen bg-background">
      <div
        className={cn(
          "mx-auto flex min-h-screen max-w-xl flex-col px-5 pb-10 pt-10 safe-top safe-bottom",
          className,
        )}
      >
        <header className="text-center">
          {marca ??
            (logo && (
              <img
                src={logo}
                alt={`Logo ${nome}`}
                className="mx-auto mb-4 h-16 w-auto max-w-[200px] object-contain"
              />
            ))}
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
            {nome}
          </h1>
          {subtitulo && <p className="mt-1.5 text-sm text-muted-foreground">{subtitulo}</p>}
        </header>
        <div className="mt-8 flex-1">{children}</div>
        {rodape && (
          <footer className="mt-12 flex flex-col items-center gap-1.5 text-center">
            <p className="text-xs text-muted-foreground">powered by</p>
            <img
              src="/brand/Teggly_Logo_Primary.svg"
              alt="Teggly"
              width={96}
              height={23}
              className="h-[23px] w-24"
            />
          </footer>
        )}
      </div>
    </main>
  );
}

export function EstadoPublico({
  titulo,
  texto,
  acao,
}: {
  titulo: string;
  texto: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <p className="text-lg font-semibold text-foreground">{titulo}</p>
      <p className="mt-1.5 text-sm text-muted-foreground">{texto}</p>
      {acao && <div className="mt-5 flex justify-center">{acao}</div>}
    </div>
  );
}
