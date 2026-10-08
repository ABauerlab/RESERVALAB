import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Palette,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { HubIcone } from "@/components/hub/HubIcone";
import { IconPicker, type IconeEscolhido } from "@/components/hub/IconPicker";
import { enviarImagemDaEmpresa } from "@/lib/assets";
import { detectarIcone } from "@/lib/hub-icons";
import { fetchPerfil, reordenar, tabela } from "@/lib/cardapio";
import { buildHubItens, urlSegura, type HubDados } from "@/lib/hub";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$slug/admin/links")({
  head: ({ params }) => ({
    meta: [{ title: "Link Hub | Teggly" }, { name: "robots", content: "noindex" }],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  ssr: false,
  component: LinksAdminPage,
});

type LinkRow = {
  id: string;
  tenant_id: string;
  titulo: string;
  url: string;
  ordem: number;
  ativo: boolean;
  icone: string | null;
  icone_url: string | null;
  destaque: boolean;
};

function LinksAdminPage() {
  const { slug } = useParams({ from: "/$slug/admin/links" });
  const admin = useTenantAdmin(slug);
  const tenant = admin.tenant;
  const tenantId = tenant?.id ?? null;
  const qc = useQueryClient();

  const [instagram, setInstagram] = useState("");
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [descricao, setDescricao] = useState("");
  const [novoIcone, setNovoIcone] = useState<IconeEscolhido>({ icone: null, icone_url: null });
  const [novoDestaque, setNovoDestaque] = useState(false);
  const [seletor, setSeletor] = useState<null | { id: string | "novo"; titulo: string }>(null);
  const [enviandoBanner, setEnviandoBanner] = useState(false);
  const arquivoBanner = useRef<HTMLInputElement>(null);

  const perfilQ = useQuery({
    enabled: !!tenantId,
    queryKey: ["hub-admin", "perfil", tenantId],
    queryFn: async () => {
      const { data, error } = await fetchPerfil(tenantId!);
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const linksQ = useQuery({
    enabled: !!tenantId,
    queryKey: ["hub-admin", "links", tenantId],
    queryFn: async () => {
      const { data, error } = await tabela<LinkRow[]>("hub_links")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("ordem", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  useEffect(() => {
    setInstagram(perfilQ.data?.instagram ?? "");
  }, [perfilQ.data?.instagram]);
  useEffect(() => {
    setDescricao(perfilQ.data?.hub_descricao ?? "");
  }, [perfilQ.data?.hub_descricao]);

  const links = useMemo(
    () => [...(linksQ.data ?? [])].sort((a, b) => a.ordem - b.ordem),
    [linksQ.data],
  );
  const hubPublicado = perfilQ.data?.hub_publicado ?? true;
  const cardapioPublicado = perfilQ.data?.cardapio_publicado ?? false;
  const mostrarCardapio = perfilQ.data?.hub_mostrar_cardapio ?? true;
  const bannerUrl = perfilQ.data?.hub_banner_url ?? null;
  const bannerAtivo = perfilQ.data?.hub_banner_ativo ?? false;
  const descricaoValida = descricao.length <= 280;

  async function enviarBanner(file: File | undefined) {
    if (!file || !tenantId) return;
    setEnviandoBanner(true);
    try {
      const url = await enviarImagemDaEmpresa(tenantId, "banner", file);
      salvarPerfil.mutate({ hub_banner_url: url, hub_banner_ativo: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar o banner.");
    } finally {
      setEnviandoBanner(false);
      if (arquivoBanner.current) arquivoBanner.current.value = "";
    }
  }

  const invalidar = () => qc.invalidateQueries({ queryKey: ["hub-admin"] });
  const falha = (msg: string) => () => toast.error(msg);

  const salvarPerfil = useMutation({
    mutationFn: async (campos: {
      instagram?: string | null;
      hub_publicado?: boolean;
      hub_descricao?: string | null;
      hub_banner_url?: string | null;
      hub_banner_ativo?: boolean;
      hub_mostrar_cardapio?: boolean;
    }) => {
      const { error } = await tabela("tenant_perfil").upsert(
        { tenant_id: tenantId!, ...campos },
        { onConflict: "tenant_id" },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Salvo.");
      invalidar();
    },
    onError: falha("Não foi possível salvar."),
  });

  const adicionar = useMutation({
    mutationFn: async () => {
      const ordem = links.length ? Math.max(...links.map((l) => l.ordem)) + 1 : 0;
      const { error } = await tabela("hub_links").insert({
        tenant_id: tenantId!,
        titulo: titulo.trim(),
        url: url.trim(),
        ordem,
        icone: novoIcone.icone,
        icone_url: novoIcone.icone_url,
        destaque: novoDestaque,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Link adicionado.");
      setTitulo("");
      setUrl("");
      setNovoIcone({ icone: null, icone_url: null });
      setNovoDestaque(false);
      invalidar();
    },
    onError: falha("Não foi possível adicionar o link."),
  });

  const alternar = useMutation({
    mutationFn: async (a: {
      id: string;
      ativo?: boolean;
      destaque?: boolean;
      icone?: string | null;
      icone_url?: string | null;
    }) => {
      const { id, ...campos } = a;
      const { error } = await tabela("hub_links")
        .update(campos)
        .eq("id", id)
        .eq("tenant_id", tenantId!);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidar,
    onError: falha("Não foi possível alterar o link."),
  });

  const mover = useMutation({
    mutationFn: async (mudancas: Array<{ id: string; ordem: number }>) => {
      for (const m of mudancas) {
        const { error } = await tabela("hub_links")
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
    mutationFn: async (id: string) => {
      const { error } = await tabela("hub_links").delete().eq("id", id).eq("tenant_id", tenantId!);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Link removido.");
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

  // Prévia dos links automáticos, a partir do que a empresa já cadastrou.
  const previa: HubDados = {
    nome: tenant?.nome ?? "",
    endereco: tenant?.endereco ?? null,
    whatsapp: tenant?.whatsapp ?? null,
    telefone: tenant?.telefone_contato ?? null,
    instagram: perfilQ.data?.instagram ?? null,
    cardapio_publicado: cardapioPublicado,
    mostrar_cardapio: mostrarCardapio,
    tipos_aceitos: tenant?.tipos_aceitos ?? ["mesa"],
    links: [],
  };
  const automaticos = buildHubItens(previa, slug);
  const urlPublica = `${typeof window !== "undefined" ? window.location.origin : ""}/${slug}/links`;
  const instagramValido = /^[A-Za-z0-9._]{0,30}$/.test(instagram.replace(/^@/, ""));
  const podeAdicionar = titulo.trim().length > 0 && urlSegura(url) && !adicionar.isPending;

  function copiar() {
    navigator.clipboard?.writeText(urlPublica).then(
      () => toast.success("Link copiado."),
      () => toast.error("Não foi possível copiar."),
    );
  }

  return (
    <AdminShell slug={slug} tenantNome={tenant?.nome ?? ""} active="links">
      <div className="mx-auto max-w-3xl px-5 pb-10 pt-6">
        <PageHeader
          title="Link Hub"
          description="A página de links do restaurante, pronta para a bio do Instagram. Reservar mesa fica sempre em primeiro."
        />

        <section className="mt-5 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Switch
                id="publicar-hub"
                checked={hubPublicado}
                disabled={perfilQ.isLoading || salvarPerfil.isPending}
                onCheckedChange={(v) => salvarPerfil.mutate({ hub_publicado: v })}
                aria-label="Publicar página de links"
              />
              <Label htmlFor="publicar-hub" className="text-sm font-semibold">
                {hubPublicado ? "Página publicada" : "Página não publicada"}
              </Label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copiar}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent xl:min-h-9"
              >
                <Copy className="h-4 w-4" /> Copiar link
              </button>
              <a
                href={`/${slug}/links`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent xl:min-h-9"
              >
                <ExternalLink className="h-4 w-4" /> Ver página
              </a>
            </div>
          </div>
          <p className="mt-3 break-all font-mono text-xs text-muted-foreground">{urlPublica}</p>
        </section>

        <section className="mt-4 rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold">Banner e descrição</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A imagem aparece no topo da página. Use 1200 × 400 px (proporção 3:1). Reduzimos e
            otimizamos para o celular ao enviar.
          </p>

          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-slate-50">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt="Prévia do banner"
                width={1200}
                height={400}
                className={cn(
                  "aspect-[3/1] w-full object-cover",
                  !bannerAtivo && "opacity-40 grayscale",
                )}
              />
            ) : (
              <div className="grid aspect-[3/1] w-full place-items-center text-sm text-muted-foreground">
                Sem banner. A página abre direto com o nome do restaurante.
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              ref={arquivoBanner}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              aria-label="Enviar banner"
              onChange={(e) => void enviarBanner(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              disabled={enviandoBanner || !tenantId}
              onClick={() => arquivoBanner.current?.click()}
              className="h-11 rounded-md"
            >
              {enviandoBanner ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="mr-2 h-4 w-4" />
              )}
              {bannerUrl ? "Trocar imagem" : "Enviar imagem"}
            </Button>
            {bannerUrl && (
              <>
                <div className="flex items-center gap-2">
                  <Switch
                    id="banner-ativo"
                    checked={bannerAtivo}
                    disabled={salvarPerfil.isPending}
                    onCheckedChange={(v) => salvarPerfil.mutate({ hub_banner_ativo: v })}
                    aria-label="Mostrar banner"
                  />
                  <Label htmlFor="banner-ativo" className="text-sm font-medium">
                    Mostrar banner
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    salvarPerfil.mutate({ hub_banner_url: null, hub_banner_ativo: false })
                  }
                  className="h-11 rounded-md"
                >
                  Remover
                </Button>
              </>
            )}
          </div>

          <div className="mt-5">
            <Label htmlFor="hub-descricao" className="text-sm font-medium">
              Descrição curta
            </Label>
            <Textarea
              id="hub-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Ex.: Comida mineira no coração de Santa Tereza."
              className="mt-1.5"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{descricao.length}/280</p>
              <Button
                onClick={() => salvarPerfil.mutate({ hub_descricao: descricao.trim() || null })}
                disabled={!descricaoValida || salvarPerfil.isPending}
                className="h-11 rounded-md"
              >
                Salvar descrição
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Cardápio no Link Hub</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {cardapioPublicado ? (
                  "Ligado, o botão Cardápio aparece logo depois de Reservar mesa."
                ) : (
                  <>
                    O cardápio ainda não está publicado.{" "}
                    <a
                      href={`/${slug}/admin/cardapio`}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Publicar cardápio
                    </a>
                  </>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Switch
                id="mostrar-cardapio"
                checked={mostrarCardapio}
                disabled={perfilQ.isLoading || salvarPerfil.isPending}
                onCheckedChange={(v) => salvarPerfil.mutate({ hub_mostrar_cardapio: v })}
                aria-label="Mostrar cardápio"
              />
              <Label htmlFor="mostrar-cardapio" className="text-sm font-medium">
                Mostrar cardápio
              </Label>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold">Instagram</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Só o usuário, sem o endereço completo.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@seurestaurante"
              aria-label="Usuário do Instagram"
              className="h-11 rounded-md"
            />
            <Button
              onClick={() =>
                salvarPerfil.mutate({ instagram: instagram.replace(/^@/, "").trim() || null })
              }
              disabled={!instagramValido || salvarPerfil.isPending}
              className="h-11 rounded-md"
            >
              Salvar
            </Button>
          </div>
          {!instagramValido && (
            <p className="mt-2 text-xs text-destructive">
              Use só letras, números, ponto e sublinhado.
            </p>
          )}
        </section>

        <section className="mt-4 rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold">Links automáticos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Saem dos dados do restaurante. Para mudar WhatsApp, telefone ou endereço, use{" "}
            <a
              href={`/${slug}/admin/configuracoes`}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Configurações
            </a>
            .
          </p>
          <ul className="mt-3 divide-y divide-border/70">
            {automaticos.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="inline-flex items-center gap-2.5 font-medium">
                  <HubIcone chave={i.icone} className="h-[18px] w-[18px]" />
                  {i.rotulo}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {i.tipo === "reserva"
                    ? "sempre em primeiro"
                    : i.tipo === "cardapio"
                      ? "publicado"
                      : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold">Links extras</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Destaques aparecem logo depois do Cardápio, com ícone maior. Os demais vêm no fim.
            Aceitamos http(s), telefone (tel:) e e-mail (mailto:).
          </p>

          {linksQ.isLoading ? (
            <div className="mt-4 flex justify-center" aria-busy="true">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-border/70">
              {links.length === 0 && (
                <li className="py-3 text-sm text-muted-foreground">Nenhum link extra ainda.</li>
              )}
              {links.map((l, i) => (
                <li
                  key={l.id}
                  className={cn("flex flex-wrap items-center gap-3 py-3", !l.ativo && "opacity-60")}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-50">
                    <HubIcone
                      chave={l.icone ?? detectarIcone(l.url) ?? "link"}
                      iconeUrl={l.icone_url}
                      colorido
                      className="h-5 w-5"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold">
                      {l.titulo}
                      {l.destaque && (
                        <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          Destaque
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{l.url}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Btn
                      label={`Escolher ícone de ${l.titulo}`}
                      onClick={() => setSeletor({ id: l.id, titulo: l.titulo })}
                    >
                      <Palette className="h-4 w-4" />
                    </Btn>
                    <Btn
                      label={l.destaque ? `Tirar destaque de ${l.titulo}` : `Destacar ${l.titulo}`}
                      onClick={() => alternar.mutate({ id: l.id, destaque: !l.destaque })}
                    >
                      <Star className={cn("h-4 w-4", l.destaque && "fill-current text-blue-700")} />
                    </Btn>
                    <Btn
                      label={`Subir ${l.titulo}`}
                      disabled={i === 0}
                      onClick={() => mover.mutate(reordenar(links, l.id, -1))}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Btn>
                    <Btn
                      label={`Descer ${l.titulo}`}
                      disabled={i === links.length - 1}
                      onClick={() => mover.mutate(reordenar(links, l.id, 1))}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Btn>
                    <Btn
                      label={l.ativo ? `Ocultar ${l.titulo}` : `Mostrar ${l.titulo}`}
                      onClick={() => alternar.mutate({ id: l.id, ativo: !l.ativo })}
                    >
                      {l.ativo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Btn>
                    <Btn label={`Excluir ${l.titulo}`} onClick={() => remover.mutate(l.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Btn>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form
            className="mt-4 grid gap-2 border-t border-border/70 pt-4 sm:grid-cols-[1fr_1.4fr_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              if (podeAdicionar) adicionar.mutate();
            }}
          >
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título (ex.: Playlist)"
              aria-label="Título do link"
              maxLength={60}
              className="h-11 rounded-md"
            />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              aria-label="Endereço do link"
              className="h-11 rounded-md"
            />
            <Button type="submit" disabled={!podeAdicionar} className="h-11 rounded-md">
              <Plus className="mr-1.5 h-4 w-4" /> Adicionar
            </Button>
            <div className="flex flex-wrap items-center gap-4 sm:col-span-3">
              <button
                type="button"
                onClick={() => setSeletor({ id: "novo", titulo: titulo.trim() })}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent"
              >
                <HubIcone
                  chave={novoIcone.icone ?? detectarIcone(url) ?? "link"}
                  iconeUrl={novoIcone.icone_url}
                  colorido
                  className="h-5 w-5"
                />
                Ícone
              </button>
              <div className="flex items-center gap-2">
                <Switch
                  id="novo-destaque"
                  checked={novoDestaque}
                  onCheckedChange={setNovoDestaque}
                  aria-label="Destacar link"
                />
                <Label htmlFor="novo-destaque" className="text-sm font-medium">
                  Destaque (ex.: iFood, 99Food)
                </Label>
              </div>
            </div>
          </form>
          {url.trim() && !urlSegura(url) && (
            <p className="mt-2 text-xs text-destructive">
              Use um endereço começando com https://, tel: ou mailto:.
            </p>
          )}
        </section>
      </div>
      {tenantId && seletor && (
        <IconPicker
          aberto
          onFechar={() => setSeletor(null)}
          tenantId={tenantId}
          titulo={seletor.titulo}
          atual={
            seletor.id === "novo"
              ? novoIcone
              : (() => {
                  const l = links.find((x) => x.id === seletor.id);
                  return { icone: l?.icone ?? null, icone_url: l?.icone_url ?? null };
                })()
          }
          onSalvar={(v) => {
            if (seletor.id === "novo") setNovoIcone(v);
            else alternar.mutate({ id: seletor.id, icone: v.icone, icone_url: v.icone_url });
          }}
        />
      )}
    </AdminShell>
  );
}

function Btn({
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
