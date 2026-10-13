/**
 * Verificacao server-side do Cloudflare Turnstile. So vale como protecao se o token for verificado
 * aqui: o widget no navegador sozinho nao protege nada.
 */
export type CaptchaResultado = "ok" | "invalido" | "indisponivel";

export async function verificarTurnstile(
  token: string | null | undefined,
  secret: string,
  ip: string | null,
  doFetch: typeof fetch = fetch,
): Promise<CaptchaResultado> {
  if (!token || token.length > 2048) return "invalido";
  try {
    const corpo = new URLSearchParams({ secret, response: token });
    if (ip) corpo.set("remoteip", ip);
    const r = await doFetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: corpo,
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return "indisponivel";
    const j = (await r.json()) as { success?: boolean };
    return j.success === true ? "ok" : "invalido";
  } catch {
    return "indisponivel";
  }
}
