import { execFileSync } from "node:child_process";

import { test as base, type BrowserContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

/**
 * Sessão de teste sem passar pelo GitHub.
 *
 * O produto entra só por GitHub OAuth, que exige um OAuth App e um humano
 * clicando em "Authorize" — inviável em teste automatizado. Então autenticamos
 * pela API do Supabase local (usuário e senha) e plantamos o mesmo cookie que o
 * `@supabase/ssr` plantaria. O que está sob teste é o que vem **depois** do
 * login: convite, middleware e casca.
 */

type LocalConfig = {
  apiUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  dbUrl: string;
};

function localConfig(): LocalConfig {
  let raw: string;
  try {
    raw = execFileSync("supabase", ["status", "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error("Supabase local não está no ar. Rode `supabase start`.");
  }
  const status = JSON.parse(raw) as Record<string, string>;
  return {
    apiUrl: status.API_URL ?? "",
    anonKey: status.ANON_KEY ?? "",
    serviceRoleKey: status.SERVICE_ROLE_KEY ?? "",
    dbUrl: status.DB_URL ?? "",
  };
}

/**
 * Nome do cookie do `@supabase/ssr`: `sb-<primeiro rótulo do host>-auth-token`.
 * Em `127.0.0.1:54321`, isso dá `sb-127-auth-token`.
 */
function cookieName(apiUrl: string): string {
  const host = new URL(apiUrl).hostname;
  return `sb-${host.split(".")[0]}-auth-token`;
}

export type Invites = {
  valid: string;
  expired: string;
  used: string;
};

export type AuthenticatedUser = {
  id: string;
  /** Ainda **sem** perfil: é o estado de quem acabou de autenticar. */
  invites: Invites;
};

type Fixtures = {
  /** Usuário autenticado sem perfil, com o cookie já no contexto. */
  novoUsuario: AuthenticatedUser;
  db: Client;
};

export const test = base.extend<Fixtures>({
  db: async ({}, use) => {
    const client = new Client({ connectionString: localConfig().dbUrl });
    await client.connect();
    await use(client);
    await client.end();
  },

  novoUsuario: async ({ context, db }, use) => {
    const config = localConfig();
    const admin = createClient(config.apiUrl, config.serviceRoleKey, {
      auth: { persistSession: false },
    });

    const email = `e2e-${crypto.randomUUID()}@example.test`;
    const password = crypto.randomUUID();

    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error || !created.data.user) {
      throw new Error(`Falha ao criar usuário: ${created.error?.message}`);
    }
    const userId = created.data.user.id;

    const invites = await seedInvites(db, userId);
    await plantSession(context, config, email, password);

    await use({ id: userId, invites });

    // Perfil sai por cascade quando o usuário morre.
    await admin.auth.admin.deleteUser(userId);
  },
});

async function seedInvites(db: Client, userId: string): Promise<Invites> {
  const valid = await db.query<{ code: string }>(
    `insert into public.invites (expires_at) values (now() + interval '7 days') returning code`,
  );
  const expired = await db.query<{ code: string }>(
    `insert into public.invites (expires_at) values (now() - interval '1 day') returning code`,
  );
  const used = await db.query<{ code: string }>(
    `insert into public.invites (used_by, used_at) values ($1, now()) returning code`,
    [userId],
  );

  return {
    valid: valid.rows[0]?.code ?? "",
    expired: expired.rows[0]?.code ?? "",
    used: used.rows[0]?.code ?? "",
  };
}

async function plantSession(
  context: BrowserContext,
  config: LocalConfig,
  email: string,
  password: string,
): Promise<void> {
  const anon = createClient(config.apiUrl, config.anonKey, {
    auth: { persistSession: false },
  });

  const signedIn = await anon.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) {
    throw new Error(`Falha ao autenticar: ${signedIn.error?.message}`);
  }

  const value = `base64-${Buffer.from(
    JSON.stringify(signedIn.data.session),
  ).toString("base64url")}`;

  await context.addCookies([
    {
      name: cookieName(config.apiUrl),
      value,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

export { expect } from "@playwright/test";
