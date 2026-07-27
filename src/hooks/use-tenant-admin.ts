import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { getTenantBySlug, type Tenant } from "@/lib/tenant";

export type TenantAdminState = {
  ready: boolean;
  tenant: Tenant | null;
  userId: string | null;
  isSuper: boolean;
};

/**
 * Guarda compartilhada das telas /$slug/admin/*.
 *
 * Regras:
 *  - sem sessão -> vai para o login da empresa;
 *  - sessão sem vínculo com ESTA empresa -> mensagem clara + logout;
 *  - senha provisória (must_change_password) -> força a troca antes de seguir.
 */
export function useTenantAdmin(slug: string, options?: { skipPasswordGate?: boolean }): TenantAdminState {
  const navigate = useNavigate();
  const [state, setState] = useState<TenantAdminState>({
    ready: false, tenant: null, userId: null, isSuper: false,
  });
  const skipPasswordGate = options?.skipPasswordGate ?? false;

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!sess.session) {
        navigate({ to: "/$slug/admin/login", params: { slug } });
        return;
      }

      const user = sess.session.user;

      if (!skipPasswordGate && user.user_metadata?.must_change_password === true) {
        navigate({ to: "/$slug/admin/trocar-senha", params: { slug } });
        return;
      }

      const tenant = await getTenantBySlug(slug);
      if (!mounted) return;
      if (!tenant) {
        toast.error("Empresa não encontrada.");
        navigate({ to: "/" });
        return;
      }

      const [{ data: allowed }, { data: isSuper }] = await Promise.all([
        supabase.rpc("has_tenant_role", { _user_id: user.id, _tenant_id: tenant.id }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "super_admin" }),
      ]);
      if (!mounted) return;

      if (!allowed) {
        toast.error("Este login não pertence a esta empresa.");
        await supabase.auth.signOut();
        navigate({ to: "/$slug/admin/login", params: { slug } });
        return;
      }

      setState({ ready: true, tenant, userId: user.id, isSuper: isSuper === true });
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate({ to: "/$slug/admin/login", params: { slug } });
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [navigate, slug, skipPasswordGate]);

  return state;
}
