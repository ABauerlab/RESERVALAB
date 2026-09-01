import type { ReservaTipo } from "@/lib/reservations";

/**
 * Nome do evento personalizado de clique disparado em cada botão de tipo de
 * reserva na página pública da empresa — serve para medir qual tipo de
 * reserva mais gera cliques (ex.: para otimizar campanhas no Meta Ads).
 */
export const CLICK_RESERVA_EVENT: Record<ReservaTipo, string> = {
  mesa: "Click_Reserva_Mesa",
  aniversario: "Click_Reserva_Aniversario",
  evento: "Click_Reserva_Evento",
  casamento: "Click_Reserva_Casamento",
};

type Fbq = ((...args: unknown[]) => void) & {
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: Fbq;
  callMethod?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: unknown;
  }
}

const loadedPixelIds = new Set<string>();

/**
 * Carrega o script base do Pixel do Meta (uma única vez por ID) e dispara o
 * evento padrão PageView. Não faz nada se `pixelId` for vazio/nulo — é assim
 * que o pixel fica restrito apenas às empresas com um ID configurado
 * (`tenants.pixel_facebook_id`), sem precisar de nenhuma checagem de slug no
 * código.
 */
export function initFacebookPixel(pixelId: string | null | undefined): void {
  if (!pixelId || typeof window === "undefined" || typeof document === "undefined") return;

  if (!window.fbq) {
    const fbq: Fbq = function (...args: unknown[]) {
      // Mesma lógica do snippet oficial do Meta Pixel: antes do fbevents.js
      // carregar, empilha as chamadas em `queue` (chamando .push() NO ARRAY,
      // com `this` apontando pra ele); depois que o script real assume e
      // define `callMethod`, delega pra ele (com `this` apontando pro
      // próprio `fbq`, que é o que `callMethod` espera). Um bug anterior
      // aqui fazia `.apply(fbq, ...)` nos dois casos — como toda função tem
      // uma propriedade `.length` não-gravável, `Array.prototype.push`
      // tentando incrementar `fbq.length` lançava um TypeError toda vez,
      // então o pixel nunca chegava a ser inicializado de verdade.
      if (fbq.callMethod) {
        fbq.callMethod(...(args as never[]));
      } else {
        fbq.queue!.push(args);
      }
    };
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  if (!loadedPixelIds.has(pixelId)) {
    loadedPixelIds.add(pixelId);
    window.fbq!("init", pixelId);
  }

  window.fbq!("track", "PageView");
}

/** Dispara um evento padrão do Meta Pixel (ex.: "Lead"). */
export function trackFacebookEvent(pixelId: string | null | undefined, eventName: string, params?: Record<string, unknown>): void {
  if (!pixelId || typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", eventName, params);
}

/** Dispara um evento personalizado do Meta Pixel (nome fora da lista padrão). */
export function trackFacebookCustomEvent(pixelId: string | null | undefined, eventName: string, params?: Record<string, unknown>): void {
  if (!pixelId || typeof window === "undefined" || !window.fbq) return;
  window.fbq("trackCustom", eventName, params);
}
