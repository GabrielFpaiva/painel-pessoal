"use server";

import { redirect } from "next/navigation";

import {
  inviteState,
  normalizeUsername,
  validateUsername,
  type InviteRow,
} from "@/domain/account/invite";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type RedeemError =
  | "not_authenticated"
  | "already_has_profile"
  | "code_required"
  | "code_not_found"
  | "code_expired"
  | "code_already_used"
  | "username_required"
  | "username_too_short"
  | "username_too_long"
  | "username_invalid_chars"
  | "username_taken"
  | "unknown";

export type RedeemState = { error: RedeemError } | null;

const USERNAME_ERROR: Record<string, RedeemError> = {
  required: "username_required",
  too_short: "username_too_short",
  too_long: "username_too_long",
  invalid_chars: "username_invalid_chars",
};

const INVITE_ERROR: Record<string, RedeemError> = {
  not_found: "code_not_found",
  expired: "code_expired",
  already_used: "code_already_used",
};

/** Violação de unicidade no Postgres. */
const UNIQUE_VIOLATION = "23505";

/**
 * Resgate do convite. Roda com service role porque precisa escrever `profiles`
 * e `invites` de um usuário que ainda não tem perfil — nenhuma policy pode
 * permitir isso sem abrir o cadastro (ADR-04).
 *
 * A ordem importa: o convite é reivindicado primeiro, em um update condicional
 * que só acerta linha ainda não usada. Dois pedidos simultâneos com o mesmo
 * código — só um vence, e é o banco que decide, não a aplicação.
 */
export async function redeemInvite(
  _previous: RedeemState,
  formData: FormData,
): Promise<RedeemState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "not_authenticated" };

  const admin = createAdminClient();

  const existing = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing.data) return { error: "already_has_profile" };

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "code_required" };

  const rawUsername = String(formData.get("username") ?? "");
  const usernameError = validateUsername(rawUsername);
  if (usernameError) {
    return { error: USERNAME_ERROR[usernameError] ?? "unknown" };
  }
  const username = normalizeUsername(rawUsername);

  const invite = await admin
    .from("invites")
    .select("code, used_by, used_at, expires_at")
    .eq("code", code)
    .maybeSingle();

  const state = inviteState(invite.data as InviteRow | null, new Date());
  if (state !== "valid") return { error: INVITE_ERROR[state] ?? "unknown" };

  // Reivindica antes de criar o perfil: se dois pedidos chegarem juntos, o
  // segundo não acha linha para atualizar e é recusado.
  const claimed = await admin
    .from("invites")
    .update({ used_by: user.id, used_at: new Date().toISOString() })
    .eq("code", code)
    .is("used_by", null)
    .select("code");

  if (claimed.error || claimed.data?.length !== 1) {
    return { error: "code_already_used" };
  }

  const created = await admin
    .from("profiles")
    .insert({ id: user.id, username })
    .select("id")
    .single();

  if (created.error) {
    // Devolve o convite: o código não pode queimar por um username repetido.
    await admin
      .from("invites")
      .update({ used_by: null, used_at: null })
      .eq("code", code);

    if (created.error.code === UNIQUE_VIOLATION) {
      return { error: "username_taken" };
    }
    return { error: "unknown" };
  }

  redirect("/dashboard");
}
