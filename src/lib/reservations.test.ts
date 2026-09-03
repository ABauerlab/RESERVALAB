import { describe, expect, it } from "vitest";
import {
  formatData,
  formatHorario,
  formatTelefone,
  horariosDisponiveis,
  telefoneToWhatsApp,
} from "@/lib/reservations";

describe("formatTelefone", () => {
  it("formata número BR incompleto conforme o usuário digita", () => {
    expect(formatTelefone("1")).toBe("1");
    expect(formatTelefone("11")).toBe("11");
    expect(formatTelefone("1191")).toBe("(11) 91");
    expect(formatTelefone("11912345678")).toBe("(11) 91234-5678");
  });

  it("ignora caracteres não numéricos e limita a 11 dígitos (BR)", () => {
    expect(formatTelefone("(11) 9 1234-5678 extra")).toBe("(11) 91234-5678");
  });

  it("formata número internacional quando começa com +", () => {
    expect(formatTelefone("+")).toBe("+");
    expect(formatTelefone("+5")).toBe("+5");
    expect(formatTelefone("+55")).toBe("+55");
    expect(formatTelefone("+5511")).toBe("+55 11");
    expect(formatTelefone("+551191234")).toBe("+55 11 91234-");
    expect(formatTelefone("+5511912345678")).toBe("+55 11 91234-5678");
  });

  it("limita dígitos internacionais a 15 (padrão E.164)", () => {
    expect(formatTelefone("+551191234567890123")).toBe("+55 11 91234-567890");
  });
});

describe("telefoneToWhatsApp", () => {
  it("retorna string vazia para entrada vazia", () => {
    expect(telefoneToWhatsApp("")).toBe("");
    expect(telefoneToWhatsApp("   ")).toBe("");
  });

  it("assume DDI 55 quando não informado", () => {
    expect(telefoneToWhatsApp("(11) 91234-5678")).toBe("5511912345678");
  });

  it("não duplica o DDI 55 quando o número já começa com ele", () => {
    expect(telefoneToWhatsApp("55 11 91234-5678")).toBe("5511912345678");
  });

  it("usa o DDI informado após o + sem forçar 55", () => {
    expect(telefoneToWhatsApp("+1 415 555 0132")).toBe("14155550132");
  });
});

describe("formatData", () => {
  it("converte ISO (YYYY-MM-DD) para DD/MM/YYYY", () => {
    expect(formatData("2026-08-14")).toBe("14/08/2026");
  });

  it("retorna travessão para valores ausentes", () => {
    expect(formatData(null)).toBe("—");
    expect(formatData(undefined)).toBe("—");
    expect(formatData("")).toBe("—");
  });
});

describe("formatHorario", () => {
  it("trunca segundos de um horário HH:MM:SS", () => {
    expect(formatHorario("19:30:00")).toBe("19:30");
  });

  it("retorna travessão para valores ausentes", () => {
    expect(formatHorario(null)).toBe("—");
    expect(formatHorario(undefined)).toBe("—");
  });
});

