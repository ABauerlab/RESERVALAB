import { expect, test } from "@playwright/test";

import { installMock, reserva } from "./support/mock";

const TEL_FIEL = "31911112222";

test.describe("Dashboard (Hoje)", () => {
  test("mostra o dia em números reais e cada cartão leva à área certa", async ({
    page,
    context,
  }) => {
    const mock = await installMock(context);
    mock.state.reservas = [
      reserva(1, "Ana Souza", "confirmada", 0, "12:00:00", 4, { telefone: "31900000001" }),
      reserva(2, "Pedro Lima", "pendente", 0, "13:00:00", 2, { telefone: "31900000002" }),
      reserva(3, "Carla Mendes", "cancelada", 0, "14:00:00", 6, { telefone: "31900000003" }),
      reserva(4, "Rafael Costa", "confirmada", 0, "23:30:00", 5, { telefone: TEL_FIEL }),
      // Rafael já veio duas vezes antes: cliente de casa.
      reserva(5, "Rafael Costa", "finalizada", -10, "20:00:00", 2, { telefone: TEL_FIEL }),
      reserva(6, "Rafael Costa", "finalizada", -30, "20:00:00", 2, { telefone: "(31) 91111-2222" }),
    ];
    await page.goto("/iracema/admin");

    const resumo = page.getByRole("list", { name: "Resumo do dia" });
    // 3 ativas hoje (a cancelada não conta), 11 pessoas.
    await expect(resumo.getByRole("link", { name: /Reservas/ })).toContainText("3");
    await expect(resumo.getByRole("link", { name: /Reservas/ })).toContainText("11 pessoas");
    await expect(resumo.getByRole("button", { name: /Confirmar/ })).toContainText("1");
    await expect(page.getByText("1 cancelada neste dia")).toBeVisible();

    // Clientes de casa: reconhece o telefone em formatos diferentes e liga a Clientes.
    const casa = page.getByRole("region", { name: "Clientes de casa" });
    await expect(casa).toContainText("Rafael Costa");
    await expect(casa).toContainText("2 reservas antes");
    await expect(casa.getByRole("link", { name: "Ver clientes" })).toHaveAttribute(
      "href",
      "/iracema/admin/contatos",
    );

    // Do Dashboard para a Reserva e para a Agenda.
    await expect(page.getByRole("link", { name: "Ver na Agenda" })).toHaveAttribute(
      "href",
      "/iracema/admin/agenda",
    );
    await resumo.getByRole("link", { name: /Reservas/ }).click();
    await expect(page).toHaveURL(/\/iracema\/admin\/reservas/);
  });

  test("dia sem reservas explica e não inventa números", async ({ page, context }) => {
    const mock = await installMock(context);
    mock.state.reservas = [];
    await page.goto("/iracema/admin");
    const resumo = page.getByRole("list", { name: "Resumo do dia" });
    await expect(resumo.getByRole("link", { name: /Reservas/ })).toContainText("0");
    await expect(resumo).toContainText("Sem reservas neste dia.");
    await expect(page.getByRole("region", { name: "Clientes de casa" })).toHaveCount(0);
  });

  test("uso do plano aparece só quando o time definiu um plano", async ({ page, context }) => {
    await installMock(context);
    await page.goto("/iracema/admin");
    await expect(page.getByRole("region", { name: "Seu plano" })).toHaveCount(0);
  });
});
