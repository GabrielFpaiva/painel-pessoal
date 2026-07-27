import { describe, expect, it } from "vitest";

import { extForMime, MAX_FILE_BYTES, validateFile } from "./file";

describe("validateFile", () => {
  it("aceita os três mimes do schema dentro do teto", () => {
    for (const mime of ["application/pdf", "image/png", "image/jpeg"]) {
      expect(validateFile({ mime, size: 1024 }), mime).toBeNull();
    }
  });

  it("aceita exatamente 5 MB e recusa 6 MB", () => {
    expect(validateFile({ mime: "application/pdf", size: MAX_FILE_BYTES })).toBeNull();
    expect(
      validateFile({ mime: "application/pdf", size: MAX_FILE_BYTES + 1 }),
    ).toBe("too_big");
    expect(validateFile({ mime: "image/png", size: 6 * 1024 * 1024 })).toBe(
      "too_big",
    );
  });

  it("recusa mime fora do conjunto permitido", () => {
    expect(validateFile({ mime: "image/gif", size: 1024 })).toBe("mime");
    expect(validateFile({ mime: "application/zip", size: 1024 })).toBe("mime");
    expect(validateFile({ mime: "", size: 1024 })).toBe("mime");
  });

  it("reclama do mime antes do tamanho quando os dois estão errados", () => {
    // O tipo de arquivo é o problema mais fundamental — trocar o arquivo resolve
    // os dois; encolher um arquivo do tipo errado não adianta.
    expect(validateFile({ mime: "image/gif", size: 9 * 1024 * 1024 })).toBe(
      "mime",
    );
  });
});

describe("extForMime", () => {
  it("mapeia cada mime para a extensão do arquivo salvo", () => {
    expect(extForMime("application/pdf")).toBe("pdf");
    expect(extForMime("image/png")).toBe("png");
    expect(extForMime("image/jpeg")).toBe("jpg");
  });
});
