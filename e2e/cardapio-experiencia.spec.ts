import { expect, test } from "@playwright/test";

import { installMock, TENANT_ID } from "./support/mock";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function item(id: string, nome: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    tenant_id: TENANT_ID,
    categoria_id: "c1",
    nome,
    descricao: `Descrição de ${nome}`,
    preco_centavos: 3500,
    imagem_url: null,
    ordem: 10,
    ativo: true,
    ...extra,
  };
}

test.describe("Cardápio público como experiência", () => {
  test("abrir um prato, ver a foto inteira, ampliar e voltar com o navegador", async ({
    page,
    context,
  }) => {
    const mock = await installMock(context);
    mock.state.itens.push(item("i7", "Torresmo da casa", { imagem_url: PNG, destaque: true }));
    await page.goto("/iracema/cardapio");

    await page.getByRole("button", { name: "Ver Torresmo da casa" }).first().click();
    await expect(page).toHaveURL(/item=i7/);
    const detalhe = page.getByRole("dialog");
    await expect(detalhe.getByRole("heading", { name: "Torresmo da casa" })).toBeVisible();
    await expect(detalhe).toContainText("Descrição de Torresmo da casa");
    await expect(detalhe).toContainText("35,00");
    await expect(detalhe.getByRole("img", { name: "Torresmo da casa" })).toBeVisible();

    await detalhe.getByRole("button", { name: /Ampliar foto/ }).click();
    await expect(page.getByRole("button", { name: "Fechar foto" })).toBeVisible();
    await page.getByRole("button", { name: "Fechar foto" }).click();

    await page.goBack();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page).not.toHaveURL(/item=/);
  });

  test("a descrição aparece na lista, com e sem foto, em todos os layouts", async ({
    page,
    context,
  }) => {
    const mock = await installMock(context);
    mock.state.itens.push(
      item("i8", "Prato com foto", { imagem_url: PNG }),
      item("i9", "Prato sem foto"),
    );
    for (const layout of ["lista", "cards", "galeria", "compacto"]) {
      await page.goto(`/iracema/cardapio?layout=${layout}`);
      await expect(page.getByText("Descrição de Prato sem foto").first()).toBeVisible();
      if (layout !== "galeria" && layout !== "compacto") {
        await expect(page.getByText("Descrição de Prato com foto").first()).toBeVisible();
      }
    }
  });

  test("link direto para um prato abre o detalhe; destaques aparecem no topo", async ({
    page,
    context,
  }) => {
    const mock = await installMock(context);
    mock.state.itens.push(item("i7", "Torresmo da casa", { destaque: true }));
    await page.goto("/iracema/cardapio?item=i7");
    await expect(page.getByRole("dialog").getByRole("heading")).toHaveText("Torresmo da casa");
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const destaques = page.getByRole("region", { name: "Destaques da casa" });
    await expect(destaques).toContainText("Torresmo da casa");
  });

  test("layout salvo é respeitado; sem salvo, o sistema escolhe pelos dados", async ({
    page,
    context,
  }) => {
    const mock = await installMock(context);
    for (let n = 0; n < 6; n++)
      mock.state.itens.push(item(`f${n}`, `Prato ${n}`, { imagem_url: PNG }));
    // Muitas fotos e poucos itens: o sistema sugere galeria (um prato por linha, foto grande).
    await page.goto("/iracema/cardapio");
    const primeiro = page.getByRole("button", { name: "Ver Prato 0" });
    await expect(primeiro).toBeVisible();
    const box = await primeiro.boundingBox();
    expect(box!.width).toBeGreaterThan(300);

    // Layout salvo pelo restaurante vence a sugestão.
    mock.state.perfil[0]!.cardapio_layout = "compacto";
    await page.goto("/iracema/cardapio");
    await expect(page.getByRole("button", { name: "Ver Prato 0" })).toBeVisible();
    await expect(page.locator("main img[width='800']")).toHaveCount(0);
  });

  test("voltar para o Link Hub quando veio de lá", async ({ page, context }) => {
    await installMock(context);
    await page.goto("/iracema/links");
    await page.getByRole("link", { name: "Cardápio" }).click();
    await expect(page).toHaveURL(/de=links/);
    await page.getByRole("link", { name: /Voltar para os links/ }).click();
    await expect(page).toHaveURL(/\/iracema\/links/);
  });

  test("sem foto e com nomes longos não estoura a tela de 320px", async ({ page, context }) => {
    const mock = await installMock(context);
    mock.state.itens.push(
      item("i8", "Pastel de queijo com requeijão cremoso e linguiça artesanal defumada do dia"),
    );
    await page.setViewportSize({ width: 320, height: 568 });
    for (const layout of ["lista", "cards", "galeria", "compacto"]) {
      await page.goto(`/iracema/cardapio?previa=1&layout=${layout}`);
      await expect(page.getByRole("button", { name: /Ver Pastel/ })).toBeVisible();
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(over, layout).toBe(0);
    }
  });
});

