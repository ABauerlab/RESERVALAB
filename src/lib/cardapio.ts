import { supabase } from "@/integrations/supabase/client";

/**
 * Cardapio digital (F9). Sem delivery, carrinho ou pagamento: so categorias, itens e precos
 * publicados. A leitura publica passa pela funcao `cardapio_do_tenant` (por slug, so se publicado);
 * as tabelas so sao acessiveis ao admin da empresa. Toda consulta do admin mantem `tenant_id`.
 */

export type ItemCardapio = {
  id: string;
  nome: string;
  descricao: string | null;
  preco_centavos: number | null;
  imagem_url: string | null;
};

export type CategoriaCardapio = {
  id: string;
  nome: string;
  descricao: string | null;
  itens: ItemCardapio[];
};

export type CardapioPublico = { nome: string; categorias: CategoriaCardapio[] };

/** Linhas das tabelas, como o admin as le. */
export type CategoriaRow = {
  id: string;
  tenant_id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
};
export type ItemRow = {
  id: string;
  tenant_id: string;
  categoria_id: string;
  nome: string;
  descricao: string | null;
  preco_centavos: number | null;
  imagem_url: string | null;
  ordem: number;
  ativo: boolean;
};
export type PerfilRow = {
  tenant_id: string;
  instagram: string | null;
  cardapio_publicado: boolean;
  hub_publicado: boolean;
  marca_ativa?: boolean;
  hub_descricao?: string | null;
  hub_banner_url?: string | null;
  hub_banner_ativo?: boolean;
  hub_mostrar_cardapio?: boolean;
};

// As tabelas novas ainda nao estao em `types.ts` (arquivo gerado). Cliente sem tipos de tabela,
// restrito a este modulo.
type Resultado<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>;
type Consulta<T> = Resultado<T> & {
  select(cols?: string): Consulta<T>;
  insert(v: Record<string, unknown>): Consulta<T>;
  update(v: Record<string, unknown>): Consulta<T>;
  upsert(v: Record<string, unknown>, o?: { onConflict: string }): Consulta<T>;
  delete(): Consulta<T>;
  eq(col: string, v: unknown): Consulta<T>;
  order(col: string, o?: { ascending: boolean }): Consulta<T>;
  maybeSingle(): Resultado<T>;
};
export function tabela<T = unknown>(nome: string): Consulta<T> {
  return (supabase as unknown as { from(n: string): Consulta<T> }).from(nome);
}

export async function fetchCardapioPublico(slug: string): Promise<CardapioPublico | null> {
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: { _slug: string },
    ) => Resultado<CardapioPublico | null>
  )("cardapio_do_tenant", { _slug: slug });
  if (error) throw new Error(error.message);
  return data ?? null;
}

export function fetchCategorias(tenantId: string) {
  return tabela<CategoriaRow[]>("cardapio_categorias")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("ordem", { ascending: true });
}

export function fetchItens(tenantId: string) {
  return tabela<ItemRow[]>("cardapio_itens")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("ordem", { ascending: true });
}

export function fetchPerfil(tenantId: string) {
  return tabela<PerfilRow>("tenant_perfil").select("*").eq("tenant_id", tenantId).maybeSingle();
}

/** "R$ 45,90". Preco ausente (sob consulta) nao mostra valor. */
export function formatPreco(centavos: number | null | undefined): string | null {
  if (centavos == null) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    centavos / 100,
  );
}

/** "45,90", "45.90" ou "45" viram centavos. Vazio vira null; invalido vira undefined. */
export function parsePreco(texto: string): number | null | undefined {
  const t = texto.trim().replace(/^R\$\s*/i, "");
  if (!t) return null;
  if (!/^\d{1,7}([.,]\d{1,2})?$/.test(t)) return undefined;
  const [inteiro, frac = ""] = t.replace(",", ".").split(".");
  return Number(inteiro) * 100 + Number(frac.padEnd(2, "0"));
}

/** Texto do campo de preco a partir de centavos ("45,90"). */
export function precoParaCampo(centavos: number | null | undefined): string {
  if (centavos == null) return "";
  return (centavos / 100).toFixed(2).replace(".", ",");
}

/**
 * Troca a posicao de um item com o vizinho e devolve so as linhas cuja `ordem` mudou.
 * Renumera de 0 a n-1 para funcionar mesmo quando todas as ordens eram iguais.
 */
export function reordenar<T extends { id: string; ordem: number }>(
  lista: T[],
  id: string,
  direcao: -1 | 1,
): Array<{ id: string; ordem: number }> {
  const ordenada = [...lista].sort((a, b) => a.ordem - b.ordem);
  const i = ordenada.findIndex((x) => x.id === id);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= ordenada.length) return [];
  [ordenada[i], ordenada[j]] = [ordenada[j]!, ordenada[i]!];
  return ordenada
    .map((x, idx) => ({ id: x.id, ordem: idx, antes: x.ordem }))
    .filter((x) => x.ordem !== x.antes)
    .map(({ id: xid, ordem }) => ({ id: xid, ordem }));
}

/** Categorias sem itens ativos nao aparecem na pagina publica. */
export function categoriasVisiveis(c: CardapioPublico | null): CategoriaCardapio[] {
  return (c?.categorias ?? []).filter((cat) => cat.itens.length > 0);
}

function normalizar(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Busca por nome ou descricao, sem acento e sem diferenciar maiuscula. Categoria sem item some. */
export function filtrarCardapio(
  categorias: CategoriaCardapio[],
  termo: string,
): CategoriaCardapio[] {
  const t = normalizar(termo);
  if (!t) return categorias;
  return categorias
    .map((c) => ({
      ...c,
      itens: c.itens.filter((i) => normalizar(`${i.nome} ${i.descricao ?? ""}`).includes(t)),
    }))
    .filter((c) => c.itens.length > 0);
}
