import { expect, test } from "./fixtures";

/** Aceite da 0.3: sem sessão não se entra; sem convite válido não se cria conta. */

test.describe("sem sessão", () => {
  test("/dashboard cai no login e lembra para onde a pessoa ia", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL("/login?proxima=%2Fdashboard");
    await expect(
      page.getByRole("button", { name: /GitHub/i }),
    ).toBeVisible();
  });

  test("toda rota privada é barrada, não só o dashboard", async ({ page }) => {
    for (const rota of ["/academico", "/missoes", "/livros", "/config"]) {
      await page.goto(rota);
      await expect(page).toHaveURL(
        `/login?proxima=${encodeURIComponent(rota)}`,
      );
    }
  });

  test("o perfil público não exige sessão", async ({ page }) => {
    // Não existe ainda (Fase 4), mas não pode cair no login: é rota pública.
    const response = await page.goto("/u/alguem");
    expect(response?.status()).toBe(404);
    await expect(page).toHaveURL("/u/alguem");
  });
});

test.describe("autenticado, ainda sem perfil", () => {
  test("é desviado para o resgate do convite", async ({
    page,
    novoUsuario,
  }) => {
    expect(novoUsuario.id).toBeTruthy();

    await page.goto("/dashboard");

    await expect(page).toHaveURL("/aceitar-convite");
    await expect(
      page.getByRole("heading", { name: "Aceitar convite" }),
    ).toBeVisible();
  });

  test("convite inexistente é recusado com mensagem própria", async ({
    page,
    novoUsuario,
  }) => {
    await page.goto("/aceitar-convite");
    await page.getByLabel("Código do convite").fill("naoexiste123");
    await page.getByLabel("Nome de usuário").fill(`u${Date.now()}`);
    await page.getByRole("button", { name: "Criar minha conta" }).click();

    await expect(page.locator("form").getByRole("alert")).toContainText(
      "Não existe convite com esse código",
    );
    await expect(page).toHaveURL("/aceitar-convite");
    expect(novoUsuario.id).toBeTruthy();
  });

  test("convite vencido é recusado", async ({ page, novoUsuario }) => {
    await page.goto("/aceitar-convite");
    await page.getByLabel("Código do convite").fill(novoUsuario.invites.expired);
    await page.getByLabel("Nome de usuário").fill(`u${Date.now()}`);
    await page.getByRole("button", { name: "Criar minha conta" }).click();

    await expect(page.locator("form").getByRole("alert")).toContainText("Este convite venceu");
  });

  test("convite já usado é recusado", async ({ page, novoUsuario }) => {
    await page.goto("/aceitar-convite");
    await page.getByLabel("Código do convite").fill(novoUsuario.invites.used);
    await page.getByLabel("Nome de usuário").fill(`u${Date.now()}`);
    await page.getByRole("button", { name: "Criar minha conta" }).click();

    await expect(page.locator("form").getByRole("alert")).toContainText(
      "Este convite já foi usado",
    );
  });

  test("username com caractere proibido é erro do campo", async ({
    page,
    novoUsuario,
  }) => {
    await page.goto("/aceitar-convite");
    await page.getByLabel("Código do convite").fill(novoUsuario.invites.valid);
    await page.getByLabel("Nome de usuário").fill("nome com espaço");
    await page.getByRole("button", { name: "Criar minha conta" }).click();

    await expect(page.locator("form").getByRole("alert")).toContainText(
      "Use só letras minúsculas",
    );
    // O campo é marcado como inválido, não a página inteira.
    await expect(page.getByLabel("Nome de usuário")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("username já tomado devolve erro no campo e não queima o convite", async ({
    page,
    novoUsuario,
    db,
  }) => {
    const tomado = `tomado${Date.now()}`.slice(0, 30);

    // Outra pessoa já tem esse nome.
    const outro = await db.query<{ id: string }>(
      `insert into auth.users (id, instance_id, aud, role, email)
       values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
               'authenticated', 'authenticated', $1)
       returning id`,
      [`ocupado-${Date.now()}@example.test`],
    );
    const outroId = outro.rows[0]?.id;
    await db.query(`insert into public.profiles (id, username) values ($1, $2)`, [
      outroId,
      tomado,
    ]);

    await page.goto("/aceitar-convite");
    await page.getByLabel("Código do convite").fill(novoUsuario.invites.valid);
    await page.getByLabel("Nome de usuário").fill(tomado);
    await page.getByRole("button", { name: "Criar minha conta" }).click();

    await expect(page.locator("form").getByRole("alert")).toContainText(
      "Este nome já é de outra pessoa",
    );

    // O convite precisa ter sido devolvido: o código não pode morrer por causa
    // de um username repetido.
    const invite = await db.query<{ used_by: string | null }>(
      `select used_by from public.invites where code = $1`,
      [novoUsuario.invites.valid],
    );
    expect(invite.rows[0]?.used_by).toBeNull();

    await db.query(`delete from auth.users where id = $1`, [outroId]);
  });

  test("convite válido cria a conta e entra no painel", async ({
    page,
    novoUsuario,
    db,
  }) => {
    const username = `g${Date.now()}`.slice(0, 30);

    await page.goto("/aceitar-convite");
    await page.getByLabel("Código do convite").fill(novoUsuario.invites.valid);
    await page.getByLabel("Nome de usuário").fill(username);
    await page.getByRole("button", { name: "Criar minha conta" }).click();

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText(`@${username}`)).toBeVisible();

    // O convite foi consumido por este usuário, e uma vez só.
    const invite = await db.query<{ used_by: string | null }>(
      `select used_by from public.invites where code = $1`,
      [novoUsuario.invites.valid],
    );
    expect(invite.rows[0]?.used_by).toBe(novoUsuario.id);
  });

  test("com perfil criado, /aceitar-convite não é mais acessível", async ({
    page,
    novoUsuario,
    db,
  }) => {
    await db.query(`insert into public.profiles (id, username) values ($1, $2)`, [
      novoUsuario.id,
      `j${Date.now()}`.slice(0, 30),
    ]);

    await page.goto("/aceitar-convite");
    await expect(page).toHaveURL("/dashboard");
  });
});
