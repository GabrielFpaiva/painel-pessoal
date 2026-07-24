import { expect, test } from "./fixtures";

/** Aceite da 0.5: navegável a 390px com o polegar; ⌘K navega e cria no desktop. */

test.beforeEach(async ({ novoUsuario, db }) => {
  await db.query(`insert into public.profiles (id, username) values ($1, $2)`, [
    novoUsuario.id,
    `s${Date.now()}`.slice(0, 30),
  ]);
});

test.describe("casca", () => {
  test("troca de tema e de idioma sem mudar a URL", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.locator("html")).toHaveClass(/dark/);

    await page
      .getByRole("button", { name: "Alternar entre tema claro e escuro" })
      .click();
    await expect(page.locator("html")).toHaveClass(/light/);

    await page.getByRole("button", { name: "English" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    // Locale mora em cookie: a URL é a mesma (D-01).
    await expect(page).toHaveURL("/dashboard");
  });
});

test.describe("mobile", () => {
  test("bottom nav e FAB no alcance do polegar, sem rolagem horizontal", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const nav = page.getByRole("navigation", { name: "Navegação principal" });
    await expect(nav).toBeVisible();

    // Quatro abas, cada uma com alvo de toque de 44px ou mais.
    const abas = nav.getByRole("link");
    await expect(abas).toHaveCount(4);
    for (const aba of await abas.all()) {
      const box = await aba.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    const fab = page.getByRole("button", { name: "Adicionar" });
    await expect(fab).toBeVisible();
    const fabBox = await fab.boundingBox();
    expect(fabBox?.width ?? 0).toBeGreaterThanOrEqual(44);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, "a página não pode rolar na horizontal").toBe(false);
  });

  test("a navegação leva às quatro telas", async ({ page }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: "Navegação principal" });

    for (const [rotulo, url] of [
      ["Acadêmico", "/academico"],
      ["Missões", "/missoes"],
      ["Biblioteca", "/livros"],
      ["Hoje", "/dashboard"],
    ] as const) {
      await nav.getByRole("link", { name: rotulo }).click();
      await expect(page).toHaveURL(url);
    }
  });

  test("o FAB abre o painel de comandos", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Adicionar" }).click();
    await expect(page.getByPlaceholder("Buscar ou criar…")).toBeVisible();
  });

  test("a sidebar do desktop não aparece", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("complementary")).toBeHidden();
  });
});

