/**
 * PWA + Web Notification helpers for the Iracema admin.
 *
 * Real background push (with app fully closed) requires VAPID + server delivery.
 * This MVP does the achievable, reliable version:
 *  - Installable PWA (manifest + service worker registration).
 *  - Realtime subscription on the reservations table (admin subscribes when signed in).
 *  - Fires a Web Notification when a new reserva arrives while the admin app is running
 *    (foreground, background tab, or minimized PWA on Android/desktop) — same UX as
 *    lightweight "iFood / Nuvemshop"-style pings for tabs kept open.
 */

const IS_BROWSER = typeof window !== "undefined";

function isPreview() {
  if (!IS_BROWSER) return true;
  const h = window.location.hostname;
  return (
    h.startsWith("id-preview--") ||
    h.startsWith("preview--") ||
    h.endsWith(".lovableproject.com") ||
    h.endsWith(".lovableproject-dev.com") ||
    h.endsWith(".beta.lovable.dev")
  );
}

export async function registerServiceWorker() {
  if (!IS_BROWSER || !("serviceWorker" in navigator)) return;
  if (isPreview()) return;
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (e) {
    console.warn("[pwa] SW registration failed", e);
  }
}

export function canNotify(): boolean {
  return IS_BROWSER && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!canNotify()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!canNotify()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  const result = await Notification.requestPermission();
  return result;
}

export function showNotification(title: string, body: string) {
  if (!canNotify() || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "iracema-reserva",
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* noop */
  }
}

/** BeforeInstallPrompt handling */
type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BIPEvent | null = null;

export function initInstallPrompt(onAvailable?: () => void) {
  if (!IS_BROWSER) return;
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BIPEvent;
    onAvailable?.();
  });
}

export async function triggerInstallPrompt(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredPrompt) return "unavailable";
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome;
}

export function isStandalone(): boolean {
  if (!IS_BROWSER) return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
