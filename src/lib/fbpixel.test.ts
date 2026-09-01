import { describe, expect, it, vi } from "vitest";
import { CLICK_RESERVA_EVENT, initFacebookPixel, trackFacebookCustomEvent, trackFacebookEvent } from "@/lib/fbpixel";

describe("CLICK_RESERVA_EVENT", () => {
  it("mapeia cada tipo de reserva para o nome de evento esperado", () => {
    expect(CLICK_RESERVA_EVENT).toEqual({
      mesa: "Click_Reserva_Mesa",
      aniversario: "Click_Reserva_Aniversario",
      evento: "Click_Reserva_Evento",
      casamento: "Click_Reserva_Casamento",
    });
  });
});

describe("initFacebookPixel", () => {
  it("não lança erro quando pixelId é nulo/vazio (ambiente sem DOM)", () => {
    expect(() => initFacebookPixel(null)).not.toThrow();
    expect(() => initFacebookPixel(undefined)).not.toThrow();
    expect(() => initFacebookPixel("")).not.toThrow();
  });

  it("regressão: enfileira init+PageView em fbq.queue sem lançar TypeError antes do fbevents.js carregar", () => {
    const appended: unknown[] = [];
    const fakeDocument = {
      createElement: () => ({}) as { async?: boolean; src?: string },
      head: { appendChild: (el: unknown) => appended.push(el) },
      body: { appendChild: (el: unknown) => appended.push(el) },
    };
    (globalThis as { document?: unknown }).document = fakeDocument;
    (globalThis as { window?: { fbq?: { queue?: unknown[] } } }).window = {};

    expect(() => initFacebookPixel("831333738696755")).not.toThrow();

    const win = (globalThis as { window?: { fbq?: { queue?: unknown[] } } }).window;
    expect(win?.fbq?.queue).toEqual([
      ["init", "831333738696755"],
      ["track", "PageView"],
    ]);
    expect(appended).toHaveLength(1);

    delete (globalThis as { document?: unknown }).document;
    delete (globalThis as { window?: unknown }).window;
  });

  it("depois que fbevents.js define callMethod, delega as chamadas pra ele (com `this` = fbq)", () => {
    const fakeDocument = {
      createElement: () => ({}) as { async?: boolean; src?: string },
      head: { appendChild: () => {} },
      body: { appendChild: () => {} },
    };
    (globalThis as { document?: unknown }).document = fakeDocument;
    (globalThis as { window?: { fbq?: { callMethod?: (...a: unknown[]) => void } } }).window = {};

    initFacebookPixel("831333738696755");

    const win = (globalThis as { window?: { fbq?: { callMethod?: (...a: unknown[]) => void } } })
      .window;
    const callMethod = vi.fn();
    win!.fbq!.callMethod = callMethod;

    (win!.fbq as unknown as (...a: unknown[]) => void)("trackCustom", "Click_Reserva_Mesa");

    expect(callMethod).toHaveBeenCalledWith("trackCustom", "Click_Reserva_Mesa");
    expect(callMethod.mock.instances[0]).toBe(win!.fbq);

    delete (globalThis as { document?: unknown }).document;
    delete (globalThis as { window?: unknown }).window;
  });
});

describe("trackFacebookEvent / trackFacebookCustomEvent", () => {
  it("não chama fbq quando pixelId é nulo/vazio, mesmo com fbq disponível", () => {
    const fbq = vi.fn();
    (globalThis as { window?: { fbq?: unknown } }).window = { fbq };
    trackFacebookEvent(null, "Lead");
    trackFacebookCustomEvent(undefined, "Click_Reserva_Mesa");
    expect(fbq).not.toHaveBeenCalled();
    delete (globalThis as { window?: unknown }).window;
  });

  it("chama fbq('track', ...) / fbq('trackCustom', ...) quando pixelId e fbq estão disponíveis", () => {
    const fbq = vi.fn();
    (globalThis as { window?: { fbq?: unknown } }).window = { fbq };
    trackFacebookEvent("831333738696755", "Lead", { content_name: "mesa" });
    trackFacebookCustomEvent("831333738696755", "Click_Reserva_Mesa");
    expect(fbq).toHaveBeenNthCalledWith(1, "track", "Lead", { content_name: "mesa" });
    expect(fbq).toHaveBeenNthCalledWith(2, "trackCustom", "Click_Reserva_Mesa", undefined);
    delete (globalThis as { window?: unknown }).window;
  });

  it("não lança erro quando não há window definido", () => {
    expect(() => trackFacebookEvent("831333738696755", "Lead")).not.toThrow();
    expect(() => trackFacebookCustomEvent("831333738696755", "Click_Reserva_Mesa")).not.toThrow();
  });
});
