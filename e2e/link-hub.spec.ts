import { expect, test } from "@playwright/test";

import { installMock } from "./support/mock";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("Link Hub (painel e página pública)", () => {
  test("Dashboard, Link Hub, banner, link em destaque com ícone, cardápio ON/OFF e página pública", async ({
    page,
    context,
    isMobile,
  }) => {
    const mock = await installMock(context);

    // Do Hoje até o Link Hub pela navegação (no celular, direto: o item fica em "Mais").
    await page.goto("/iracema/admin");
    if (isMobile) {
      await page.goto("/iracema/admin/links");
    } else {
      await page.getByRole("link", { name: "Link Hub" }).first().click();
    }
    await expect(page.getByRole("heading", { name: "Link Hub", level: 1 })).toBeVisible();

    // Banner: envia, aparece a prévia e vira ativo.
    await page.getByLabel("Enviar banner").setInputFiles({
      name: "banner.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await expect(page.getByRole("img", { name: "Prévia do banner" })).toBeVisible();
    await expect(page.getByLabel("Mostrar banner")).toBeChecked();
    expect(mock.state.perfil[0]?.hub_banner_url).toContain("/tenant-assets/");

    // Link com ícone da biblioteca e destaque.
    await page.getByLabel("Título do link").fill("Peça no iFood");
    await page.getByLabel("Endereço do link").fill("https://www.ifood.com.br/iracema");
    await page.getByRole("button", { name: /Ícone$/ }).click();
    await page.getByRole("radio", { name: "iFood" }).click();
    await page.getByRole("button", { name: "Usar este ícone" }).click();
    await page.getByLabel("Destacar link").click();
    await page.getByRole("button", { name: "Adicionar" }).click();
    await expect(page.getByText("Link adicionado.")).toBeVisible();
    expect(mock.state.hubLinks.at(-1)).toMatchObject({
      titulo: "Peça no iFood",
      icone: "ifood",
      destaque: true,
    });

    // Cardápio no hub: ligado por padrão; desliga.
    const toggle = page.getByLabel("Mostrar cardápio");
    await expect(toggle).toBeChecked();
    await toggle.click();
    await expect(toggle).not.toBeChecked();

    // Página pública: banner, destaque logo depois de Reservar mesa e sem o Cardápio.
    await page.goto("/iracema/links");
    await expect(page.locator("main img[width='1200']")).toHaveAttribute("src", /tenant-assets/);
    const links = page.getByRole("link");
    await expect(links.first()).toHaveText("Reservar mesa");
    await expect(links.nth(1)).toContainText("Peça no iFood");
    await expect(page.getByRole("link", { name: "Cardápio" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "WhatsApp" })).toBeVisible();
  });

  test("WhatsApp e Instagram usam o glifo oficial da marca, não ícone genérico", async ({
    page,
    context,
  }) => {
    await installMock(context);
    await page.goto("/iracema/links");
    const wa = page.getByRole("link", { name: "WhatsApp" });
    await expect(wa.getByRole("img", { name: "WhatsApp" })).toBeVisible();
    const ig = page.getByRole("link", { name: "Instagram" });
    await expect(ig.getByRole("img", { name: "Instagram" })).toBeVisible();
  });

  test("despublicar o hub mostra página indisponível com atalho para reservar", async ({
    page,
    context,
  }) => {
    await installMock(context);
    await page.goto("/iracema/admin/links");
    await page.getByLabel("Publicar página de links").click();
    await page.goto("/iracema/links");
    await expect(page.getByText("Página indisponível")).toBeVisible();
    await expect(page.getByRole("link", { name: "Reservar mesa" })).toBeVisible();
  });

  test("sem banner a página abre direto no nome do restaurante", async ({ page, context }) => {
    const mock = await installMock(context);
    mock.state.perfil[0]!.hub_banner_ativo = false;
    await page.goto("/iracema/links");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("main img[width='1200']")).toHaveCount(0);
  });
});
