import { expect, test } from "@playwright/test";

import { installMock } from "./support/mock";

const dialogo = (page: import("@playwright/test").Page) =>
  page.getByRole("dialog", { name: /./ }).filter({ hasText: "Passo" });

test.describe("Onboarding", () => {
  test("novo usuário: login, passo a passo, concluir e chegar ao Dashboard", async ({
    page,
    context,
    isMobile,
  }) => {
    const mock = await installMock(context, "data", { novoUsuario: true });
    await page.goto("/iracema/admin");

    const d = dialogo(page);
    await expect(d.getByRole("heading", { name: "Bem-vindo ao Teggly" })).toBeVisible();
    await d.getByRole("button", { name: "Começar" }).click();

    await expect(d.getByRole("heading", { name: "Dashboard: o que fazer agora" })).toBeVisible();
    if (!isMobile) {
      // Desktop: o item de navegação é destacado e o painel continua utilizável.
      await expect(page.locator("[data-tour='nav-hoje']")).toBeVisible();
    }
    // O tour não bloqueia: dá para clicar no painel com o tour aberto.
    await page.getByRole("button", { name: "Próximo dia" }).click();
    await page.getByRole("button", { name: "Dia anterior" }).click();

    for (const titulo of [
      "Reservas",
      "Agenda",
      "Clientes",
      "Cardápio",
      "Link Hub",
      "Ajustes",
      "WhatsApp e Assistente",
    ]) {
      await d.getByRole("button", { name: "Próximo" }).click();
      await expect(d.getByRole("heading", { name: titulo })).toBeVisible();
    }
    await d.getByRole("button", { name: "Próximo" }).click();
    await expect(d.getByRole("heading", { name: "Tudo pronto" })).toBeVisible();
    await d.getByRole("button", { name: "Concluir" }).click();
    await expect(d).toHaveCount(0);

    // Concluído fica salvo no usuário e a pessoa cai no Dashboard.
    const w = mock.writes.find((x) => x.method === "PUT" && x.url.includes("/auth/v1/user"));
    expect(JSON.stringify(w?.body)).toContain("concluido_em");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(" de ");
    await expect(page.getByRole("list", { name: "Resumo do dia" })).toBeVisible();
  });

  test("pular salva a escolha e o passo atual é retomado ao voltar", async ({ page, context }) => {
    const mock = await installMock(context, "data", { novoUsuario: true });
    await page.goto("/iracema/admin");
    const d = dialogo(page);
    await d.getByRole("button", { name: "Começar" }).click();
    await d.getByRole("button", { name: "Próximo" }).click();
    await expect(d.getByText("Passo 3 de")).toBeVisible();

    await page.reload();
    await expect(dialogo(page).getByText("Passo 3 de")).toBeVisible();

    await dialogo(page).getByRole("button", { name: "Pular" }).click();
    await expect(dialogo(page)).toHaveCount(0);
    const w = mock.writes.find((x) => x.method === "PUT" && x.url.includes("/auth/v1/user"));
    expect(JSON.stringify(w?.body)).toContain("pulado_em");
  });

  test("Esc também pula", async ({ page, context }) => {
    await installMock(context, "data", { novoUsuario: true });
    await page.goto("/iracema/admin");
    await expect(dialogo(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialogo(page)).toHaveCount(0);
  });

  test("quem já concluiu não vê o tour sozinho; Ajustes, Refazer onboarding, concluir", async ({
    page,
    context,
  }) => {
    await installMock(context);
    await page.goto("/iracema/admin");
    await expect(page.getByRole("list", { name: "Resumo do dia" })).toBeVisible();
    await page.waitForTimeout(1200);
    await expect(dialogo(page)).toHaveCount(0);

    await page.goto("/iracema/admin/configuracoes");
    await page.getByRole("button", { name: /Ajuda/ }).click();
    await page.getByRole("button", { name: "Refazer onboarding" }).click();
    const d = dialogo(page);
    await expect(d.getByRole("heading", { name: "Bem-vindo ao Teggly" })).toBeVisible();
    await d.getByRole("button", { name: "Pular" }).click();
    await expect(d).toHaveCount(0);
  });

  test("Ajustes mostra Seu plano com limite como aviso, sem cobrança", async ({
    page,
    context,
  }) => {
    await installMock(context);
    await page.goto("/iracema/admin/configuracoes");
    await page.getByRole("button", { name: /Seu plano/ }).click();
    await expect(page.getByText("plano de lançamento")).toBeVisible();
    await expect(page.getByText(/Nenhuma reserva fica escondida ou bloqueada/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Falar sobre planos" })).toHaveAttribute(
      "href",
      /^mailto:contato\.bauerlab@gmail\.com/,
    );
  });
});
