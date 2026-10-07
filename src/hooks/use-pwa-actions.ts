import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  canNotify,
  currentPushEndpoint,
  initInstallPrompt,
  isStandalone,
  notificationPermission,
  pushSupported,
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  triggerInstallPrompt,
  unsubscribeFromPush,
} from "@/lib/pwa";

/**
 * Instalar app e notificações push do painel. Lógica movida sem alteração de
 * `$slug.admin.index.tsx` (mesmos fluxos, mesma tabela push_subscriptions).
 */
export function usePwaActions(tenantId: string | null) {
  const [notifPerm, setNotifPerm] = useState<string>("default");
  const [installReady, setInstallReady] = useState(false);
  const [pushEndpoint, setPushEndpoint] = useState<string | null>(null);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    initInstallPrompt(() => setInstallReady(true));
    if (canNotify()) setNotifPerm(notificationPermission());
    currentPushEndpoint().then((ep) => setPushEndpoint(ep));
  }, []);

  async function handleEnablePush() {
    if (!tenantId) return;
    setPushBusy(true);
    try {
      const p = await requestNotificationPermission();
      setNotifPerm(p);
      if (p !== "granted") {
        if (p === "denied") toast.error("Permissão negada nas configurações do navegador.");
        return;
      }
      const sub = await subscribeToPush();
      if (!sub) {
        toast.error("Não foi possível ativar push neste dispositivo.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          tenant_id: tenantId,
          user_id: sess.session?.user.id ?? null,
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        { onConflict: "endpoint" },
      );
      if (error) {
        toast.error("Falha ao registrar dispositivo: " + error.message);
        return;
      }
      setPushEndpoint(sub.endpoint);
      toast.success("Notificações push ativadas.");
    } finally {
      setPushBusy(false);
    }
  }

  async function handleDisablePush() {
    setPushBusy(true);
    try {
      const endpoint = pushEndpoint ?? (await currentPushEndpoint());
      const removed = await unsubscribeFromPush();
      const ep = endpoint ?? removed;
      if (ep) await supabase.from("push_subscriptions").delete().eq("endpoint", ep);
      setPushEndpoint(null);
      toast.success("Notificações push desativadas.");
    } finally {
      setPushBusy(false);
    }
  }

  async function handleInstall() {
    const r = await triggerInstallPrompt();
    if (r === "accepted") {
      toast.success("Aplicativo instalado.");
      setInstallReady(false);
    }
  }

  const canUsePush = pushSupported();
  const pushActive = !!pushEndpoint;
  return {
    pushBusy,
    pushActive,
    showInstall: installReady && !isStandalone(),
    showPushCTA: canUsePush && !pushActive && notifPerm !== "unsupported",
    showLegacyNotifCTA:
      !canUsePush && canNotify() && notifPerm !== "granted" && notifPerm !== "unsupported",
    handleEnablePush,
    handleDisablePush,
    handleInstall,
  };
}
