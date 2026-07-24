import { expect, test } from "./fixtures";

/** Aceite da 0.5: navegável a 390px com o polegar; ⌘K navega e cria no desktop. */

test.beforeEach(async ({ novoUsuario, db }) => {
  await db.query(`insert into public.profiles (id, username) values ($1, $2)`, [
    novoUsuario.id,
    `s${Date.now()}`.slice(0, 30),
  ]);
});

test.describe("desktop", () => {
  test("sidebar no lugar da bottom nav", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("complementary")).toBeVisible();
    // A bottom nav existe no DOM, mas escondida — é `md:hidden`.
    const bottom = page.locator("nav.fixed");
    await expect(bottom).toBeHidden();
  });

  test("⌘K navega", async ({ page }) => {
    await page.goto("/dashboard");

    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByPlaceholder("Buscar ou criar…")).toBeVisible();

    await page.getByRole("option", { name: "Missões", exact: true }).click();
    await expect(page).toHaveURL("/missoes");
  });

  test("⌘K cria", async ({ page }) => {
    await page.goto("/dashboard");

    await page.keyboard.press("ControlOrMeta+k");
    await page.getByPlaceholder("Buscar ou criar…").fill("Nova Biblioteca");
    await page.getByRole("option", { name: /Nova Biblioteca/ }).click();

    // `?novo=1` é o contrato com a Fase 1: a tela abre o formulário.
    await expect(page).toHaveURL("/livros?novo=1");
  });

  test("⌘K fecha com Escape", async ({ page }) => {
    await page.goto("/dashboard");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByPlaceholder("Buscar ou criar…")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder("Buscar ou criar…")).toBeHidden();
  });
});
