import { describe, expect, it } from "vitest";

import {
  decidirEvento,
  valorEsperadoCentavos,
  type EventoPagamento,
  type Pedido,
} from "@/lib/pagamentos";

const pedido: Pedido = {
  id: "p1",
  tenantId: "t1",
  plano: "essencial",
  ciclo: "mensal",
  valorCentavos: 8900,
  status: "pendente",
  ultimoEventoEm: null,
};
const ev = (o: Partial<EventoPagamento> = {}): EventoPagamento => ({
  provedor: "x",
  eventoId: "e1",
  referencia: "p1",
  valorCentavos: 8900,
  moeda: "BRL",
  status: "aprovado",
  ocorridoEm: 1000,
  ...o,
});
const on = { eventoJaProcessado: false, liberacaoAtiva: true };

describe("decidirEvento", () => {
  it("valores esperados vem do catalogo de planos", () => {
    expect(valorEsperadoCentavos("essencial", "mensal")).toBe(8900);
    expect(valorEsperadoCentavos("pro", "anual")).toBe(189000);
  });
  it("pagamento confirmado ativa o plano", () => {
    expect(decidirEvento(pedido, ev(), on)).toEqual({
      acao: "aplicar",
      novoStatus: "aprovado",
      plano: "ativar",
      simulado: false,
    });
  });
  it("em modo de teste muda o estado mas nao libera plano", () => {
    const d = decidirEvento(pedido, ev(), { ...on, liberacaoAtiva: false });
    expect(d).toMatchObject({ acao: "aplicar", simulado: true });
  });
  it("evento repetido e ignorado", () => {
    expect(decidirEvento(pedido, ev(), { ...on, eventoJaProcessado: true })).toEqual({
      acao: "ignorar",
      motivo: "duplicado",
    });
  });
  it("pagamento pendente nao libera", () => {
    expect(decidirEvento(pedido, ev({ status: "pendente" }), on)).toEqual({
      acao: "ignorar",
      motivo: "sem_mudanca",
    });
  });
  it("recusado nao ativa", () => {
    expect(decidirEvento(pedido, ev({ status: "recusado" }), on)).toMatchObject({
      plano: "manter",
    });
  });
  it("valor diferente do plano e rejeitado", () => {
    expect(decidirEvento(pedido, ev({ valorCentavos: 100 }), on)).toEqual({
      acao: "rejeitar",
      motivo: "valor_divergente",
    });
  });
  it("moeda diferente e rejeitada", () => {
    expect(decidirEvento(pedido, ev({ moeda: "USD" }), on)).toMatchObject({
      motivo: "moeda_invalida",
    });
  });
  it("pedido inexistente ou de outra referencia e rejeitado", () => {
    expect(decidirEvento(null, ev(), on)).toMatchObject({ motivo: "pedido_inexistente" });
  });
  it("evento atrasado nao regride o estado", () => {
    const aprovado = { ...pedido, status: "aprovado" as const, ultimoEventoEm: 2000 };
    expect(decidirEvento(aprovado, ev({ status: "pendente", ocorridoEm: 1500 }), on)).toMatchObject(
      {
        motivo: "fora_de_ordem",
      },
    );
    expect(decidirEvento(aprovado, ev({ status: "pendente", ocorridoEm: 3000 }), on)).toMatchObject(
      {
        motivo: "fora_de_ordem",
      },
    );
  });
  it("estorno depois de aprovado revoga o plano", () => {
    const aprovado = { ...pedido, status: "aprovado" as const, ultimoEventoEm: 2000 };
    expect(
      decidirEvento(aprovado, ev({ status: "estornado", ocorridoEm: 3000 }), on),
    ).toMatchObject({
      plano: "revogar",
    });
  });
});
