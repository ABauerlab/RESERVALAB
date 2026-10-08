import { expect, test } from "@playwright/test";

import { dia, installMock, reserva } from "./support/mock";

test.describe("Reservas por data", () => {
  test("escolher um dia mostra só as reservas dele e o voltar preserva o contexto", async ({
    page,
    context,
  }) => {
    const mock = await installMock(context);
    mock.state.reservas = [
      reserva(1, "Ana Souza", "confirmada", 0, "12:00:00", 4),
      reserva(2, "Bruno Dias", "confirmada", 20, "20:00:00", 3),
      reserva(3, "Carla Mendes", "pendente", 20, "21:00:00", 2),
    ];
    await page.goto("/iracema/admin/reservas");
    await expect(page.getByRole("button", { name: /Ana Souza/ }).first()).toBeVisible();

    const alvo = dia(20);
    await page.getByLabel("Escolher um dia específico").fill(alvo);
    await expect(page).toHaveURL(new RegExp(`dia=${alvo}`));
    await expect(page.getByRole("button", { name: /Bruno Dias/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Ana Souza/ })).toHaveCount(0);

    // Combina com status e mantem o dia.
    await page.getByRole("button", { name: "Pendentes" }).click();
    await expect(page.getByRole("button", { name: /Carla Mendes/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Bruno Dias/ })).toHaveCount(0);
    const urlLista = page.url();

    // Abre o detalhe e volta: mesma lista, mesmo dia, mesmo filtro.
    await page
      .getByRole("button", { name: /Carla Mendes/ })
      .first()
      .click();
    await expect(page).toHaveURL(/reserva=/);
    await expect(page.getByLabel("Detalhe da reserva")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(urlLista);
    await expect(page.getByRole("button", { name: /Carla Mendes/ }).first()).toBeVisible();

    // Dia anterior/seguinte e voltar para hoje.
    await page.getByRole("button", { name: "Próximo dia" }).click();
    await expect(page).toHaveURL(new RegExp(`dia=${dia(21)}`));
    await page.getByRole("button", { name: "Hoje" }).click();
    await expect(page).not.toHaveURL(/dia=/);
  });

  test("link com dia e busca abre já filtrado", async ({ page, context }) => {
    const mock = await installMock(context);
    mock.state.reservas = [
      reserva(1, "Ana Souza", "confirmada", 5, "12:00:00", 4),
      reserva(2, "Bruno Dias", "confirmada", 5, "13:00:00", 2),
    ];
    await page.goto(`/iracema/admin/reservas?dia=${dia(5)}&q=Ana`);
    await expect(page.getByRole("button", { name: /Ana Souza/ }).first()).toBeVisible();
    await expect(page.getByLabel("Buscar reserva")).toHaveValue("Ana");
  });
});
