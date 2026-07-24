/**
 * Regras de convite e de username. Puro: sem I/O, sem Supabase, sem `new Date()`
 * — "agora" entra como parâmetro (ADR-11).
 *
 * O resgate em si roda no servidor com service role; o que decide aceitar ou
 * recusar mora aqui, para ser testável sem banco.
 */

/** Espelha o CHECK de `profiles.username` no schema. Um só lugar muda. */
const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/;
const USERNAME_MIN = 3;
const USERNAME_MAX = 30;

export type UsernameError =
  | "required"
  | "too_short"
  | "too_long"
  | "invalid_chars";

/**
 * `profiles.username` é `citext`: o banco compara sem diferenciar maiúscula.
 * Normalizamos antes de gravar para o que o usuário vê ser o que está lá.
 */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** `null` quer dizer válido. */
export function validateUsername(raw: string): UsernameError | null {
  const username = normalizeUsername(raw);

  if (username.length === 0) return "required";
  if (username.length < USERNAME_MIN) return "too_short";
  if (username.length > USERNAME_MAX) return "too_long";
  if (!USERNAME_PATTERN.test(username)) return "invalid_chars";

  return null;
}

export type InviteRow = {
  code: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
};

export type InviteState = "valid" | "not_found" | "expired" | "already_used";

/**
 * Três recusas distintas, de propósito: o usuário precisa saber se pede outro
 * código, se o dele já foi usado ou se digitou errado.
 *
 * Ordem importa — convite usado E vencido é reportado como usado, que é a
 * informação acionável.
 */
export function inviteState(
  invite: InviteRow | null | undefined,
  now: Date,
): InviteState {
  if (!invite) return "not_found";
  if (invite.used_by !== null || invite.used_at !== null) return "already_used";
  if (new Date(invite.expires_at).getTime() <= now.getTime()) return "expired";
  return "valid";
}
