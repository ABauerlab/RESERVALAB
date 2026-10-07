import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchCategorias,
  fetchItens,
  fetchPerfil,
  formatPreco,
  parsePreco,
  precoParaCampo,
  reordenar,
  tabela,
  type CategoriaRow,
  type ItemRow,
} from "@/lib/cardapio";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$slug/admin/cardapio")({
  head: ({ params }) => ({
    meta: [{ title: "Cardápio | Teggly" }, { name: "robots", content: "noindex" }],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  ssr: false,
  component: CardapioAdminPage,
});

type CategoriaForm = { id?: string; nome: string; descricao: string };
type ItemForm = {
  id?: string;
  categoria_id: string;
  nome: string;
  descricao: string;
  preco: string;
  imagem_url: string;
};

function CardapioAdminPage() {
  const { slug } = useParams({ from: "/$slug/admin/cardapio" });
  const admin = useTenantAdmin(slug);
  const tenantId = admin.tenant?.id ?? null;
  const qc = useQueryClient();

  const [catForm, setCatForm] = useState<CategoriaForm | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm | null>(null);
  const [excluir, setExcluir] = useState<
    { tipo: "categoria"; row: CategoriaRow } | { tipo: "item"; row: ItemRow } | null
  >(null);

  const categoriasQ = useQuery({
    enabled: !!tenantId,
    queryKey: ["cardapio-admin", "categorias", tenantId],
    queryFn: async () => {
      const { data, error } = await fetchCategorias(tenantId!);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const itensQ = useQuery({
    enabled: !!tenantId,
    queryKey: ["cardapio-admin", "itens", tenantId],
    queryFn: async () => {
      const { data, error } = await fetchItens(tenantId!);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const perfilQ = useQuery({
    enabled: !!tenantId,
    queryKey: ["cardapio-admin", "perfil", tenantId],
    queryFn: async () => {
      const { data, error } = await fetchPerfil(tenantId!);
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const categorias = useMemo(
    () => [...(categoriasQ.data ?? [])].sort((a, b) => a.ordem - b.ordem),
    [categoriasQ.data],
  );
  const itensPorCategoria = useMemo(() => {
    const m = new Map<string, ItemRow[]>();
    for (const i of itensQ.data ?? []) {
      const l = m.get(i.categoria_id) ?? [];
      l.push(i);
      m.set(i.categoria_id, l);
    }
    for (const l of m.values()) l.sort((a, b) => a.ordem - b.ordem);
    return m;
  }, [itensQ.data]);

  const invalidar = () => qc.invalidateQueries({ queryKey: ["cardapio-admin"] });
  const falha = (msg: string) => () => toast.error(msg);

  const publicado = perfilQ.data?.cardapio_publicado ?? false;

  const publicar = useMutation({
    mutationFn: async (valor: boolean) => {
      const { error } = await tabela("tenant_perfil").upsert(
        { tenant_id: tenantId!, cardapio_publicado: valor },
        { onConflict: "tenant_id" },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, valor) => {
      toast.success(valor ? "Cardápio publicado." : "Cardápio despublicado.");
      invalidar();
    },
    onError: falha("Não foi possível alterar a publicação."),
  });

  const salvarCategoria = useMutation({
    mutationFn: async (f: CategoriaForm) => {
      const dados = { nome: f.nome.trim(), descricao: f.descricao.trim() || null };
      if (f.id) {
        const { error } = await tabela("cardapio_categorias")
          .update(dados)
          .eq("id", f.id)
          .eq("tenant_id", tenantId!);
        if (error) throw new Error(error.message);
      } else {
        const ordem = categorias.length ? Math.max(...categorias.map((c) => c.ordem)) + 1 : 0;
        const { error } = await tabela("cardapio_categorias").insert({
          ...dados,
          tenant_id: tenantId!,
          ordem,
        });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Categoria salva.");
      setCatForm(null);
      invalidar();
    },
    onError: falha("Não foi possível salvar a categoria."),
  });

  const salvarItem = useMutation({
    mutationFn: async (f: ItemForm) => {
      const preco = parsePreco(f.preco);
      if (preco === undefined) throw new Error("preco");
      const dados = {
        categoria_id: f.categoria_id,
        nome: f.nome.trim(),
        descricao: f.descricao.trim() || null,
        preco_centavos: preco,
        imagem_url: f.imagem_url.trim() || null,
      };
      if (f.id) {
        const { error } = await tabela("cardapio_itens")
          .update(dados)
          .eq("id", f.id)
          .eq("tenant_id", tenantId!);
        if (error) throw new Error(error.message);
      } else {
        const doGrupo = itensPorCategoria.get(f.categoria_id) ?? [];
        const ordem = doGrupo.length ? Math.max(...doGrupo.map((i) => i.ordem)) + 1 : 0;
        const { error } = await tabela("cardapio_itens").insert({
          ...dados,
          tenant_id: tenantId!,
          ordem,
        });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Item salvo.");
      setItemForm(null);
      invalidar();
    },
    onError: (e) =>
      toast.error(
        e instanceof Error && e.message === "preco"
          ? "Confira o preço (ex.: 45,90)."
          : "Não foi possível salvar o item.",
      ),
  });

  const alternarAtivo = useMutation({
    mutationFn: async (a: { tipo: "categoria" | "item"; id: string; ativo: boolean }) => {
      const { error } = await tabela(
        a.tipo === "categoria" ? "cardapio_categorias" : "cardapio_itens",
      )
        .update({ ativo: a.ativo })
        .eq("id", a.id)
        .eq("tenant_id", tenantId!);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidar,
    onError: falha("Não foi possível alterar a visibilidade."),
  });

  const mover = useMutation({
    mutationFn: async (a: {
      tabela: "cardapio_categorias" | "cardapio_itens";
      mudancas: Array<{ id: string; ordem: number }>;
    }) => {
      for (const m of a.mudancas) {
        const { error } = await tabela(a.tabela)
          .update({ ordem: m.ordem })
          .eq("id", m.id)
          .eq("tenant_id", tenantId!);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: invalidar,
    onError: falha("Não foi possível mudar a ordem."),
  });

  const remover = useMutation({
    mutationFn: async (alvo: NonNullable<typeof excluir>) => {
      const { error } = await tabela(
        alvo.tipo === "categoria" ? "cardapio_categorias" : "cardapio_itens",
      )
        .delete()
        .eq("id", alvo.row.id)
        .eq("tenant_id", tenantId!);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Removido.");
      setExcluir(null);
      invalidar();
    },
    onError: falha("Não foi possível remover."),
  });

  if (!admin.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const carregando = categoriasQ.isLoading || itensQ.isLoading || perfilQ.isLoading;
  const erro = categoriasQ.isError || itensQ.isError || perfilQ.isError;
  const urlPublica = `/${slug}/cardapio`;

  return (
    <AdminShell slug={slug} tenantNome={admin.tenant?.nome ?? ""} active="cardapio">
      <div className="mx-auto max-w-3xl px-5 pb-10 pt-6">
        <PageHeader
          title="Cardápio"
          description="Categorias, itens e preços. O cardápio é independente da reserva: o cliente vê só o que você publicar."
          actions={
            <Button
              onClick={() => setCatForm({ nome: "", descricao: "" })}
              className="h-11 rounded-md xl:h-9"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Categoria
            </Button>
          }
        />

        <section className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Switch
              id="publicar-cardapio"
              checked={publicado}
              disabled={perfilQ.isLoading || publicar.isPending}
              onCheckedChange={(v) => publicar.mutate(v)}
              aria-label="Publicar cardápio"
            />
            <div>
              <Label htmlFor="publicar-cardapio" className="text-sm font-semibold">
                {publicado ? "Publicado no site" : "Não publicado"}
              </Label>
              <p className="text-xs text-muted-foreground">
                {publicado
                  ? "Quem acessar o link vê as categorias e itens ativos."
                  : "O link ainda não mostra o cardápio."}
              </p>
            </div>
          </div>
          <a
            href={urlPublica}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent xl:min-h-9"
          >
            <ExternalLink className="h-4 w-4" /> Ver página
          </a>
        </section>

        {carregando ? (
          <div className="mt-10 flex justify-center" aria-busy="true">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : erro ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-dashed border-border bg-card p-8 text-center"
          >
            <p className="text-lg font-semibold">Não foi possível carregar o cardápio</p>
            <button
              type="button"
              onClick={invalidar}
              className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Tentar novamente
            </button>
          </div>
        ) : categorias.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-lg font-semibold">Comece pela primeira categoria</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Por exemplo, Entradas, Pratos ou Bebidas. Depois adicione os itens com nome e preço.
            </p>
            <Button
              onClick={() => setCatForm({ nome: "", descricao: "" })}
              className="mt-4 h-11 rounded-md"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Adicionar categoria
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {categorias.map((c, idx) => {
              const itens = itensPorCategoria.get(c.id) ?? [];
              return (
                <section
                  key={c.id}
                  aria-label={`Categoria ${c.nome}`}
                  className={cn(
                    "rounded-xl border border-border bg-card",
                    !c.ativo && "opacity-70",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-bold">{c.nome}</h3>
                      {c.descricao && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{c.descricao}</p>
                      )}
                      {!c.ativo && (
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">Oculta</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <IconBtn
                        label="Subir categoria"
                        disabled={idx === 0}
                        onClick={() =>
                          mover.mutate({
                            tabela: "cardapio_categorias",
                            mudancas: reordenar(categorias, c.id, -1),
                          })
                        }
                      >
                        <ArrowUp className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn
                        label="Descer categoria"
                        disabled={idx === categorias.length - 1}
                        onClick={() =>
                          mover.mutate({
                            tabela: "cardapio_categorias",
                            mudancas: reordenar(categorias, c.id, 1),
                          })
                        }
                      >
                        <ArrowDown className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn
                        label={c.ativo ? "Ocultar categoria" : "Mostrar categoria"}
                        onClick={() =>
                          alternarAtivo.mutate({ tipo: "categoria", id: c.id, ativo: !c.ativo })
                        }
                      >
                        {c.ativo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </IconBtn>
                      <IconBtn
                        label="Editar categoria"
                        onClick={() =>
                          setCatForm({ id: c.id, nome: c.nome, descricao: c.descricao ?? "" })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn
                        label="Excluir categoria"
                        onClick={() => setExcluir({ tipo: "categoria", row: c })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconBtn>
                    </div>
                  </div>

                  <ul className="divide-y divide-border/70 border-t border-border/70">
                    {itens.length === 0 && (
                      <li className="px-4 py-4 text-sm text-muted-foreground">
                        Nenhum item nesta categoria.
                      </li>
                    )}
                    {itens.map((i, j) => (
                      <li
                        key={i.id}
                        className={cn(
                          "flex flex-wrap items-center gap-3 px-4 py-3",
                          !i.ativo && "opacity-60",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-semibold">{i.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPreco(i.preco_centavos) ?? "Sem preço"}
                            {!i.ativo && " · Oculto"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <IconBtn
                            label={`Subir ${i.nome}`}
                            disabled={j === 0}
                            onClick={() =>
                              mover.mutate({
                                tabela: "cardapio_itens",
                                mudancas: reordenar(itens, i.id, -1),
                              })
                            }
                          >
                            <ArrowUp className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn
                            label={`Descer ${i.nome}`}
                            disabled={j === itens.length - 1}
                            onClick={() =>
                              mover.mutate({
                                tabela: "cardapio_itens",
                                mudancas: reordenar(itens, i.id, 1),
                              })
                            }
                          >
                            <ArrowDown className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn
                            label={i.ativo ? `Ocultar ${i.nome}` : `Mostrar ${i.nome}`}
                            onClick={() =>
                              alternarAtivo.mutate({ tipo: "item", id: i.id, ativo: !i.ativo })
                            }
                          >
                            {i.ativo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </IconBtn>
                          <IconBtn
                            label={`Editar ${i.nome}`}
                            onClick={() =>
                              setItemForm({
                                id: i.id,
                                categoria_id: i.categoria_id,
                                nome: i.nome,
                                descricao: i.descricao ?? "",
                                preco: precoParaCampo(i.preco_centavos),
                                imagem_url: i.imagem_url ?? "",
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn
                            label={`Excluir ${i.nome}`}
                            onClick={() => setExcluir({ tipo: "item", row: i })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </IconBtn>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-border/70 p-3">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setItemForm({
                          categoria_id: c.id,
                          nome: "",
                          descricao: "",
                          preco: "",
                          imagem_url: "",
                        })
                      }
                      className="h-11 w-full rounded-md xl:h-9 xl:w-auto"
                    >
                      <Plus className="mr-1.5 h-4 w-4" /> Item em {c.nome}
                    </Button>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!catForm} onOpenChange={(o) => !o && setCatForm(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{catForm?.id ? "Editar categoria" : "Nova categoria"}</DialogTitle>
            <DialogDescription>
              Agrupa os itens do cardápio. Ex.: Pratos, Bebidas.
            </DialogDescription>
          </DialogHeader>
          {catForm && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (catForm.nome.trim()) salvarCategoria.mutate(catForm);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="cat-nome">Nome</Label>
                <Input
                  id="cat-nome"
                  value={catForm.nome}
                  maxLength={80}
                  onChange={(e) => setCatForm({ ...catForm, nome: e.target.value })}
                  className="h-11 rounded-md"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-desc">Descrição (opcional)</Label>
                <Textarea
                  id="cat-desc"
                  value={catForm.descricao}
                  maxLength={300}
                  onChange={(e) => setCatForm({ ...catForm, descricao: e.target.value })}
                  className="min-h-20 rounded-md"
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={!catForm.nome.trim() || salvarCategoria.isPending}
                  className="h-11 rounded-md"
                >
                  {salvarCategoria.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemForm} onOpenChange={(o) => !o && setItemForm(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{itemForm?.id ? "Editar item" : "Novo item"}</DialogTitle>
            <DialogDescription>Nome, descrição e preço aparecem no cardápio.</DialogDescription>
          </DialogHeader>
          {itemForm && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (itemForm.nome.trim()) salvarItem.mutate(itemForm);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="item-nome">Nome</Label>
                <Input
                  id="item-nome"
                  value={itemForm.nome}
                  maxLength={120}
                  onChange={(e) => setItemForm({ ...itemForm, nome: e.target.value })}
                  className="h-11 rounded-md"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-desc">Descrição (opcional)</Label>
                <Textarea
                  id="item-desc"
                  value={itemForm.descricao}
                  maxLength={500}
                  onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })}
                  className="min-h-20 rounded-md"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="item-preco">Preço (opcional)</Label>
                  <Input
                    id="item-preco"
                    value={itemForm.preco}
                    inputMode="decimal"
                    placeholder="45,90"
                    onChange={(e) => setItemForm({ ...itemForm, preco: e.target.value })}
                    className="h-11 rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-cat">Categoria</Label>
                  <select
                    id="item-cat"
                    value={itemForm.categoria_id}
                    onChange={(e) => setItemForm({ ...itemForm, categoria_id: e.target.value })}
                    className="h-11 w-full rounded-md border border-input bg-card px-3 text-[15px]"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-img">URL da foto (opcional)</Label>
                <Input
                  id="item-img"
                  value={itemForm.imagem_url}
                  placeholder="https://..."
                  onChange={(e) => setItemForm({ ...itemForm, imagem_url: e.target.value })}
                  className="h-11 rounded-md"
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={!itemForm.nome.trim() || salvarItem.isPending}
                  className="h-11 rounded-md"
                >
                  {salvarItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluir} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {excluir?.tipo === "categoria" ? "Excluir categoria?" : "Excluir item?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {excluir?.tipo === "categoria"
                ? `"${excluir.row.nome}" e todos os itens dela serão removidos do cardápio. Para só esconder, use o ícone de olho.`
                : excluir
                  ? `"${excluir.row.nome}" será removido do cardápio. Para só esconder, use o ícone de olho.`
                  : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => excluir && remover.mutate(excluir)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30 xl:h-9 xl:w-9"
    >
      {children}
    </button>
  );
}
