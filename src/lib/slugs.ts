/**
 * Caminhos institucionais do site. Um restaurante nunca pode ter slug igual a um deles, senao a
 * pagina da casa colidiria com uma pagina do Teggly. Manter em sincronia com a lista da funcao
 * `supabase/functions/create-company/index.ts` (ela nao importa deste arquivo).
 */
export const SLUGS_RESERVADOS: readonly string[] = [
  "admin",
  "ajuda",
  "api",
  "app",
  "blog",
  "cadastro",
  "checkout",
  "contato",
  "cookies",
  "demo",
  "demonstracao",
  "ebook",
  "entrar",
  "login",
  "marca",
  "master",
  "obrigado",
  "pagamento",
  "planos",
  "politica-de-privacidade",
  "privacidade",
  "robots-txt",
  "sitemap-xml",
  "sobre",
  "suporte",
  "teggly",
  "termos",
  "termos-de-uso",
  "vsl",
  "www",
];

export function isSlugReservado(slug: string): boolean {
  return SLUGS_RESERVADOS.includes(
    String(slug ?? "")
      .toLowerCase()
      .trim(),
  );
}
