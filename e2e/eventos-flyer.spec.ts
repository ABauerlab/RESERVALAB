import { expect, test, type Page } from "@playwright/test";

import { dia, installMock } from "./support/mock";

/** Gera um PNG do tamanho pedido no próprio navegador (sem arquivos binários no repositório). */
async function png(page: Page, largura: number, altura: number): Promise<Buffer> {
  const b64 = await page.evaluate(
    ([w, h]) => {
      const c = document.createElement("canvas");
      c.width = w!;
      c.height = h!;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#b4552d";
      ctx.fillRect(0, 0, w!, h!);
      ctx.fillStyle = "#fff";
      ctx.fillRect(10, 10, w! - 20, 40);
      return c.toDataURL("image/png").split(",")[1]!;
    },
    [largura, altura],
  );
  return Buffer.from(b64, "base64");
}

const FORMATOS = [
  ["vertical", 1080, 1920],
  ["horizontal", 1920, 1080],
  ["quadrado", 1200, 1200],
  ["panorâmico", 3000, 900],
  ["pequeno", 300, 420],
] as const;

const TELAS = [
  [320, 568],
  [360, 800],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1280, 720],
] as const;

test.describe("Eventos: flyer", () => {
  test("painel: envia flyer vertical, guarda o tamanho real (reduzido sem cortar) e mostra a prévia", async ({
    page,
    context,
  }) => {
    const mock = await installMock(context);
    await page.goto("/iracema/admin/eventos");
    await expect(page.getByRole("heading", { name: "Eventos", level: 1 })).toBeVisible();

    await page.getByLabel("Título").fill("Samba de raiz");
    await page.getByLabel("Data").fill(dia(10));
    await page.getByLabel("Enviar flyer", { exact: true }).setInputFiles({
      name: "flyer.png",
      mimeType: "image/png",
      buffer: await png(page, 1080, 1920),
    });
    await expect(page.getByText("900 × 1600 px")).toBeVisible();
    await expect(page.getByText("Como aparece para o cliente")).toBeVisible();

    await page.getByRole("button", { name: "Adicionar evento" }).click();
    await expect
      .poll(
        () =>
          mock.writes.find((w) => w.method === "POST" && w.url.includes("eventos_destaque"))?.body,
      )
      .toMatchObject({ titulo: "Samba de raiz", imagem_largura: 900, imagem_altura: 1600 });
  });

  test("página pública: qualquer formato aparece inteiro, sem overflow, em todas as telas", async ({
    page,
    context,
  }) => {
    test.setTimeout(120_000);
    const mock = await installMock(context);
    const evento = mock.state.eventos[0]!;
    for (const [nome, w, h] of FORMATOS) {
      evento.imagem_url = `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect width='100%' height='100%' fill='#b4552d'/></svg>`,
      )}`;
      evento.imagem_largura = w;
      evento.imagem_altura = h;
      for (const [vw, vh] of TELAS) {
        await page.setViewportSize({ width: vw, height: vh });
        await page.goto("/iracema");
        const img = page.getByRole("img", { name: "Festa Junina" });
        await expect(img).toBeVisible();
        const m = await page.evaluate(() => {
          const el = document.querySelector("img[alt='Festa Junina']") as HTMLImageElement;
          const r = el.getBoundingClientRect();
          return {
            over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            fit: getComputedStyle(el).objectFit,
            largura: r.width,
            altura: r.height,
            vw: window.innerWidth,
            vh: window.innerHeight,
          };
        });
        const ctx = `${nome} ${vw}x${vh}`;
        expect(m.over, ctx).toBe(0);
        expect(m.fit, ctx).toBe("contain");
        expect(m.largura, ctx).toBeLessThanOrEqual(m.vw);
        expect(m.altura, ctx).toBeLessThanOrEqual(m.vh * 0.8 + 1);
      }
    }
  });

  test("tocar no flyer amplia e fecha", async ({ page, context }) => {
    const mock = await installMock(context);
    mock.state.eventos[0]!.imagem_url =
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600'%3E%3Crect width='100%25' height='100%25' fill='%23b4552d'/%3E%3C/svg%3E";
    await page.goto("/iracema");
    await page.getByRole("button", { name: /Ampliar o flyer/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Fechar flyer" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("Link Hub mostra o próximo evento e continua em uma tela", async ({ page, context }) => {
    await installMock(context);
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/iracema/links");
    await expect(page.getByRole("link", { name: /Festa Junina/ })).toBeVisible();
    const v = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(v).toBeLessThanOrEqual(0);
  });
});
