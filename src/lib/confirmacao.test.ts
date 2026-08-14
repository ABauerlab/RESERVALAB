import { describe, expect, it } from "vitest";
import {
  DEFAULT_MENSAGEM_CONFIRMACAO,
  buildMensagemConfirmacao,
  whatsappUrl,
  type ConfirmacaoContexto,
} from "@/lib/confirmacao";
import type { Reserva } from "@/lib/reservations";

function makeReserva(overrides: Partial<Reserva> = {}): Reserva {
  return {
    id: "1",
    tenant_id: "t1",
    nome: "Maria",
    telefone: "5511912345678",
    tipo: "mesa",
    status: "confirmada",
    area: "interna",
    data: "2026-08-17",
    horario: "19:30:00",
    quantidade: 4,
    codigo_acompanhamento: "ABC123",
    created_at: "2026-08-14T00:00:00Z",
    updated_at: "2026-08-14T00:00:00Z",
    observacoes: null,
    ...overrides,
  } as Reserva;
}

function makeContexto(overrides: Partial<ConfirmacaoContexto> = {}): ConfirmacaoContexto {
  return {
    reserva: makeReserva(),
    empresaNome: "Restaurante Exemplo",
    endereco: "Rua das Flores, 123",
    telefoneEmpresa: "5511999998888",
    linkAcompanhar: "https://exemplo.com/acompanhar/ABC123",
    ...overrides,
  };
}

describe("buildMensagemConfirmacao", () => {
  it("substitui todos os placeholders do template padrão", () => {
    const msg = buildMensagemConfirmacao(null, makeContexto());
    expect(msg).toContain("Ola Maria, tudo bem?");
    expect(msg).toContain("Restaurante Exemplo");
    expect(msg).toContain("Codigo: ABC123");
    expect(msg).toContain("Data: 17/08/2026");
    expect(msg).toContain("Horario: 19:30");
    expect(msg).toContain("Pessoas: 4");
    expect(msg).toContain("Tipo: Reserva de mesa");
    expect(msg).toContain("Endereco: Rua das Flores, 123");
    expect(msg).toContain("https://exemplo.com/acompanhar/ABC123");
  });

  it("usa o template padrão quando nenhum template customizado é passado", () => {
    const msg = buildMensagemConfirmacao(undefined, makeContexto());
    expect(msg.startsWith("Ola Maria, tudo bem?")).toBe(true);
  });

  it("usa o template padrão quando o template customizado é string vazia/em branco", () => {
    const msg = buildMensagemConfirmacao("   ", makeContexto());
    expect(msg).toContain("Ola Maria, tudo bem?");
  });

  it("remove linhas cujo valor ficou vazio após a substituição", () => {
    const msg = buildMensagemConfirmacao(null, makeContexto({ endereco: null }));
    expect(msg).not.toMatch(/^Endereco:\s*$/m);
  });

  it("aceita template customizado simples", () => {
    const msg = buildMensagemConfirmacao(
      "Oi {nome}! Sua mesa em {empresa} esta marcada.",
      makeContexto(),
    );
    expect(msg).toContain("Oi Maria! Sua mesa em Restaurante Exemplo esta marcada.");
  });

  it("acrescenta código e link quando o template customizado não os inclui", () => {
    const msg = buildMensagemConfirmacao("Oi {nome}, confirmado!", makeContexto());
    expect(msg).toContain("Codigo da reserva: ABC123");
    expect(msg).toContain("https://exemplo.com/acompanhar/ABC123");
  });

  it("não duplica código/link quando o template customizado já os inclui", () => {
    const msg = buildMensagemConfirmacao(
      "Oi {nome}, codigo {codigo}, link {link_acompanhar}",
      makeContexto(),
    );
    expect(msg).not.toContain("Codigo da reserva:");
    expect(msg.match(/https:\/\/exemplo\.com\/acompanhar\/ABC123/g)?.length).toBe(1);
  });

  it("preenche {area} com rótulo traduzido quando presente", () => {
    const msg = buildMensagemConfirmacao(
      "Area: {area} | {codigo} | {link_acompanhar}",
      makeContexto({ reserva: makeReserva({ area: "externa" }) }),
    );
    expect(msg).toBe("Area: Externa | ABC123 | https://exemplo.com/acompanhar/ABC123");
  });

  it("colapsa múltiplas linhas em branco resultantes da limpeza", () => {
    const msg = buildMensagemConfirmacao("{nome}\n\n\n\n{empresa}", makeContexto());
    expect(msg).not.toMatch(/\n{3,}/);
  });
});

describe("whatsappUrl", () => {
  it("monta a URL do WhatsApp com número e mensagem codificados", () => {
    const url = whatsappUrl("5511999998888", "Olá, tudo bem?");
    expect(url).toBe(
      "https://api.whatsapp.com/send?phone=5511999998888&text=Ol%C3%A1%2C%20tudo%20bem%3F",
    );
  });
});
