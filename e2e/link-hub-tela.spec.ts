import { expect, test } from "@playwright/test";

import { installMock, TENANT_ID } from "./support/mock";

const MAPA =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3750.0!2d-43.9!3d-19.9!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sBar!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr";
const IFRAME = `<iframe src="${MAPA.replace(/&/g, "&amp;")}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`;

const MAPA_GOOGLE =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3751.138297681434!2d-43.92750982388556!3d-19.918576137954766!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa699cf9028e6f3%3A0x98fd4b62d5e43837!2sIracema!5e0!3m2!1spt-BR!2sbr!4v1791482620558!5m2!1spt-BR!2sbr";
const IFRAME_GOOGLE = `<iframe src="${MAPA_GOOGLE}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;

const TELAS = [
  [320, 568],
  [360, 800],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
] as const;

test.describe("Link Hub em uma tela", () => {
  test("cabe na tela, sem rolagem nem overflow, em todos os tamanhos", async ({
    page,
    context,
  }) => {
    const mock = await installMock(context);
    mock.state.hubLinks.push({
      id: "h2",
      tenant_id: TENANT_ID,
      titulo: "Peça no iFood",
      url: "https://www.ifood.com.br/delivery/iracema",
      ordem: 1,
      ativo: true,
      destaque: true,
      icone: "ifood",
    } as never);
    mock.state.perfil[0]!.hub_descricao = "Comida mineira no coração de Santa Tereza.";
    mock.state.perfil[0]!.hub_mapa_url = MAPA;
    for (const [w, h] of TELAS) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/iracema/links");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByText("Rua das Flores, 120")).toBeVisible();
      const m = await page.evaluate(() => ({
        h: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        v: document.documentElement.scrollHeight - window.innerHeight,
      }));
      expect(m, `${w}x${h}`).toEqual({ h: 0, v: 0 });
    }
  });

  test("mapa: recolhido no celular, ao lado no desktop, sempre com iframe seguro", async ({
    page,
    context,
  }) => {
    const mock = await installMock(context);
    mock.state.perfil[0]!.hub_mapa_url = MAPA;

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/iracema/links");
    await expect(page.getByText("Ver no mapa")).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.getByText("Ver no mapa").click();
    const frame = page.locator("iframe");
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute("loading", "lazy");
    await expect(frame).toHaveAttribute("sandbox", /allow-scripts/);
    await expect(frame).not.toHaveAttribute("sandbox", /allow-top-navigation/);
    await expect(frame).toHaveAttribute("title", /Mapa de Iracema/);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/iracema/links");
    await expect(page.locator("iframe")).toBeVisible();
  });

  test("url de mapa fora do padrão do Google nunca vira iframe", async ({ page, context }) => {
    const mock = await installMock(context);
    mock.state.perfil[0]!.hub_mapa_url = "https://evil.example/maps/embed?pb=!1m18!1m12!1m3";
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/iracema/links");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("painel: colar o código do mapa, salvar, reabrir, editar e rejeitar código inválido", async ({
    page,
    context,
  }) => {
    const mock = await installMock(context);
    await page.goto("/iracema/admin/links");

    await page.getByLabel("Código de incorporação").fill("<script>alert(1)</script>");
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar mapa" })).toBeDisabled();

    await page.getByLabel("Código de incorporação").fill(IFRAME);
    await expect(page.getByText("Mapa reconhecido")).toBeVisible();
    // Teclado: no celular a barra inferior fixa pode cobrir o botão rolado até a borda.
    await page.getByRole("button", { name: "Salvar mapa" }).focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => mock.state.perfil[0]?.hub_mapa_url).toBe(MAPA);

    // Reabrir: o mapa salvo continua no painel e aparece na página pública.
    await page.reload();
    await expect(page.locator("iframe")).toHaveCount(1);
    await page.getByLabel("Trocar o mapa").fill(IFRAME_GOOGLE);
    await expect(page.getByText("Mapa reconhecido")).toBeVisible();
    await page.getByRole("button", { name: "Salvar mapa" }).focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => mock.state.perfil[0]?.hub_mapa_url).toBe(MAPA_GOOGLE);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/iracema/links");
    await expect(page.locator("iframe")).toHaveAttribute("src", MAPA_GOOGLE);
  });

  test("Link Hub: evento identificado, delivery em destaque e sem selo", async ({
    page,
    context,
  }) => {
    const mock = await installMock(context);
    mock.state.perfil[0]!.hub_selo = "Comida de Buteco";
    mock.state.hubLinks.push({
      id: "h2",
      tenant_id: TENANT_ID,
      titulo: "Peça no iFood",
      url: "https://www.ifood.com.br/delivery/iracema",
      ordem: 1,
      ativo: true,
      destaque: true,
      icone: "ifood",
    } as never);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/iracema/links");
    const evento = page.getByRole("link", { name: /Evento/ });
    await expect(evento).toContainText("Festa Junina");
    await expect(evento).toContainText("Ver");
    await expect(evento).toHaveAttribute("href", "/iracema");
    const delivery = page.getByRole("link", { name: /Peça no iFood/ });
    await expect(delivery).toContainText("Delivery");
    await expect(delivery).toHaveAttribute("href", /ifood/);
    await expect(page.getByText("Comida de Buteco")).toHaveCount(0);
  });
});
