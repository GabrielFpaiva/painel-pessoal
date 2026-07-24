import { describe, expect, it } from "vitest";

import {
  inviteState,
  normalizeUsername,
  validateUsername,
  type InviteRow,
} from "./invite";

describe("normalizeUsername", () => {
  it("apara espaço e baixa a caixa, porque a coluna é citext", () => {
    expect(normalizeUsername("  Gabriel_7  ")).toBe("gabriel_7");
  });
});

describe("validateUsername", () => {
  it("aceita o que o CHECK do banco aceita", () => {
    for (const ok of ["g7g", "gabriel", "gabriel_7", "a-b-c", "a".repeat(30)]) {
      expect(validateUsername(ok), ok).toBeNull();
    }
  });

  it("recusa vazio antes de reclamar de tamanho", () => {
    expect(validateUsername("")).toBe("required");
    expect(validateUsername("   ")).toBe("required");
  });

  it("recusa curto e longo pelos limites do schema", () => {
    expect(validateUsername("ab")).toBe("too_short");
    expect(validateUsername("a".repeat(31))).toBe("too_long");
  });

  it("recusa caractere fora do conjunto, inclusive acento e espaço", () => {
    expect(validateUsername("gabriel paiva")).toBe("invalid_chars");
    expect(validateUsername("gabriél")).toBe("invalid_chars");
    expect(validateUsername("gabriel@7")).toBe("invalid_chars");
    expect(validateUsername("gabriel.7")).toBe("invalid_chars");
  });

  it("aceita caixa alta porque normaliza antes de validar", () => {
    expect(validateUsername("Gabriel")).toBeNull();
  });
});

describe("inviteState", () => {
  const now = new Date("2026-07-24T12:00:00Z");

  const base: InviteRow = {
    code: "abc123",
    used_by: null,
    used_at: null,
    expires_at: "2026-08-24T12:00:00Z",
  };

  it("aceita convite dentro da validade e não usado", () => {
    expect(inviteState(base, now)).toBe("valid");
  });

  it("recusa código que não existe", () => {
    expect(inviteState(null, now)).toBe("not_found");
    expect(inviteState(undefined, now)).toBe("not_found");
  });

  it("recusa convite vencido", () => {
    expect(
      inviteState({ ...base, expires_at: "2026-07-24T11:59:59Z" }, now),
    ).toBe("expired");
  });

  it("trata o instante exato do vencimento como vencido", () => {
    expect(
      inviteState({ ...base, expires_at: "2026-07-24T12:00:00Z" }, now),
    ).toBe("expired");
  });

  it("recusa convite já usado", () => {
    expect(
      inviteState(
        { ...base, used_by: "uuid-de-alguem", used_at: "2026-07-01T10:00:00Z" },
        now,
      ),
    ).toBe("already_used");
  });

  it("reporta 'usado' quando o convite está usado e vencido", () => {
    // O código já queimou; dizer 'vencido' mandaria o usuário pedir renovação
    // de um convite que nunca mais serve.
    expect(
      inviteState(
        {
          ...base,
          used_by: "uuid-de-alguem",
          used_at: "2026-07-01T10:00:00Z",
          expires_at: "2026-07-02T10:00:00Z",
        },
        now,
      ),
    ).toBe("already_used");
  });

  it("considera usado mesmo se só uma das duas colunas estiver preenchida", () => {
    expect(inviteState({ ...base, used_by: "uuid" }, now)).toBe("already_used");
    expect(inviteState({ ...base, used_at: "2026-07-01T10:00:00Z" }, now)).toBe(
      "already_used",
    );
  });
});
