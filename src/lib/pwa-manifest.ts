/**
 * Links de <head> que tornam uma rota instalável como PWA.
 *
 * Só as áreas de trabalho (admin de cada empresa e painel master) recebem
 * manifest — a landing page não é instalável de propósito.
 */
export function pwaHeadLinks(startPath: string, name: string) {
  const href = `/api/public/manifest.webmanifest?start=${encodeURIComponent(startPath)}&name=${encodeURIComponent(name)}`;
  return [{ rel: "manifest", href }];
}
