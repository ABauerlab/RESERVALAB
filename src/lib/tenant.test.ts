import { afterEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn();
const eq2 = vi.fn(() => ({ maybeSingle }));
const eq1 = vi.fn(() => ({ eq: eq2 }));
const select = vi.fn(() => ({ eq: eq1 }));
const from = vi.fn(() => ({ select }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from },
}));

const { getTenantBySlug, clearTenantCache } = await import("@/lib/tenant");

describe("getTenantBySlug", () => {
  afterEach(() => {
    clearTenantCache();
    vi.clearAllMocks();
  });

  it("busca o tenant pelo slug em minúsculas e filtra por ativo=true", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { id: "1", slug: "meu-tenant" } });
    const tenant = await getTenantBySlug("Meu-Tenant");

    expect(from).toHaveBeenCalledWith("tenants");
    expect(select).toHaveBeenCalledWith("*");
    expect(eq1).toHaveBeenCalledWith("slug", "meu-tenant");
    expect(eq2).toHaveBeenCalledWith("ativo", true);
    expect(tenant).toEqual({ id: "1", slug: "meu-tenant" });
  });

  it("retorna null quando o tenant não é encontrado", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null });
    const tenant = await getTenantBySlug("inexistente");
    expect(tenant).toBeNull();
  });

  it("usa cache em consultas repetidas e não bate no banco de novo", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { id: "1", slug: "cacheado" } });

    const first = await getTenantBySlug("cacheado");
    const second = await getTenantBySlug("CACHEADO");

    expect(first).toEqual(second);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("também armazena em cache resultados negativos (tenant inexistente)", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null });

    await getTenantBySlug("sem-tenant");
    await getTenantBySlug("sem-tenant");

    expect(from).toHaveBeenCalledTimes(1);
  });

  it("clearTenantCache(slug) invalida apenas o slug informado", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { id: "1", slug: "a" } });
    await getTenantBySlug("a");
    clearTenantCache("a");

    maybeSingle.mockResolvedValueOnce({ data: { id: "1", slug: "a", updated: true } });
    const result = await getTenantBySlug("a");

    expect(from).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ id: "1", slug: "a", updated: true });
  });

  it("clearTenantCache() sem argumento limpa todo o cache", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { id: "1", slug: "a" } });
    maybeSingle.mockResolvedValueOnce({ data: { id: "2", slug: "b" } });
    await getTenantBySlug("a");
    await getTenantBySlug("b");
    clearTenantCache();

    maybeSingle.mockResolvedValueOnce({ data: { id: "1", slug: "a" } });
    await getTenantBySlug("a");

    expect(from).toHaveBeenCalledTimes(3);
  });
});
