import { expect, test, type Page } from "@playwright/test";

import { dia, installMock } from "./support/mock";

async function preencher(page: Page) {
  await page.goto("/iracema/reservar/mesa");
  const data = page.locator('input[type="date"]');
  const nome = page.getByPlaceholder("Seu nome completo");
  await expect(async () => {
    await nome.fill("Cliente Teste");
    await page.getByPlaceholder(/\(11\) 91234-5678/).fill("31988887777");
    await data.fill(dia(2));
    await expect(nome).toHaveValue("Cliente Teste");
    await expect(data).toHaveValue(dia(2));
    await expect(page.getByRole("combobox").first()).toBeEnabled({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

test.describe("Capacidade da casa", () => {
  test("dia lotado para o grupo: avisa e não deixa enviar", async ({ page, context }) => {
    const mock = await installMock(context);
    mock.state.tenantCap = { dia: 1 };
    await preencher(page);
    await expect(page.getByRole("alert")).toContainText("lotado");
    await expect(page.getByRole("button", { name: "Enviar reserva" })).toBeDisabled();
  });

  test("horário cheio some da lista; os outros continuam", async ({ page, context }) => {
    const mock = await installMock(context);
    mock.state.tenantCap = { horario: 6, porHorario: { "12:00": 1 } };
    await preencher(page);
    await expect(page.getByRole("combobox").first()).toBeEnabled();
    await page.getByRole("combobox").first().click();
    await expect(page.getByRole("option", { name: "12:00" })).toHaveCount(0);
    await expect(
      page.getByRole("option", { name: "11:00" }).or(page.getByRole("option").first()),
    ).toBeVisible();
  });

  test("sem limite configurado nada muda", async ({ page, context }) => {
    await installMock(context);
    await preencher(page);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("painel: salva os limites de capacidade (vazio = sem limite)", async ({ page, context }) => {
    const mock = await installMock(context);
    await page.goto("/iracema/admin/configuracoes");
    await page
      .getByRole("button", { name: /Reservas/ })
      .first()
      .click();
    await page.getByLabel("Pessoas por dia").fill("120");
    await page.getByLabel("Pessoas por horário").fill("");
    await page
      .getByRole("button", { name: /Salvar/ })
      .first()
      .click();
    await expect
      .poll(
        () =>
          mock.writes.find((w) => w.method === "PATCH" && w.url.includes("/rest/v1/tenants"))?.body,
      )
      .toMatchObject({ capacidade_pessoas_dia: 120, capacidade_pessoas_horario: null });
  });
});
