/**
 * Validação dos campos do certificado. Puro: sem I/O, sem `new Date()`.
 * Espelha os CHECKs de `public.certificates` (título presente, workload ≥ 0,
 * expires_on ≥ issued_on) para o formulário recusar antes de tocar no banco.
 */

export type CertificateInput = {
  title: string;
  institution?: string | null;
  issued_on?: string | null; // 'YYYY-MM-DD'
  expires_on?: string | null; // 'YYYY-MM-DD'
  workload_hours?: number | null;
  credential_id?: string | null;
  verification_url?: string | null;
};

export type CertificateFieldError = {
  field: "title" | "workload_hours" | "expires_on" | "verification_url";
  code: "required" | "negative" | "before_issued" | "invalid_url";
};

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * `null` quer dizer válido. Retorna a primeira falha na ordem em que o usuário
 * lê o formulário — título, carga, datas, link — para o foco cair no campo
 * certo. As datas em `YYYY-MM-DD` comparam bem lexicograficamente.
 */
export function validateInput(input: CertificateInput): CertificateFieldError | null {
  if (input.title.trim().length === 0) {
    return { field: "title", code: "required" };
  }

  if (
    input.workload_hours !== null &&
    input.workload_hours !== undefined &&
    input.workload_hours < 0
  ) {
    return { field: "workload_hours", code: "negative" };
  }

  if (input.issued_on && input.expires_on && input.expires_on < input.issued_on) {
    return { field: "expires_on", code: "before_issued" };
  }

  if (input.verification_url && !isHttpUrl(input.verification_url)) {
    return { field: "verification_url", code: "invalid_url" };
  }

  return null;
}
