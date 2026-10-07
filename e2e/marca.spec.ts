import { expect, test } from "@playwright/test";

import { installMock } from "./support/mock";

const primario = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const el = document.querySelector("main") ?? document.body;
    return getComputedStyle(el).getPropertyValue("--primary").trim();
  });

test.describe("Marca da empresa (opt-in)", () => {
  test("sem opt-in o visual segue o padrao Teggly e nao ha logo", async ({ page, context }) => {
    await installMock(context);
    await page.goto("/iracema");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await primario(page)).not.toBe("#16a34a");
    await expect(page.getByRole("img", { name: /^Logo/ })).toHaveCount(0);
  });

  test("com opt-in aplica cor e logo nas paginas publicas", async ({ page, context }) => {
    const mock = await installMock(context);
    mock.state.marca = { cor: "#16a34a", logo_url: "https://example.com/logo.png" };
    await page.goto("/iracema");
    await expect(page.getByRole("img", { name: /^Logo/ })).toBeVisible();
    await expect.poll(() => primario(page)).toBe("#16a34a");
  });

  test("cor sem contraste e ignorada", async ({ page, context }) => {
    const mock = await installMock(context);
    mock.state.marca = { cor: "#f59e0b", logo_url: null };
    await page.goto("/iracema");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await primario(page)).not.toBe("#f59e0b");
  });
});
