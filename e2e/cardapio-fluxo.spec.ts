import { expect, test } from "@playwright/test";

import { installMock } from "./support/mock";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("Cardápio: do painel à página pública", () => {
  test("Dashboard, Cardápio, categoria, produto com foto, publicar e página pública", async ({
    page,
    context,
    isMobile,
  }) => {
    const mock = await installMock(context);
    mock.state.perfil[0]!.cardapio_publicado = false;
    mock.state.categorias.length = 0;
    mock.state.itens.length = 0;

    await page.goto("/iracema/admin");
    if (isMobile) await page.goto("/iracema/admin/cardapio");
    else await page.getByRole("link", { name: "Cardápio" }).first().click();
    await expect(page.getByRole("heading", { name: "Cardápio", level: 1 })).toBeVisible();

    // Antes de publicar, a página pública explica e leva à reserva.
    const publica = await context.newPage();
    await publica.goto("/iracema/cardapio");
    await expect(publica.getByText("Cardápio indisponível por enquanto")).toBeVisible();
    await publica.close();

    await page
      .getByRole("button", { name: /Categoria/ })
      .first()
      .click();
    await page.getByLabel("Nome").fill("Petiscos");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("heading", { name: "Petiscos" })).toBeVisible();

    await page.getByRole("button", { name: /Item em Petiscos/ }).click();
    await page.getByLabel("Nome").fill("Pão de queijo");
    await page.getByLabel(/Preço/).fill("18,00");
    await page.getByLabel("Enviar foto do item").setInputFiles({
      name: "prato.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await expect(page.getByRole("img", { name: "Prévia da foto" })).toBeVisible();
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect.poll(() => mock.state.itens.length).toBe(1);
    expect(mock.state.itens[0]).toMatchObject({ nome: "Pão de queijo", preco_centavos: 1800 });
    expect(String(mock.state.itens[0]!.imagem_url)).toContain("/tenant-assets/");

    // Publicar é uma decisão: aba Publicação, chave e confirmação.
    await page.getByRole("tab", { name: "Publicação" }).click();
    await expect(page.getByText("Rascunho, não publicado").first()).toBeVisible();
    await page.getByRole("switch", { name: "Publicar cardápio" }).click();
    expect(mock.state.perfil[0]!.cardapio_publicado).toBe(false);
    await page.getByRole("button", { name: "Publicar", exact: true }).click();
    await expect.poll(() => mock.state.perfil[0]!.cardapio_publicado).toBe(true);

    await page.goto("/iracema/cardapio");
    await expect(page.getByRole("heading", { name: "Petiscos" })).toBeVisible();
    await expect(page.getByText("Pão de queijo", { exact: true })).toBeVisible();
    await expect(page.getByText(/18,00/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Reservar mesa" }).last()).toHaveAttribute(
      "href",
      "/iracema/reservar/mesa",
    );
  });

  test("busca no cardápio público ignora acento e mostra mensagem quando nada combina", async ({
    page,
    context,
  }) => {
    const mock = await installMock(context);
    mock.state.itens.push({
      id: "i9",
      tenant_id: "11111111-1111-1111-1111-111111111111",
      categoria_id: "c1",
      nome: "Pão de queijo",
      descricao: null,
      preco_centavos: 1800,
      imagem_url: null,
      ordem: 5,
      ativo: true,
    });
    await page.goto("/iracema/cardapio");
    await page.getByLabel("Buscar no cardápio").fill("pao");
    await expect(page.getByText("Pão de queijo", { exact: true })).toBeVisible();
    await expect(page.getByText("Feijoada", { exact: true })).toHaveCount(0);
    await page.getByLabel("Buscar no cardápio").fill("sushi");
    await expect(page.getByText(/Nada encontrado/)).toBeVisible();
  });

  test("cardápio não publicado: cliente vê indisponível e o admin pré-visualiza", async ({
    page,
    context,
  }) => {
    const mock = await installMock(context);
    mock.state.perfil[0]!.cardapio_publicado = false;
    await page.goto("/iracema/cardapio");
    await expect(page.getByText("Cardápio indisponível por enquanto")).toBeVisible();

    await page.goto("/iracema/admin/cardapio");
    await page.getByRole("tab", { name: "Publicação" }).click();
    const previa = page.getByRole("link", { name: "Pré-visualizar" });
    await expect(previa).toHaveAttribute("href", "/iracema/cardapio?previa=1");

    await page.goto("/iracema/cardapio?previa=1");
    await expect(page.getByText(/Pré-visualização para você/)).toBeVisible();
    await expect(page.getByText("Feijoada", { exact: true })).toBeVisible();
  });
});
