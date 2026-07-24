import { execFileSync } from "node:child_process";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Client } from "pg";

/**
 * A suíte se configura sozinha a partir do `supabase status`: nada de copiar
 * chave para .env.test e depois esquecer de atualizar.
 */
export type LocalConfig = {
  apiUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  dbUrl: string;
};

export function localConfig(): LocalConfig {
  let raw: string;
  try {
    raw = execFileSync("supabase", ["status", "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error(
      "Supabase local não está no ar. Rode `supabase start` antes de `pnpm test:rls`.",
    );
  }

  const status = JSON.parse(raw) as Record<string, string>;
  const need = (key: string): string => {
    const value = status[key];
    if (!value) throw new Error(`\`supabase status\` não trouxe ${key}.`);
    return value;
  };

  return {
    apiUrl: need("API_URL"),
    anonKey: need("ANON_KEY"),
    serviceRoleKey: need("SERVICE_ROLE_KEY"),
    dbUrl: need("DB_URL"),
  };
}

/** Conexão direta como superusuário: semeia e inspeciona o catálogo, fora da RLS. */
export async function connectDb(config: LocalConfig): Promise<Client> {
  const client = new Client({ connectionString: config.dbUrl });
  await client.connect();
  return client;
}

export type TestUser = {
  id: string;
  email: string;
  /** Client autenticado como este usuário — sujeito à RLS, como o browser. */
  db: SupabaseClient;
};

export function adminClient(config: LocalConfig): SupabaseClient {
  return createClient(config.apiUrl, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Cria o usuário e devolve um client já logado com a chave anon — o mesmo
 * caminho do browser, que é o que precisamos exercitar.
 */
export async function createTestUser(
  config: LocalConfig,
  admin: SupabaseClient,
  label: string,
): Promise<TestUser> {
  const email = `rls-${label}-${crypto.randomUUID()}@example.test`;
  const password = crypto.randomUUID();

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw new Error(`Falha ao criar usuário ${label}: ${created.error?.message}`);
  }

  const db = createClient(config.apiUrl, config.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const session = await db.auth.signInWithPassword({ email, password });
  if (session.error) {
    throw new Error(`Falha ao logar ${label}: ${session.error.message}`);
  }

  return { id: created.data.user.id, email, db };
}

export async function deleteTestUser(
  admin: SupabaseClient,
  user: TestUser,
): Promise<void> {
  await user.db.auth.signOut();
  await admin.auth.admin.deleteUser(user.id);
}
