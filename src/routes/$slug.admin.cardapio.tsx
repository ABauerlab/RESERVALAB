import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
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
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { enviarImagemDaEmpresa } from "@/lib/assets";

import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/PageHeader";
import { AparenciaPainel } from "@/components/cardapio/AparenciaPainel";
import { PreviaCliente } from "@/components/cardapio/PreviaCliente";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ehLayout, type LayoutCardapio } from "@/lib/cardapio-layout";
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
  type CategoriaCardapio,
  type CategoriaRow,
  type ItemRow,
} from "@/lib/cardapio";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$slug/admin/cardapio")({
  head: ({ params }) => ({
    meta: [{ title: "Cardápio | Teggly" }, { name: "robots", content: "noindex" }],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  // A aba mora na URL: voltar do navegador devolve a aba em que a pessoa estava.
  validateSearch: (search: Record<string, unknown>): { aba?: Aba } =>
    search.aba === "aparencia" || search.aba === "publicacao" ? { aba: search.aba } : {},
  ssr: false,
  component: CardapioAdminPage,
});

type Aba = "conteudo" | "aparencia" | "publicacao";

type CategoriaForm = { id?: string; nome: string; descricao: string };
type ItemForm = {
  id?: string;
  categoria_id: string;
  nome: string;
  descricao: string;
  preco: string;
  imagem_url: string;
  destaque: boolean;
};

