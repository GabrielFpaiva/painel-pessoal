import { describe, expect, it } from "vitest";

import { validateInput, type CertificateInput } from "./certificate";

const base: CertificateInput = {
  title: "AWS Certified Cloud Practitioner",
  institution: "Amazon Web Services",
  issued_on: "2026-01-10",
  expires_on: "2029-01-10",
  workload_hours: 40,
  credential_id: "ABC-123",
  verification_url: "https://verify.example.com/abc",
};

describe("validateInput", () => {
  it("aceita um certificado completo e bem formado", () => {
    expect(validateInput(base)).toBeNull();
  });

  it("aceita só com título — o resto é opcional", () => {
    expect(
      validateInput({
        title: "Curso de TypeScript",
        institution: null,
        issued_on: null,
        expires_on: null,
        workload_hours: null,
        credential_id: null,
        verification_url: null,
      }),
    ).toBeNull();
  });

  it("exige título e apara espaço antes de decidir", () => {
    expect(validateInput({ ...base, title: "" })).toEqual({
      field: "title",
      code: "required",
    });
    expect(validateInput({ ...base, title: "   " })).toEqual({
      field: "title",
      code: "required",
    });
  });

  it("recusa carga horária negativa, aceita zero e ausente", () => {
    expect(validateInput({ ...base, workload_hours: -1 })).toEqual({
      field: "workload_hours",
      code: "negative",
    });
    expect(validateInput({ ...base, workload_hours: 0 })).toBeNull();
    expect(validateInput({ ...base, workload_hours: null })).toBeNull();
  });

  it("recusa validade anterior à emissão, aceita igual", () => {
    expect(
      validateInput({ ...base, issued_on: "2026-01-10", expires_on: "2026-01-09" }),
    ).toEqual({ field: "expires_on", code: "before_issued" });
    expect(
      validateInput({ ...base, issued_on: "2026-01-10", expires_on: "2026-01-10" }),
    ).toBeNull();
  });

  it("não compara datas quando falta uma das duas", () => {
    expect(
      validateInput({ ...base, issued_on: null, expires_on: "2020-01-01" }),
    ).toBeNull();
    expect(
      validateInput({ ...base, issued_on: "2030-01-01", expires_on: null }),
    ).toBeNull();
  });

  it("recusa URL de verificação malformada, aceita vazia", () => {
    expect(validateInput({ ...base, verification_url: "nao-e-url" })).toEqual({
      field: "verification_url",
      code: "invalid_url",
    });
    expect(validateInput({ ...base, verification_url: "ftp://x/y" })).toEqual({
      field: "verification_url",
      code: "invalid_url",
    });
    expect(validateInput({ ...base, verification_url: "" })).toBeNull();
    expect(validateInput({ ...base, verification_url: null })).toBeNull();
  });

  it("checa título antes de qualquer outro campo", () => {
    expect(
      validateInput({ ...base, title: "", workload_hours: -5 }),
    ).toEqual({ field: "title", code: "required" });
  });
});
