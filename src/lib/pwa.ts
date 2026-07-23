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

/* ==================== Web Push (VAPID) ==================== */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bufToBase64Url(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const r = await fetch("/api/public/vapid-public-key");
    if (!r.ok) return null;
    const j = (await r.json()) as { publicKey?: string };
    return j.publicKey ?? null;
  } catch {
    return null;
  }
}

export function pushSupported(): boolean {
  return IS_BROWSER && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Subscribe this device for background push. Returns the subscription object
 * (endpoint + keys) — caller persists it into `push_subscriptions`.
 */
export async function subscribeToPush(): Promise<
  { endpoint: string; p256dh: string; auth: string } | null
> {
  if (!pushSupported()) return null;
  const perm = await requestNotificationPermission();
  if (perm !== "granted") return null;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    const key = existing.getKey("p256dh");
    const auth = existing.getKey("auth");
    return {
      endpoint: existing.endpoint,
      p256dh: bufToBase64Url(key),
      auth: bufToBase64Url(auth),
    };
  }

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) return null;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });
  return {
    endpoint: sub.endpoint,
    p256dh: bufToBase64Url(sub.getKey("p256dh")),
    auth: bufToBase64Url(sub.getKey("auth")),
  };
}

export async function unsubscribeFromPush(): Promise<string | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
}

export async function currentPushEndpoint(): Promise<string | null> {
  if (!pushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return sub?.endpoint ?? null;
  } catch {
    return null;
  }
}
