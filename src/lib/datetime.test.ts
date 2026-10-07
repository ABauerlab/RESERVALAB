import { describe, expect, it } from "vitest";

import { addDaysISO, agoraHHMM, todayISO, weekdayIndexISO } from "./datetime";

describe("datetime (America/Sao_Paulo)", () => {
  it("20h59 em Brasilia ainda e o mesmo dia", () => {
    const i = new Date("2026-10-07T23:59:00Z");
    expect(todayISO(i)).toBe("2026-10-07");
    expect(agoraHHMM(i)).toBe("20:59");
  });
  it("21h00 em Brasilia (00h00 UTC) continua no mesmo dia", () => {
    const i = new Date("2026-10-08T00:00:00Z");
    expect(todayISO(i)).toBe("2026-10-07");
    expect(agoraHHMM(i)).toBe("21:00");
  });
  it("23h59 em Brasilia", () => {
    const i = new Date("2026-10-08T02:59:00Z");
    expect(todayISO(i)).toBe("2026-10-07");
    expect(agoraHHMM(i)).toBe("23:59");
  });
  it("00h00 em Brasilia vira o dia", () => {
    const i = new Date("2026-10-08T03:00:00Z");
    expect(todayISO(i)).toBe("2026-10-08");
    expect(agoraHHMM(i)).toBe("00:00");
  });
  it("virada de mes e de ano", () => {
    expect(todayISO(new Date("2026-12-31T23:30:00Z"))).toBe("2026-12-31");
    expect(todayISO(new Date("2027-01-01T03:00:00Z"))).toBe("2027-01-01");
    expect(todayISO(new Date("2026-10-31T23:59:00Z"))).toBe("2026-10-31");
  });
  it("addDaysISO e weekdayIndexISO nao dependem de fuso", () => {
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysISO("2026-03-01", -1)).toBe("2026-02-28");
    expect(weekdayIndexISO("2026-10-07")).toBe(3);
  });
});
