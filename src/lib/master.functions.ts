import { createServerFn } from "@tanstack/react-start";
import { requireRuntimeSupabaseAuth } from "@/integrations/supabase/auth-middleware-runtime";

const SUPER_ADMIN_EMAIL = "contato.bauerlab@gmail.com";
const SUPER_ADMIN_PASSWORD = "21254775";

// Idempotente: cria user + role super_admin se ainda não existir NENHUM super_admin no sistema.
// Chamado pela tela /master/login para bootstrap na primeira visita.
export const bootstrapSuperAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { getSupabaseAdmin } = await import("@/integrations/supabase/admin.server");
    const supabaseAdmin = getSupabaseAdmin();

  // Já existe super_admin?
  const { data: existing, error: rolesErr } = await supabaseAdmin
    .from("user_roles").select("id").eq("role", "super_admin").limit(1);
  if (rolesErr) throw new Error(rolesErr.message);
  if (existing && existing.length > 0) return { created: false };

  // Procura pelo user (pode existir sem role)
  let userId: string | null = null;
  const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list.data?.users?.find((u) => u.email?.toLowerCase() === SUPER_ADMIN_EMAIL);
  if (found) userId = found.id;

  if (!userId) {
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (cErr || !created.user) throw new Error(cErr?.message ?? "createUser falhou");
    userId = created.user.id;
  }

  const { error: rErr } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: userId, role: "super_admin", tenant_id: null });
  if (rErr) throw new Error(rErr.message);

  return { created: true };
});

export type CriarTenantInput = {
  slug: string;
  nome: string;
  email_admin: string;
  senha_admin: string;
  endereco?: string;
  telefone_contato?: string;
  whatsapp?: string;
  tipos_aceitos?: Array<"mesa" | "aniversario" | "evento" | "casamento">;
};

export const criarTenant = createServerFn({ method: "POST" })
  .middleware([requireRuntimeSupabaseAuth])
  .inputValidator((input: CriarTenantInput) => {
    if (!input || typeof input !== "object") throw new Error("Payload inválido");
    const slug = String(input.slug ?? "").toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");
    if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(slug)) throw new Error("Slug inválido");
    if (!input.nome || input.nome.trim().length < 2) throw new Error("Nome inválido");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email_admin ?? "")) throw new Error("E-mail inválido");
    if (!input.senha_admin || input.senha_admin.length < 6) throw new Error("Senha muito curta");
    const tipos = input.tipos_aceitos && input.tipos_aceitos.length
      ? input.tipos_aceitos
      : ["mesa", "aniversario", "evento", "casamento"] as const;
    return { ...input, slug, tipos_aceitos: tipos as CriarTenantInput["tipos_aceitos"] };
  })
  .handler(async ({ data, context }) => {
    // Verifica super_admin
    const { data: isSuper, error: roleErr } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
    if (roleErr) throw new Error(roleErr.message);
    if (!isSuper) throw new Error("Acesso negado");

    const { getSupabaseAdmin } = await import("@/integrations/supabase/admin.server");
    const supabaseAdmin = getSupabaseAdmin();

    // Cria tenant
    const { data: tenant, error: tErr } = await supabaseAdmin
      .from("tenants")
      .insert({
        slug: data.slug,
        nome: data.nome.trim(),
        endereco: data.endereco?.trim() || null,
        telefone_contato: data.telefone_contato?.trim() || null,
        whatsapp: data.whatsapp?.trim() || null,
        email_contato: data.email_admin,
        tipos_aceitos: data.tipos_aceitos ?? ["mesa", "aniversario", "evento", "casamento"],
        ativo: true,
      })
      .select("*")
      .single();
    if (tErr || !tenant) throw new Error(tErr?.message ?? "Falha ao criar empresa");

    // Cria user admin do tenant (ou reusa)
    let adminUserId: string | null = null;
    const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list.data?.users?.find((u) => u.email?.toLowerCase() === data.email_admin.toLowerCase());
    if (existing) {
      adminUserId = existing.id;
    } else {
      const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
        email: data.email_admin,
        password: data.senha_admin,
        email_confirm: true,
      });
      if (cErr || !created.user) throw new Error(cErr?.message ?? "Falha ao criar usuário");
      adminUserId = created.user.id;
    }

    // Grant tenant_admin
    const { error: grErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: adminUserId, role: "tenant_admin", tenant_id: tenant.id });
    if (grErr && !grErr.message.includes("duplicate")) throw new Error(grErr.message);

    return { tenant };
  });