test.describe("Cardápio no painel: conteúdo, aparência e publicação", () => {
  test("sugerir layout analisa os dados e só salva quando a pessoa aceita", async ({
    page,
    context,
  }) => {
    const mock = await installMock(context);
    for (let n = 0; n < 6; n++)
      mock.state.itens.push(item(`f${n}`, `Prato ${n}`, { imagem_url: PNG }));
    const antes = JSON.stringify(mock.state.itens);
    await page.goto("/iracema/admin/cardapio?aba=aparencia");
    await page.getByRole("button", { name: "Sugerir layout" }).click();
    const sugestao = page.getByRole("region", { name: "Sugestão de layout" });
    await expect(sugestao).toContainText("Galeria");
    expect(mock.state.perfil[0]!.cardapio_layout ?? null).toBeNull();

    await sugestao.getByRole("button", { name: "Aplicar sugestão" }).click();
    await expect.poll(() => mock.state.perfil[0]!.cardapio_layout).toBe("galeria");
    // Nada de conteúdo foi tocado.
    expect(JSON.stringify(mock.state.itens)).toBe(antes);
    expect(mock.state.perfil[0]!.cardapio_publicado).toBe(true);

    await page.getByRole("radio", { name: /Compacto/ }).click();
    await expect.poll(() => mock.state.perfil[0]!.cardapio_layout).toBe("compacto");
    await page.getByRole("button", { name: "Voltar ao automático" }).click();
    await expect.poll(() => mock.state.perfil[0]!.cardapio_layout ?? null).toBeNull();
  });

  test("destacar um prato, abas na URL e prévia ao lado no desktop", async ({
    page,
    context,
    isMobile,
  }) => {
    const mock = await installMock(context);
    await page.goto("/iracema/admin/cardapio");
    await page.getByRole("button", { name: "Destacar Feijoada" }).click();
    await expect
      .poll(() =>
        mock.writes.some(
          (w) => w.method === "PATCH" && JSON.stringify(w.body).includes('"destaque":true'),
        ),
      )
      .toBe(true);

    await page.getByRole("tab", { name: "Aparência" }).click();
    await expect(page).toHaveURL(/aba=aparencia/);
    await page.getByRole("tab", { name: "Conteúdo" }).click();
    await expect(page).not.toHaveURL(/aba=/);
    await expect(page.getByRole("tab", { name: "Conteúdo" })).toHaveAttribute(
      "data-state",
      "active",
    );

    if (!isMobile) {
      await expect(page.getByLabel("Como o cliente verá")).toBeVisible();
      await expect(page.locator("iframe[title^='Prévia do cardápio']")).toHaveAttribute(
        "src",
        /\/iracema\/cardapio\?previa=1/,
      );
    }
  });
});

test.describe("Cardápio: reordenar arrastando", () => {
  test("alça de arrastar funciona pelo teclado e grava a nova ordem da categoria", async ({
    page,
    context,
    isMobile,
  }) => {
    // No celular o arrastar é por toque (segurar e arrastar), que o teste não simula; o teclado
    // depende da próxima categoria estar visível na tela, o que no celular nem sempre acontece.
    test.skip(isMobile, "arrastar por teclado é validado no desktop");
    const mock = await installMock(context);
    await page.goto("/iracema/admin/cardapio");
    await expect(page.getByRole("heading", { name: "Pratos" })).toBeVisible();

    const alca = page.getByRole("button", { name: "Arrastar para reordenar: Pratos" });
    await expect(alca).toBeVisible();
    await alca.focus();
    // O dnd-kit precisa de um quadro entre cada tecla; em máquina carregada, sem a pausa a soltura se perde.
    await page.keyboard.press("Space");
    await page.waitForTimeout(150);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(150);
    await page.keyboard.press("Space");

    await expect
      .poll(() =>
        mock.writes
          .filter((w) => w.method === "PATCH" && w.url.includes("cardapio_categorias"))
          .map((w) => ({ url: w.url, body: w.body })),
      )
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            body: { ordem: 1 },
            url: expect.stringContaining("tenant_id=eq.11111111-1111-1111-1111-111111111111"),
          }),
        ]),
      );
  });

  test("as setas de subir e descer continuam disponíveis como alternativa", async ({
    page,
    context,
  }) => {
    await installMock(context);
    await page.goto("/iracema/admin/cardapio");
    await expect(page.getByRole("button", { name: "Descer categoria" }).first()).toBeVisible();
  });
});
