import { expect, test } from "@playwright/test";

import { installMock } from "./support/mock";

test.describe("Painel", () => {
  test("Hoje, Reservas, Clientes, Relatorios e Ajustes abrem sem erro", async ({
    page,
    context,
  }) => {
    await installMock(context);
    const erros: string[] = [];
    page.on("pageerror", (e) => erros.push(e.message));
    for (const [rota, texto] of [
      ["/iracema/admin", /\d{1,2} de [a-zç]+/],
      ["/iracema/admin/reservas", /Reservas/],
      ["/iracema/admin/contatos", "Clientes"],
      ["/iracema/admin/relatorios", "Relatórios"],
      ["/iracema/admin/configuracoes", "Configurações"],
      ["/iracema/admin/eventos", "Eventos"],
    ] as const) {
      await page.goto(rota);
      await expect(page.getByRole("heading", { name: texto }).first()).toBeVisible();
    }
    expect(erros).toEqual([]);
  });

  test("sem overflow horizontal na Agenda", async ({ page, context }) => {
    await installMock(context);
    await page.goto("/iracema/admin/agenda");
    await page.getByRole("button", { name: "Abrir reserva de Marina Alves" }).waitFor();
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(over).toBe(false);
  });

  test("login do master nao chama mais o bootstrap de super admin", async ({ page, context }) => {
    await installMock(context);
    const chamadas: string[] = [];
    page.on("request", (r) => {
      if (/bootstrap/i.test(r.url())) chamadas.push(r.url());
    });
    await page.goto("/master/login");
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
    await page.waitForTimeout(800);
    expect(chamadas).toEqual([]);
  });
});
