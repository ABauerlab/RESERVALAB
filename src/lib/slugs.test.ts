import { describe, expect, it } from "vitest";

import { isSlugReservado, SLUGS_RESERVADOS } from "@/lib/slugs";
import { isValidSlug } from "@/lib/validators";

describe("slugs reservados", () => {
  it("bloqueia caminhos institucionais, sem diferenciar maiusculas", () => {
    for (const s of ["planos", "privacidade", "master", "EBOOK", " termos "]) {
      expect(isSlugReservado(s)).toBe(true);
    }
  });
  it("libera slugs de restaurantes", () => {
    expect(isSlugReservado("iracema")).toBe(false);
    expect(isSlugReservado("bar-legal")).toBe(false);
  });
  it("todos os reservados seguem o formato de slug", () => {
    for (const s of SLUGS_RESERVADOS) expect(isValidSlug(s)).toBe(true);
  });
});
