import { expect, test } from "@playwright/test";

import { dia, installMock } from "./support/mock";

test.describe("Experiência pública", () => {
  test("reserva de mesa envia pela RPC criar_reserva e agradece", async ({ page, context }) => {
    const mock = await installMock(context);
    await page.goto("/iracema/reservar/mesa");
    const data = page.locator('input[type="date"]');
    // Antes da hidratacao o React pode descartar o valor: repete ate o campo guardar a data.
    const nome = page.getByPlaceholder("Seu nome completo");
    const telefone = page.getByPlaceholder(/\(11\) 91234-5678/);
    await expect(async () => {
      await nome.fill("Cliente Teste");
      await telefone.fill("31988887777");
      await data.fill(dia(2));
      await expect(nome).toHaveValue("Cliente Teste");
      await expect(telefone).toHaveValue("(31) 98888-7777");
      await expect(data).toHaveValue(dia(2));
      await expect(page.getByRole("combobox").first()).toBeEnabled({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await page.getByRole("combobox").first().click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Enviar reserva" }).click();
    await expect(page).toHaveURL(/\/iracema\/obrigado/);
    const rpc = mock.rpcs.find((r) => r.name === "criar_reserva");
    expect(rpc).toBeTruthy();
    expect(rpc!.body).toMatchObject({ _slug: "iracema", _tipo: "mesa", _nome: "Cliente Teste" });
    // Nenhum INSERT direto em reservas.
    expect(
      mock.writes.filter((w) => w.method === "POST" && w.url.includes("/rest/v1/reservas")),
    ).toHaveLength(0);
  });
});

test.describe("Acessibilidade das páginas públicas", () => {
  test("a página permite zoom (sem maximum-scale) e a prévia do cardápio não é indexada", async ({
    page,
    context,
  }) => {
    await installMock(context);
    await page.goto("/iracema/links");
    const viewport = await page.locator("meta[name=viewport]").getAttribute("content");
    expect(viewport).not.toMatch(/maximum-scale|user-scalable/);

    await page.goto("/iracema/cardapio?previa=1");
    await expect(page.locator("meta[name=robots][content=noindex]")).toHaveCount(1);
    await page.goto("/iracema/cardapio");
    await expect(page.getByRole("heading", { name: "Pratos" })).toBeVisible();
    await expect(page.locator("meta[name=robots][content=noindex]")).toHaveCount(0);
  });
});
