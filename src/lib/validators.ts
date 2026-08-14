const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,40}$/;

export function slugify(v: string): string {
  return String(v ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-");
}

export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

export function isValidEmail(email: string | null | undefined): boolean {
  return EMAIL_REGEX.test(email ?? "");
}

export function isValidNome(nome: string | null | undefined): boolean {
  return !!nome && nome.trim().length >= 2;
}

export function isValidSenha(senha: string | null | undefined): boolean {
  return !!senha && senha.length >= 6;
}
