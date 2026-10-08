import { expect, test } from "@playwright/test";

import { installMock } from "./support/mock";

/** QA responsivo: sem rolagem horizontal nem corte nas telas principais, em todos os tamanhos. */
const TAMANHOS: Array<[string, number, number]> = [
  ["mobile 320", 320, 568],
  ["mobile 360", 360, 800],
  ["mobile 390", 390, 844],
  ["mobile 393", 393, 852],
  ["mobile 430", 430, 932],
  ["tablet 768", 768, 1024],
  ["tablet 820", 820, 1180],
  ["tablet 834", 834, 1194],
  ["tablet 1024", 1024, 1366],
  ["desktop 1280", 1280, 720],
  ["desktop 1366", 1366, 768],
  ["desktop 1440", 1440, 900],
  ["desktop 1536", 1536, 864],
  ["desktop 1920", 1920, 1080],
];

const PAGINAS = [
  "/",
  "/iracema",
  "/iracema/links",
  "/iracema/cardapio",
  "/iracema/reservar/mesa",
  "/iracema/admin",
  "/iracema/admin/reservas",
  "/iracema/admin/agenda",
  "/iracema/admin/links",
  "/iracema/admin/cardapio",
  "/iracema/admin/configuracoes",
];

test.describe("QA responsivo", () => {
  test.skip(({ isMobile }) => isMobile, "os tamanhos são definidos no próprio teste");

  for (const [nome, w, h] of TAMANHOS) {
    test(`sem overflow horizontal em ${nome}`, async ({ page, context }) => {
      test.setTimeout(120_000);
      await installMock(context);
      await page.setViewportSize({ width: w, height: h });
      for (const rota of PAGINAS) {
        await page.goto(rota);
        await page.waitForTimeout(450);
        const over = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(over, `${rota} em ${w}x${h}`).toBeLessThanOrEqual(1);
      }
    });
  }

  test("alvos de toque do painel e do Link Hub têm pelo menos 44 px no celular", async ({
    page,
    context,
  }) => {
    await installMock(context);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const rota of ["/iracema/links", "/iracema/admin"]) {
      await page.goto(rota);
      await page.waitForTimeout(500);
      const pequenos = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>("a[href], button"))
          .filter((el) => {
            const r = el.getBoundingClientRect();
            const visivel =
              r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
            return visivel && (r.height < 43.5 || r.width < 43.5);
          })
          .map(
            (el) =>
              `${el.tagName} "${(el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`,
          ),
      );
      expect(pequenos, rota).toEqual([]);
    }
  });
});
