import { expect, test } from "@playwright/test";

import { installMock } from "./support/mock";

test.describe("Cardápio e Link Hub (público)", () => {
  test("cardapio publicado mostra categorias, itens, precos e CTA de reserva", async ({
    page,
    context,
  }) => {
    await installMock(context);
    await page.goto("/iracema/cardapio");
    await expect(page.getByRole("heading", { name: "Pratos" })).toBeVisible();
    await expect(page.getByText("Feijoada", { exact: true })).toBeVisible();
    await expect(page.getByText(/45,90/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Reservar mesa" }).last()).toHaveAttribute(
      "href",
      "/iracema/reservar/mesa",
    );
  });

  test("cardapio nao publicado explica e leva a reserva", async ({ page, context }) => {
    const mock = await installMock(context);
    mock.state.perfil[0]!.cardapio_publicado = false;
    await page.goto("/iracema/cardapio");
    await expect(page.getByText("Cardápio indisponível por enquanto")).toBeVisible();
    await expect(page.getByRole("link", { name: "Reservar mesa" })).toBeVisible();
  });

  test("hub: Reservar mesa em primeiro, depois cardapio, WhatsApp, Instagram e extras", async ({
    page,
    context,
  }) => {
    await installMock(context);
    await page.goto("/iracema/links");
    const links = page.getByRole("link");
    await expect(links.first()).toHaveText("Reservar mesa");
    await expect(links.first()).toHaveAttribute("href", "/iracema/reservar/mesa");
    await expect(page.getByRole("link", { name: "Cardápio" })).toHaveAttribute(
      "href",
      "/iracema/cardapio",
    );
    await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
      "href",
      /wa\.me\/55/,
    );
    await expect(page.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://instagram.com/iracemabh",
    );
    await expect(page.getByRole("link", { name: "Playlist" })).toBeVisible();
  });

  test("hub sem cardapio publicado nao mostra o cardapio", async ({ page, context }) => {
    const mock = await installMock(context);
    mock.state.perfil[0]!.cardapio_publicado = false;
    await page.goto("/iracema/links");
    await expect(page.getByRole("link", { name: "Reservar mesa" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Cardápio" })).toHaveCount(0);
  });

  test("hub nao publicado mostra pagina indisponivel", async ({ page, context }) => {
    const mock = await installMock(context);
    mock.state.perfil[0]!.hub_publicado = false;
    await page.goto("/iracema/links");
    await expect(page.getByText("Página indisponível")).toBeVisible();
  });

  test("sem overflow horizontal nas paginas publicas", async ({ page, context }) => {
    await installMock(context);
    for (const rota of ["/iracema/cardapio", "/iracema/links", "/iracema"]) {
      await page.goto(rota);
      await page.waitForTimeout(800);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(over, rota).toBe(false);
    }
  });
});

test.describe("Cardápio e Link Hub (painel)", () => {
  test("cria categoria e item pelo painel e despublica", async ({ page, context }) => {
    const mock = await installMock(context);
    await page.goto("/iracema/admin/cardapio");
    await expect(page.getByRole("heading", { name: "Pratos" })).toBeVisible();

    await page
      .getByRole("button", { name: /Categoria/ })
      .first()
      .click();
    await page.getByLabel("Nome").fill("Sobremesas");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect
      .poll(() =>
        mock.writes.some((w) => w.method === "POST" && w.url.includes("cardapio_categorias")),
      )
      .toBe(true);
    const post = mock.writes.find(
      (w) => w.url.includes("cardapio_categorias") && w.method === "POST",
    );
    expect(post!.body).toMatchObject({
      nome: "Sobremesas",
      tenant_id: "11111111-1111-1111-1111-111111111111",
    });

    await page.getByRole("button", { name: /Item em Pratos/ }).click();
    await page.getByLabel("Nome").fill("Moqueca");
    await page.getByLabel(/Preço/).fill("52,50");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect
      .poll(() => mock.writes.some((w) => w.url.includes("cardapio_itens") && w.method === "POST"))
      .toBe(true);
    const item = mock.writes.find((w) => w.url.includes("cardapio_itens") && w.method === "POST");
    expect(item!.body).toMatchObject({ nome: "Moqueca", preco_centavos: 5250, categoria_id: "c1" });

    await page.getByRole("switch", { name: "Publicar cardápio" }).click();
    await expect.poll(() => mock.state.perfil[0]!.cardapio_publicado).toBe(false);
  });

  test("toda escrita do cardapio leva o tenant_id", async ({ page, context }) => {
    const mock = await installMock(context);
    await page.goto("/iracema/admin/cardapio");
    await page.getByRole("button", { name: "Ocultar Feijoada" }).click();
    await expect.poll(() => mock.writes.length).toBeGreaterThan(0);
    const w = mock.writes.find((x) => x.method === "PATCH")!;
    expect(w.url).toContain("tenant_id=eq.11111111-1111-1111-1111-111111111111");
  });

  test("link hub: adiciona link extra valido e recusa url insegura", async ({ page, context }) => {
    const mock = await installMock(context);
    await page.goto("/iracema/admin/links");
    await page.getByLabel("Título do link").fill("Eventos");
    await page.getByLabel("Endereço do link").fill("javascript:alert(1)");
    await expect(page.getByRole("button", { name: "Adicionar" })).toBeDisabled();
    await page.getByLabel("Endereço do link").fill("https://example.com/eventos");
    await page.getByRole("button", { name: "Adicionar" }).click();
    await expect
      .poll(() => mock.writes.some((w) => w.url.includes("hub_links") && w.method === "POST"))
      .toBe(true);
  });
});
