import { describe, expect, it } from "vitest";

import { medidasContain, recorteCover, validarArquivo } from "@/lib/assets";

describe("recorteCover (banner 3:1)", () => {
  it("imagem larga demais corta as laterais, centralizado", () => {
    expect(recorteCover(4000, 1000, 1200, 400)).toEqual({ sx: 500, sy: 0, sw: 3000, sh: 1000 });
  });
  it("foto vertical do celular corta em cima e embaixo", () => {
    const c = recorteCover(3000, 4000, 1200, 400);
    expect(c.sw).toBe(3000);
    expect(c.sh).toBe(1000);
    expect(c.sy).toBe(1500);
  });
  it("ja na proporcao nao corta", () => {
    expect(recorteCover(1200, 400, 1200, 400)).toEqual({ sx: 0, sy: 0, sw: 1200, sh: 400 });
  });
});

describe("medidasContain (icone)", () => {
  it("quadrado preenche; retangular centraliza sem distorcer", () => {
    expect(medidasContain(512, 512, 128, 128)).toEqual({ x: 0, y: 0, w: 128, h: 128 });
    expect(medidasContain(400, 200, 128, 128)).toEqual({ x: 0, y: 32, w: 128, h: 64 });
  });
});

describe("validarArquivo", () => {
  it("so PNG, JPG e WebP ate 10 MB; SVG nao", () => {
    expect(validarArquivo({ type: "image/png", size: 1000 })).toBeNull();
    expect(validarArquivo({ type: "image/svg+xml", size: 1000 })).not.toBeNull();
    expect(validarArquivo({ type: "image/jpeg", size: 11 * 1024 * 1024 })).not.toBeNull();
  });
});
