import { expect, test } from "./fixtures";

/**
 * Aceite da 1.1: upload de PDF e de PNG, arquivo de 6 MB recusado com mensagem,
 * e a signed URL de download responde. A expiração (60 s) é assertada no unit,
 * não por espera aqui.
 */

// Um perfil já existente: o layout de (app) manda pro convite quem não tem.
test.beforeEach(async ({ novoUsuario, db, page }) => {
  await db.query(`insert into public.profiles (id, username) values ($1, $2)`, [
    novoUsuario.id,
    `c${Date.now()}`.slice(0, 30),
  ]);

  // Espiona window.open para capturar a signed URL sem depender de popup real.
  await page.addInitScript(() => {
    (window as unknown as { __opened: string[] }).__opened = [];
    window.open = (url?: string | URL) => {
      (window as unknown as { __opened: string[] }).__opened.push(String(url));
      return null;
    };
  });
});

// PNG 1x1 real e decodificável (a compressão precisa desenhar num canvas).
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function preenche(page: import("@playwright/test").Page, titulo: string) {
  await page.getByLabel("Título").fill(titulo);
}

test("cria certificado só com metadado, sem arquivo", async ({ page }) => {
  await page.goto("/certificados");
  await expect(page.getByText("Nenhum certificado ainda")).toBeVisible();

  await page.getByRole("link", { name: "Novo certificado" }).first().click();
  await preenche(page, "Curso de TypeScript");
  await page.getByRole("button", { name: "Salvar certificado" }).click();

  await expect(page).toHaveURL("/certificados");
  await expect(page.getByRole("heading", { name: "Curso de TypeScript" })).toBeVisible();
  await expect(page.getByText("Sem arquivo")).toBeVisible();
});

test("faz upload de PDF e abre por signed URL", async ({ page }) => {
  await page.goto("/certificados/novo");
  await preenche(page, "AWS Cloud Practitioner");
  await page
    .locator('input[name="file"]')
    .setInputFiles({ name: "cert.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 teste") });
  await page.getByRole("button", { name: "Salvar certificado" }).click();

  await expect(page).toHaveURL("/certificados");
  const abrir = page.getByRole("button", { name: "Abrir arquivo" });
  await expect(abrir).toBeVisible();
  await abrir.click();

  await expect
    .poll(async () =>
      page.evaluate(
        () => (window as unknown as { __opened: string[] }).__opened.length,
      ),
    )
    .toBeGreaterThan(0);
  const urls = await page.evaluate(
    () => (window as unknown as { __opened: string[] }).__opened,
  );
  expect(urls[0]).toContain("/storage/v1/");
  const res = await page.request.get(urls[0]!);
  expect(res.status()).toBe(200);
});

test("faz upload de PNG (comprimido no client)", async ({ page }) => {
  await page.goto("/certificados/novo");
  await preenche(page, "Badge PNG");
  await page
    .locator('input[name="file"]')
    .setInputFiles({ name: "badge.png", mimeType: "image/png", buffer: PNG_1PX });
  await page.getByRole("button", { name: "Salvar certificado" }).click();

  await expect(page).toHaveURL("/certificados");
  await expect(page.getByRole("button", { name: "Abrir arquivo" })).toBeVisible();
});

test("recusa arquivo acima de 5 MB com mensagem clara", async ({ page }) => {
  await page.goto("/certificados/novo");
  await preenche(page, "Certificado gigante");
  await page.locator('input[name="file"]').setInputFiles({
    name: "grande.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(6 * 1024 * 1024, 1),
  });
  await page.getByRole("button", { name: "Salvar certificado" }).click();

  await expect(page.getByText("O arquivo passa de 5 MB.")).toBeVisible();
  // Recusado antes de navegar: continua no formulário.
  await expect(page).toHaveURL("/certificados/novo");
});