function CardapioAdminPage() {
  const { slug } = useParams({ from: "/$slug/admin/cardapio" });
  const admin = useTenantAdmin(slug);
  const tenantId = admin.tenant?.id ?? null;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const aba: Aba = Route.useSearch().aba ?? "conteudo";
  const [testando, setTestando] = useState<LayoutCardapio | null>(null);
  const [versao, setVersao] = useState(0);
  const [confirmarPublicar, setConfirmarPublicar] = useState(false);

  const [catForm, setCatForm] = useState<CategoriaForm | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const arquivoFoto = useRef<HTMLInputElement>(null);

  async function enviarFoto(file: File | undefined) {
    if (!file || !tenantId) return;
    setEnviandoFoto(true);
    try {
      const url = await enviarImagemDaEmpresa(tenantId, "produto", file);
      setItemForm((f) => (f ? { ...f, imagem_url: url } : f));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar a foto.");
    } finally {
      setEnviandoFoto(false);
      if (arquivoFoto.current) arquivoFoto.current.value = "";
    }
  }
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

  const invalidar = () => {
    setVersao((v) => v + 1);
    return qc.invalidateQueries({ queryKey: ["cardapio-admin"] });
  };
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

  const salvarLayout = useMutation({
    mutationFn: async (layout: LayoutCardapio | null) => {
      const { error } = await tabela("tenant_perfil").upsert(
        { tenant_id: tenantId!, cardapio_layout: layout },
        { onConflict: "tenant_id" },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Aparência salva.");
      invalidar();
    },
    onError: falha("Não foi possível salvar a aparência."),
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
        destaque: f.destaque,
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

  const destacar = useMutation({
    mutationFn: async (a: { id: string; destaque: boolean }) => {
      const { error } = await tabela("cardapio_itens")
        .update({ destaque: a.destaque })
        .eq("id", a.id)
        .eq("tenant_id", tenantId!);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidar,
    onError: falha("Não foi possível alterar o destaque."),
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

  const ativas: CategoriaCardapio[] = categorias
    .filter((c) => c.ativo)
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      descricao: c.descricao,
      itens: (itensPorCategoria.get(c.id) ?? [])
        .filter((i) => i.ativo)
        .map((i) => ({
          id: i.id,
          nome: i.nome,
          descricao: i.descricao,
          preco_centavos: i.preco_centavos,
          imagem_url: i.imagem_url,
          destaque: i.destaque === true,
        })),
    }));
  const carregando = categoriasQ.isLoading || itensQ.isLoading || perfilQ.isLoading;
  const erro = categoriasQ.isError || itensQ.isError || perfilQ.isError;
  const urlPublica = publicado ? `/${slug}/cardapio` : `/${slug}/cardapio?previa=1`;

  return (
    <AdminShell slug={slug} tenantNome={admin.tenant?.nome ?? ""} active="cardapio">
      <div className="mx-auto max-w-[1180px] px-5 pb-10 pt-6">
        <PageHeader
          eyebrow={publicado ? "Publicado" : "Rascunho, não publicado"}
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

        <div className="mt-5 xl:grid xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
          <div className="min-w-0">
            <Tabs
              value={aba}
              onValueChange={(v) =>
                navigate({
                  to: "/$slug/admin/cardapio",
                  params: { slug },
                  search: (v === "conteudo" ? {} : { aba: v }) as never,
                  replace: true,
                })
              }
            >
              <TabsList
                className="grid w-full grid-cols-3 sm:inline-grid sm:w-auto"
                aria-label="Seções do cardápio"
              >
                <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
                <TabsTrigger value="aparencia">Aparência</TabsTrigger>
                <TabsTrigger value="publicacao">Publicação</TabsTrigger>
              </TabsList>

              <TabsContent value="conteudo" className="mt-4">
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
                      Por exemplo, Entradas, Pratos ou Bebidas. Depois adicione os itens com nome e
                      preço.
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
                              <h3 className="break-words text-base font-semibold">{c.nome}</h3>
                              {c.descricao && (
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                  {c.descricao}
                                </p>
                              )}
                              {!c.ativo && (
                                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                                  Oculta
                                </p>
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
                                  alternarAtivo.mutate({
                                    tipo: "categoria",
                                    id: c.id,
                                    ativo: !c.ativo,
                                  })
                                }
                              >
                                {c.ativo ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </IconBtn>
                              <IconBtn
                                label="Editar categoria"
                                onClick={() =>
                                  setCatForm({
                                    id: c.id,
                                    nome: c.nome,
                                    descricao: c.descricao ?? "",
                                  })
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
                                    {i.destaque && " · Destaque"}
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
                                    label={
                                      i.destaque
                                        ? `Tirar destaque de ${i.nome}`
                                        : `Destacar ${i.nome}`
                                    }
                                    onClick={() =>
                                      destacar.mutate({ id: i.id, destaque: !i.destaque })
                                    }
                                  >
                                    <Star
                                      className={cn(
                                        "h-4 w-4",
                                        i.destaque && "fill-warning-500 text-warning-500",
                                      )}
                                    />
                                  </IconBtn>
                                  <IconBtn
                                    label={i.ativo ? `Ocultar ${i.nome}` : `Mostrar ${i.nome}`}
                                    onClick={() =>
                                      alternarAtivo.mutate({
                                        tipo: "item",
                                        id: i.id,
                                        ativo: !i.ativo,
                                      })
                                    }
                                  >
                                    {i.ativo ? (
                                      <Eye className="h-4 w-4" />
                                    ) : (
                                      <EyeOff className="h-4 w-4" />
                                    )}
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
                                        destaque: i.destaque === true,
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
                                  destaque: false,
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
              </TabsContent>

              <TabsContent value="aparencia" className="mt-4">
                <AparenciaPainel
                  categorias={ativas}
                  salvo={perfilQ.data?.cardapio_layout}
                  salvando={salvarLayout.isPending}
                  testando={testando}
                  onTestar={setTestando}
                  onSalvar={(l) => salvarLayout.mutate(l)}
                />
              </TabsContent>

              <TabsContent value="publicacao" className="mt-4 space-y-4">
                <section className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="publicar-cardapio"
                        checked={publicado}
                        disabled={perfilQ.isLoading || publicar.isPending}
                        onCheckedChange={(v) =>
                          v ? setConfirmarPublicar(true) : publicar.mutate(false)
                        }
                        aria-label="Publicar cardápio"
                      />
                      <div>
                        <Label htmlFor="publicar-cardapio" className="text-sm font-semibold">
                          {publicado ? "Publicado no site" : "Rascunho, não publicado"}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {publicado
                            ? "Quem acessar o link vê as categorias e itens ativos."
                            : 'O cliente ainda vê "indisponível". Confira a prévia e publique quando estiver pronto.'}
                        </p>
                      </div>
                    </div>
                    <a
                      href={urlPublica}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent xl:min-h-9"
                    >
                      <ExternalLink className="h-4 w-4" />{" "}
                      {publicado ? "Ver página" : "Pré-visualizar"}
                    </a>
                  </div>
                </section>
                <section className="rounded-xl border border-border bg-card p-4">
                  <h2 className="text-base font-semibold">Antes de publicar</h2>
                  <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    <li>1. Rascunho: monte categorias e itens na aba Conteúdo.</li>
                    <li>2. Prévia: veja ao lado (ou em Pré-visualizar) como o cliente verá.</li>
                    <li>
                      3. Revisão: confira nomes, preços e fotos, de preferência com outra pessoa.
                    </li>
                    <li>4. Publicar: ligue a chave acima. Dá para despublicar a qualquer hora.</li>
                  </ol>
                </section>

                <div className="xl:hidden">
                  <PreviaCliente slug={slug} layout={testando} versao={versao} />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="hidden xl:block">
            <div className="sticky top-6">
              <PreviaCliente slug={slug} layout={testando} versao={versao} />
            </div>
          </div>
        </div>
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
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border px-3">
                <input
                  type="checkbox"
                  checked={itemForm.destaque}
                  onChange={(e) => setItemForm({ ...itemForm, destaque: e.target.checked })}
                  className="size-5 accent-primary"
                />
                <span className="text-sm">
                  <span className="font-medium">Prato em destaque</span>
                  <span className="block text-xs text-muted-foreground">
                    Aparece em “Destaques da casa” no topo do cardápio.
                  </span>
                </span>
              </label>
              <div className="space-y-2">
                <Label htmlFor="item-img">Foto (opcional)</Label>
                <div className="flex items-center gap-3">
                  {itemForm.imagem_url ? (
                    <img
                      src={itemForm.imagem_url}
                      alt="Prévia da foto"
                      className="h-16 w-20 shrink-0 rounded-lg border border-border object-cover"
                    />
                  ) : (
                    <span className="grid h-16 w-20 shrink-0 place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                      Sem foto
                    </span>
                  )}
                  <input
                    ref={arquivoFoto}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    aria-label="Enviar foto do item"
                    onChange={(e) => void enviarFoto(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={enviandoFoto}
                    onClick={() => arquivoFoto.current?.click()}
                    className="h-11 rounded-md"
                  >
                    {enviandoFoto && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {itemForm.imagem_url ? "Trocar foto" : "Enviar foto"}
                  </Button>
                  {itemForm.imagem_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setItemForm({ ...itemForm, imagem_url: "" })}
                      className="h-11 rounded-md"
                    >
                      Remover
                    </Button>
                  )}
                </div>
                <Input
                  id="item-img"
                  value={itemForm.imagem_url}
                  placeholder="ou cole o endereço da imagem (https://...)"
                  aria-label="Endereço da foto"
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

      <AlertDialog open={confirmarPublicar} onOpenChange={setConfirmarPublicar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar o cardápio agora?</AlertDialogTitle>
            <AlertDialogDescription>
              A partir de agora, qualquer pessoa com o link vê as categorias e itens ativos. Você
              pode despublicar quando quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ainda não</AlertDialogCancel>
            <AlertDialogAction onClick={() => publicar.mutate(true)}>Publicar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