describe("horariosDisponiveis", () => {
  it("retorna lista vazia quando a data não é informada", () => {
    expect(horariosDisponiveis("", 2)).toEqual([]);
  });

  it("usa horário de dia útil (11h-15h, passo de 30min) para grupos pequenos", () => {
    const slots = horariosDisponiveis("2026-08-17", 4); // segunda-feira
    expect(slots[0]).toBe("11:00");
    expect(slots[slots.length - 1]).toBe("15:00");
    expect(slots).toEqual([
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
    ]);
  });

  it("usa horário de fim de semana (12h-17h) para grupos pequenos", () => {
    const slots = horariosDisponiveis("2026-08-15", 4); // sábado
    expect(slots[0]).toBe("12:00");
    expect(slots[slots.length - 1]).toBe("17:00");
  });

  it("não inclui horários estendidos para grupos de até 30 pessoas", () => {
    const slots = horariosDisponiveis("2026-08-17", 30);
    expect(slots).not.toContain("08:00");
    expect(slots).not.toContain("15:30");
  });

  it("inclui horários estendidos em dia útil para grupos acima de 30 pessoas", () => {
    const slots = horariosDisponiveis("2026-08-17", 31);
    expect(slots[0]).toBe("08:00");
    expect(slots[slots.length - 1]).toBe("23:00");
    expect(slots).toContain("11:00"); // base ainda presente
  });

  it("inclui horários estendidos de fim de semana para grupos grandes", () => {
    const slots = horariosDisponiveis("2026-08-15", 50); // sábado
    expect(slots[0]).toBe("09:00");
    expect(slots[slots.length - 1]).toBe("23:00");
  });

  it("não duplica horários quando base e extras se sobrepõem, e mantém ordem crescente", () => {
    const slots = horariosDisponiveis("2026-08-17", 40);
    const unique = new Set(slots);
    expect(unique.size).toBe(slots.length);
    const sorted = [...slots].sort();
    expect(slots).toEqual(sorted);
  });

  it("aplica o horário-limite de dia de semana configurado pela empresa", () => {
    const slots = horariosDisponiveis("2026-08-17", 4, { semana: "13:00" }); // segunda-feira
    expect(slots[slots.length - 1]).toBe("13:00");
    expect(slots).not.toContain("13:30");
    expect(slots).not.toContain("15:00");
  });

  it("aplica o horário-limite de fim de semana configurado pela empresa", () => {
    const slots = horariosDisponiveis("2026-08-15", 4, { fimDeSemana: "14:00" }); // sábado
    expect(slots[slots.length - 1]).toBe("14:00");
    expect(slots).not.toContain("14:30");
  });

  it("ignora o limite de fim de semana em dia de semana e vice-versa", () => {
    const semana = horariosDisponiveis("2026-08-17", 4, { fimDeSemana: "10:00" }); // segunda
    expect(semana[semana.length - 1]).toBe("15:00");

    const fds = horariosDisponiveis("2026-08-15", 4, { semana: "10:00" }); // sábado
    expect(fds[fds.length - 1]).toBe("17:00");
  });

  it("aceita horário no formato HH:MM:SS (como vem do Postgres)", () => {
    const slots = horariosDisponiveis("2026-08-17", 4, { semana: "13:00:00" });
    expect(slots[slots.length - 1]).toBe("13:00");
  });

  it("sem limite configurado, mantém o horário de fechamento padrão", () => {
    const slots = horariosDisponiveis("2026-08-17", 4, {});
    expect(slots[slots.length - 1]).toBe("15:00");
  });

  it("não aplica o horário-limite a grupos grandes (acima de 30 pessoas)", () => {
    const slots = horariosDisponiveis("2026-08-17", 40, { semana: "13:00" });
    expect(slots).toContain("13:30");
    expect(slots[slots.length - 1]).toBe("23:00");
  });

  it("feriado em dia de semana usa a janela de horário de fim de semana", () => {
    const slots = horariosDisponiveis("2026-09-07", 4, undefined, true); // segunda-feira, feriado
    expect(slots[0]).toBe("12:00");
    expect(slots[slots.length - 1]).toBe("17:00");
  });

  it("feriado em dia de semana usa o horário-limite de fim de semana configurado", () => {
    const slots = horariosDisponiveis("2026-09-07", 4, { semana: "13:00", fimDeSemana: "14:00" }, true);
    expect(slots[slots.length - 1]).toBe("14:00");
  });

  it("sem a flag de feriado, dia de semana continua com a janela normal de dia útil", () => {
    const slots = horariosDisponiveis("2026-09-07", 4, undefined, false);
    expect(slots[0]).toBe("11:00");
    expect(slots[slots.length - 1]).toBe("15:00");
  });

  it("feriado em dia que já é fim de semana não muda nada", () => {
    const semFeriado = horariosDisponiveis("2026-08-15", 4); // sábado
    const comFeriado = horariosDisponiveis("2026-08-15", 4, undefined, true);
    expect(comFeriado).toEqual(semFeriado);
  });
});
