import type { SupabaseClient } from "@supabase/supabase-js";
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { seedUser, type SeededIds } from "./fixture";
import {
  adminClient,
  connectDb,
  createTestUser,
  deleteTestUser,
  localConfig,
  type LocalConfig,
  type TestUser,
} from "./local";
import { tableSpecs } from "./tables";

/**
 * Isolamento por RLS, com dois usuários de verdade.
 *
 * A é o dono. B é qualquer outra pessoa com conta. A regra é uma só: **B não
 * enxerga nem toca em nada de A.** Rode isto a cada fase, não só na 0.4.
 */

let config: LocalConfig;
let db: Client;
let admin: SupabaseClient;
let userA: TestUser;
let userB: TestUser;
let seedA: SeededIds;

beforeAll(async () => {
  config = localConfig();
  db = await connectDb(config);
  admin = adminClient(config);

  userA = await createTestUser(config, admin, "a");
  userB = await createTestUser(config, admin, "b");

  seedA = await seedUser(db, userA.id, userA.id.slice(0, 8));
});

afterAll(async () => {
  if (userA) await deleteTestUser(admin, userA);
  if (userB) await deleteTestUser(admin, userB);
  if (db) await db.end();
});

describe("catálogo", () => {
  it("toda tabela de public tem RLS ligada e ao menos uma policy", async () => {
    const { rows } = await db.query<{
      table_name: string;
      rls_enabled: boolean;
      policy_count: string;
    }>(`
      select c.relname as table_name,
             c.relrowsecurity as rls_enabled,
             (select count(*) from pg_policies p
               where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname
    `);

    const semRls = rows.filter((r) => !r.rls_enabled).map((r) => r.table_name);
    const semPolicy = rows
      .filter((r) => Number(r.policy_count) === 0)
      .map((r) => r.table_name);

    expect(semRls, "tabelas sem row level security").toEqual([]);
    expect(semPolicy, "tabelas sem nenhuma policy").toEqual([]);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("toda tabela do catálogo está coberta por esta suíte", async () => {
    const { rows } = await db.query<{ table_name: string }>(`
      select c.relname as table_name
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
    `);

    const noBanco = rows.map((r) => r.table_name).sort();
    const naSuite = tableSpecs.map((s) => s.table).sort();

    // Quem adicionar tabela e esquecer de cobrir aqui descobre neste teste.
    expect(naSuite).toEqual(noBanco);
  });
});

describe.each(tableSpecs)("$table — B não alcança a linha de A", (spec) => {
  const asB = () => userB.db.from(spec.table);

  it("não lê", async () => {
    const { data, error } = await asB().select("*").match(spec.match(seedA));

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it.runIf(spec.patch)("não atualiza", async () => {
    const { data, error } = await asB()
      .update(spec.patch as Record<string, unknown>)
      .match(spec.match(seedA))
      .select();

    // A RLS não acusa erro: a linha simplesmente não existe para B.
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("não apaga", async () => {
    const { data, error } = await asB()
      .delete()
      .match(spec.match(seedA))
      .select();

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("não insere linha no espaço de A", async () => {
    const { error } = await asB().insert(spec.forge(seedA)).select();

    expect(error, "insert forjado deveria ter sido recusado").not.toBeNull();
  });
});

describe("depois de tudo", () => {
  it("os dados de A continuam intactos", async () => {
    // Prova final: nada do que B tentou encostou no banco.
    const counts = await Promise.all(
      tableSpecs.map(async (spec) => {
        const match = spec.match(seedA);
        const where = Object.keys(match)
          .map((column, index) => `${column} = $${index + 1}`)
          .join(" and ");
        const { rows } = await db.query<{ count: string }>(
          `select count(*) as count from public.${spec.table} where ${where}`,
          Object.values(match),
        );
        return [spec.table, Number(rows[0]?.count ?? 0)] as const;
      }),
    );

    expect(Object.fromEntries(counts)).toEqual(
      Object.fromEntries(tableSpecs.map((s) => [s.table, 1])),
    );
  });

  it("A continua enxergando o que é dele", async () => {
    // Contraprova: se a RLS estivesse apenas negando tudo, o teste acima
    // passaria por engano.
    const { data, error } = await userA.db
      .from("certificates")
      .select("id, title")
      .eq("id", seedA.certificateId);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]?.title).toBe("Certificado privado");
  });
});
