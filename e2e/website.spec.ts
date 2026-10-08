import { expect, test } from "@playwright/test";

test.describe("Website", () => {
  test("home explica o produto, mostra planos e leva ao contato oficial", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Mais reservas.");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Menos trabalho.");

    // Um CTA primario com o mesmo texto, indo para o e-mail oficial.
    const cta = page.getByRole("link", { name: "Começar agora" }).first();
    await expect(cta).toHaveAttribute("href", /^mailto:contato\.bauerlab@gmail\.com/);

    // Planos: gratuito com limite explicito, cardapio em todos, melhor custo-beneficio destacado.
    const planos = page.locator("#planos");
    await expect(planos.getByText("40 reservas por mês")).toBeVisible();
    await expect(planos.getByText("Melhor custo-benefício")).toBeVisible();
    await expect(planos.getByText("R$ 89", { exact: true })).toBeVisible();
    await planos.getByRole("button", { name: /Anual/ }).click();
    await expect(planos.getByText(/R\$\s890\spor ano/)).toBeVisible();

    // Sem marca antiga nem dominio da BauerLab como assinatura.
    await expect(page.locator("footer")).not.toContainText("BauerLab");
    await expect(page.locator("a[href*='bauerlab.com.br']")).toHaveCount(0);
  });

  test("home nao tem overflow horizontal", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(over).toBeLessThanOrEqual(1);
  });
});
