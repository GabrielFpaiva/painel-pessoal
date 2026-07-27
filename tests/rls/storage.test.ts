import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  adminClient,
  createTestUser,
  deleteTestUser,
  localConfig,
  type TestUser,
} from "./local";

/**
 * Isolamento do bucket privado `certificates`. A policy `cert_owner_all` libera
 * só quando a primeira pasta do caminho é o `auth.uid()`. Aqui exercitamos o
 * aceite da 1.1: o usuário B não baixa, não lista e não escreve no espaço de A.
 */
const BUCKET = "certificates";
const config = localConfig();
const admin = adminClient(config);

let alice: TestUser;
let bob: TestUser;
let alicePath: string;

beforeAll(async () => {
  alice = await createTestUser(config, admin, "cert-a");
  bob = await createTestUser(config, admin, "cert-b");
  alicePath = `${alice.id}/${crypto.randomUUID()}.pdf`;

  const blob = new Blob([new Uint8Array([37, 80, 68, 70])], {
    type: "application/pdf",
  });
  const up = await alice.db.storage
    .from(BUCKET)
    .upload(alicePath, blob, { contentType: "application/pdf" });
  expect(up.error, "A deveria conseguir subir na própria pasta").toBeNull();
});

afterAll(async () => {
  await admin.storage.from(BUCKET).remove([alicePath]);
  await deleteTestUser(admin, alice);
  await deleteTestUser(admin, bob);
});

describe("bucket certificates: dono", () => {
  it("A gera signed URL do próprio arquivo", async () => {
    const signed = await alice.db.storage
      .from(BUCKET)
      .createSignedUrl(alicePath, 60);
    expect(signed.error).toBeNull();
    expect(signed.data?.signedUrl).toBeTruthy();
  });

  it("A baixa o próprio arquivo", async () => {
    const down = await alice.db.storage.from(BUCKET).download(alicePath);
    expect(down.error).toBeNull();
    expect(down.data).toBeTruthy();
  });
});

describe("bucket certificates: intruso B não alcança o arquivo de A", () => {
  it("B não gera signed URL do arquivo de A", async () => {
    const signed = await bob.db.storage
      .from(BUCKET)
      .createSignedUrl(alicePath, 60);
    expect(signed.error).not.toBeNull();
    expect(signed.data).toBeNull();
  });

  it("B não baixa o arquivo de A", async () => {
    const down = await bob.db.storage.from(BUCKET).download(alicePath);
    expect(down.error).not.toBeNull();
  });

  it("B não lista a pasta de A", async () => {
    const list = await bob.db.storage.from(BUCKET).list(alice.id);
    // A RLS esconde as linhas: a listagem volta vazia, não com o arquivo de A.
    expect(list.data ?? []).toHaveLength(0);
  });

  it("B não escreve na pasta de A", async () => {
    const blob = new Blob([new Uint8Array([1])], { type: "application/pdf" });
    const up = await bob.db.storage
      .from(BUCKET)
      .upload(`${alice.id}/intruso.pdf`, blob, { contentType: "application/pdf" });
    expect(up.error).not.toBeNull();
  });
});
