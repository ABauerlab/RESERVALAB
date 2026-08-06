// Edge Function: cria empresa (tenant) + usuário admin + role, com service role.
// A chave de serviço nunca sai do servidor.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Não autenticado" }, 401);

    // 1) Identifica o chamador com o token do usuário
    const asUser = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await asUser.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Sessão inválida" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 2) Só super_admin pode cadastrar empresa
    const { data: isSuper, error: roleErr } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "super_admin",
    });
    if (roleErr) return json({ error: roleErr.message }, 500);
    if (!isSuper) return json({ error: "Acesso negado" }, 403);

    // 3) Validação
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Payload inválido" }, 400);

    const slug = String(body.slug ?? "").toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");
    const nome = String(body.nome ?? "").trim();
    const email_admin = String(body.email_admin ?? "").toLowerCase().trim();
    const senha_admin = String(body.senha_admin ?? "");

    if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(slug)) return json({ error: "Slug inválido" }, 400);
    if (nome.length < 2) return json({ error: "Nome inválido" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_admin)) return json({ error: "E-mail inválido" }, 400);
    if (senha_admin.length < 6) return json({ error: "Senha muito curta" }, 400);

    const tipos = Array.isArray(body.tipos_aceitos) && body.tipos_aceitos.length
      ? body.tipos_aceitos
      : ["mesa", "aniversario", "evento", "casamento"];

    // 4) Cria o tenant
    const { data: tenant, error: tErr } = await admin
      .from("tenants")
      .insert({
        slug,
        nome,
        endereco: String(body.endereco ?? "").trim() || null,
        telefone_contato: String(body.telefone_contato ?? "").trim() || null,
        whatsapp: String(body.whatsapp ?? "").trim() || null,
        email_contato: email_admin,
        tipos_aceitos: tipos,
        ativo: true,
      })
      .select("*")
      .single();
    if (tErr || !tenant) return json({ error: tErr?.message ?? "Falha ao criar empresa" }, 400);

    // 5) Cria (ou reutiliza) o usuário admin da empresa
    let adminUserId: string | null = null;
    const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list.data?.users?.find((u) => u.email?.toLowerCase() === email_admin);
    if (existing) {
      adminUserId = existing.id;
      await admin.auth.admin.updateUserById(adminUserId, {
        password: senha_admin,
        user_metadata: { ...(existing.user_metadata ?? {}), must_change_password: true },
      });
    } else {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email: email_admin,
        password: senha_admin,
        email_confirm: true,
        user_metadata: { must_change_password: true },
      });
      if (cErr || !created.user) return json({ error: cErr?.message ?? "Falha ao criar usuário" }, 400);
      adminUserId = created.user.id;
    }

    // 6) Vincula como tenant_admin
    const { error: rErr } = await admin
      .from("user_roles")
      .insert({ user_id: adminUserId, role: "tenant_admin", tenant_id: tenant.id });
    if (rErr && !/duplicate|unique/i.test(rErr.message)) return json({ error: rErr.message }, 400);

    return json({ tenant });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro inesperado" }, 500);
  }
});
