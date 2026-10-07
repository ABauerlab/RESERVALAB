import { expect, test } from "@playwright/test";

import { addDaysISO, todayISO } from "../src/lib/datetime";
import { dia, installMock, reserva } from "./support/mock";

const AGENDA = "/iracema/admin/agenda";

test.describe("Agenda", () => {
  test("mostra o dia de hoje com as reservas e o contexto", async ({ page, context }) => {
    await installMock(context);
    await page.goto(AGENDA);
    await expect(page.getByRole("button", { name: "Abrir reserva de Marina Alves" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir reserva de Rafael Lima" })).toBeVisible();
    await expect(page.getByText("Evento privado").first()).toBeVisible();
    await expect(page.getByText("Reservas sem horário")).toBeVisible();
    // Reserva cancelada fica oculta ate o filtro ser ligado.
    await expect(page.getByRole("button", { name: "Abrir reserva de Joao Pedro" })).toHaveCount(0);
  });

  test("navega no tempo, volta para hoje e preserva o dia ao recarregar", async ({
    page,
    context,
    isMobile,
  }) => {
    await installMock(context);
    await page.goto(AGENDA);
    // Mobile navega de dia em dia; tablet e desktop, de semana em semana.
    const passo = isMobile ? 1 : 7;
    await page.getByLabel(isMobile ? "Próximo dia" : "Próxima semana").click();
    await expect(page).toHaveURL(new RegExp(`dia=${addDaysISO(todayISO(), passo)}`));
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`dia=${addDaysISO(todayISO(), passo)}`));
    await page.getByRole("button", { name: "Hoje", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`dia=${todayISO()}`));
  });

  test("filtros: precisa de atencao e mostrar canceladas", async ({ page, context, isMobile }) => {
    await installMock(context);
    await page.goto(AGENDA);
    if (isMobile) await page.getByRole("button", { name: "Filtros" }).click();
    await page.getByRole("button", { name: /Mostrar canceladas/ }).click();
    if (isMobile) await page.keyboard.press("Escape"); // fecha a folha de filtros
    await expect(page.getByRole("button", { name: "Abrir reserva de Joao Pedro" })).toBeVisible();
  });

  test("confirma uma reserva pendente pela linha", async ({ page, context }) => {
    const mock = await installMock(context);
    await page.goto(AGENDA);
    const patch = page.waitForRequest(
      (r) => r.method() === "PATCH" && r.url().includes("/rest/v1/reservas"),
    );
    await page.getByRole("button", { name: "Confirmar", exact: true }).first().click();
    const req = await patch;
    expect(req.postDataJSON()).toEqual({ status: "confirmada" });
    expect(mock.writes.some((w) => w.method === "PATCH")).toBe(true);
  });

  test("estado vazio explica o que aconteceu", async ({ page, context }) => {
    await installMock(context, "empty");
    await page.goto(AGENDA);
    await expect(page.getByText("Nenhuma reserva nesta semana")).toBeVisible();
  });

  test("erro mostra Tentar novamente e recupera", async ({ page, context }) => {
    const mock = await installMock(context, "error");
    await page.goto(AGENDA);
    await expect(page.getByText("Não foi possível carregar a agenda")).toBeVisible();
    mock.setMode("data");
    await page.getByRole("button", { name: "Tentar novamente" }).click();
    await expect(page.getByRole("button", { name: "Abrir reserva de Marina Alves" })).toBeVisible();
  });

  test("realtime: INSERT aparece e DELETE remove sem recarregar", async ({ page, context }) => {
    const mock = await installMock(context);
    await page.goto(AGENDA);
    await expect(page.getByRole("button", { name: "Abrir reserva de Marina Alves" })).toBeVisible();
    // Dá tempo de o canal entrar.
    await page.waitForTimeout(1500);

    const nova = reserva(99, "Cliente Realtime", "pendente", 0, "18:30:00", 4);
    mock.state.reservas.push(nova);
    mock.pushRealtime("reservas-admin", "INSERT", nova);
    await expect(
      page.getByRole("button", { name: "Abrir reserva de Cliente Realtime" }),
    ).toBeVisible();

    const antes = mock.reservasGets();
    mock.pushRealtime("agenda-delete", "DELETE", { id: "id-de-outra-empresa" });
    await page.waitForTimeout(800);
    expect(mock.reservasGets()).toBe(antes); // id desconhecido nao refaz consulta

    mock.state.reservas = mock.state.reservas.filter((r) => r.id !== "r99");
    mock.pushRealtime("agenda-delete", "DELETE", { id: "r99" });
    await expect(
      page.getByRole("button", { name: "Abrir reserva de Cliente Realtime" }),
    ).toHaveCount(0);
    expect(dia(0)).toBe(todayISO());
  });
});