export const listarTenants = createServerFn({ method: "GET" })
  .middleware([requireRuntimeSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isSuper } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
    if (!isSuper) throw new Error("Acesso negado");
    // Leitura normal: RLS já permite ao super_admin ver todas as empresas.
    const { data, error } = await context.supabase
      .from("tenants").select("*").order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { tenants: data ?? [] };
  });

export const toggleTenantAtivo = createServerFn({ method: "POST" })
  .middleware([requireRuntimeSupabaseAuth])
  .inputValidator((input: { id: string; ativo: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
    if (!isSuper) throw new Error("Acesso negado");
    const { getSupabaseAdmin } = await import("@/integrations/supabase/admin.server");
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("tenants").update({ ativo: data.ativo }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Gestão de logins (acessos) de cada empresa ----

export const listarAcessos = createServerFn({ method: "POST" })
  .middleware([requireRuntimeSupabaseAuth])
  .inputValidator((input: { tenant_id: string }) => {
    if (!input?.tenant_id) throw new Error("Empresa inválida");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
    if (!isSuper) throw new Error("Acesso negado");
    const { getSupabaseAdmin } = await import("@/integrations/supabase/admin.server");
    const supabaseAdmin = getSupabaseAdmin();
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles").select("id, user_id, created_at")
      .eq("tenant_id", data.tenant_id).eq("role", "tenant_admin");
    if (error) throw new Error(error.message);
    const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const users = list.data?.users ?? [];
    return {
      acessos: (roles ?? []).map((r) => {
        const u = users.find((x) => x.id === r.user_id);
        return {
          role_id: r.id,
          user_id: r.user_id,
          email: u?.email ?? "(usuário removido)",
          must_change_password: u?.user_metadata?.must_change_password === true,
          last_sign_in_at: u?.last_sign_in_at ?? null,
        };
      }),
    };
  });

export const criarAcesso = createServerFn({ method: "POST" })
  .middleware([requireRuntimeSupabaseAuth])
  .inputValidator((input: { tenant_id: string; email: string; senha: string }) => {
    if (!input?.tenant_id) throw new Error("Empresa inválida");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email ?? "")) throw new Error("E-mail inválido");
    if (!input.senha || input.senha.length < 6) throw new Error("Senha muito curta");
    return { ...input, email: input.email.toLowerCase().trim() };
  })
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
    if (!isSuper) throw new Error("Acesso negado");
    const { getSupabaseAdmin } = await import("@/integrations/supabase/admin.server");
    const supabaseAdmin = getSupabaseAdmin();

    const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list.data?.users?.find((u) => u.email?.toLowerCase() === data.email);
    let userId = found?.id ?? null;

    if (!userId) {
      const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.senha,
        email_confirm: true,
        user_metadata: { must_change_password: true },
      });
      if (cErr || !created.user) throw new Error(cErr?.message ?? "Falha ao criar usuário");
      userId = created.user.id;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.senha,
        user_metadata: { ...(found?.user_metadata ?? {}), must_change_password: true },
      });
    }

    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "tenant_admin", tenant_id: data.tenant_id });
    if (rErr && !/duplicate|unique/i.test(rErr.message)) throw new Error(rErr.message);

    return { ok: true };
  });

export const redefinirSenhaAcesso = createServerFn({ method: "POST" })
  .middleware([requireRuntimeSupabaseAuth])
  .inputValidator((input: { user_id: string; senha: string }) => {
    if (!input?.user_id) throw new Error("Usuário inválido");
    if (!input.senha || input.senha.length < 6) throw new Error("Senha muito curta");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
    if (!isSuper) throw new Error("Acesso negado");
    const { getSupabaseAdmin } = await import("@/integrations/supabase/admin.server");
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.senha,
      user_metadata: { must_change_password: true },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removerAcesso = createServerFn({ method: "POST" })
  .middleware([requireRuntimeSupabaseAuth])
  .inputValidator((input: { role_id: string }) => {
    if (!input?.role_id) throw new Error("Acesso inválido");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
    if (!isSuper) throw new Error("Acesso negado");
    const { getSupabaseAdmin } = await import("@/integrations/supabase/admin.server");
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("user_roles").delete().eq("id", data.role_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
