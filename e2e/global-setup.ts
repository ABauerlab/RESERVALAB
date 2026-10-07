import { chromium } from "@playwright/test";

/**
 * O Vite otimiza dependencias na primeira carga e recarrega a pagina. Aquece o servidor de dev
 * uma vez antes dos testes para que nenhuma navegacao de teste caia nessa recarga.
 */
export default async function globalSetup() {
  const executablePath = process.env.PW_CHROMIUM_PATH || undefined;
  const browser = await chromium.launch(
    executablePath ? { executablePath, args: ["--no-sandbox"] } : {},
  );
  const page = await browser.newPage();
  for (const path of ["/", "/iracema/admin/agenda", "/iracema/reservar/mesa"]) {
    await page.goto(`http://127.0.0.1:5199${path}`, { waitUntil: "load" }).catch(() => undefined);
    await page.waitForTimeout(4000);
  }
  await browser.close();
}
