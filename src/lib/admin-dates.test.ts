import { describe, expect, it } from "vitest";

import { formatDataCurta, formatDataLonga } from "@/lib/admin-dates";

describe("datas do painel", () => {
  it("formato compacto do Brand System", () => {
    expect(formatDataCurta("2026-06-21")).toBe("Dom, 21 jun");
    expect(formatDataCurta("2026-06-20")).toBe("Sáb, 20 jun");
  });
  it("formato longo para titulos", () => {
    expect(formatDataLonga("2026-10-07")).toBe("Quarta-feira, 7 de outubro");
    expect(formatDataLonga("2026-10-10")).toBe("Sábado, 10 de outubro");
  });
});
