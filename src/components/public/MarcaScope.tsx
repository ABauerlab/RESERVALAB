import { createContext, useContext, type CSSProperties } from "react";
import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { fetchMarca, temaDaMarca } from "@/lib/marca";

const LogoContext = createContext<string | null>(null);

/** Logo da empresa, so quando ela ligou "usar minha marca" e o endereco e http(s). */
export function useMarcaLogo(): string | null {
  return useContext(LogoContext);
}

/**
 * Aplica a marca da empresa (cor de acao e logo) as paginas publicas, apenas se ela optou.
 * Sem opt-in, erro ou cor sem contraste: nada muda e o visual e o do Teggly.
 */
export function MarcaScope({ slug, children }: { slug: string; children: React.ReactNode }) {
  const marcaQ = useQuery({
    queryKey: ["marca", slug],
    queryFn: () => fetchMarca(slug),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const tema = temaDaMarca(marcaQ.data?.cor);
  const logo =
    marcaQ.data?.logo_url && /^https?:\/\//i.test(marcaQ.data.logo_url)
      ? marcaQ.data.logo_url
      : null;
  return (
    <LogoContext.Provider value={logo}>
      <div className="contents" style={(tema ?? undefined) as CSSProperties | undefined}>
        {children}
      </div>
    </LogoContext.Provider>
  );
}

/** Envolve o componente de uma rota publica `/$slug/...` com a marca da empresa. */
export function comMarca(Componente: () => React.ReactNode): () => React.ReactNode {
  function ComMarca() {
    const { slug } = useParams({ strict: false }) as { slug: string };
    return (
      <MarcaScope slug={slug}>
        <Componente />
      </MarcaScope>
    );
  }
  return ComMarca;
}
