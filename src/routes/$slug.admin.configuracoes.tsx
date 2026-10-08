import { AjudaSecao } from "@/components/admin/AjudaSecao";
import { MarcaOptIn } from "@/components/admin/MarcaOptIn";
import { PlanoSecao } from "@/components/admin/PlanoSecao";
import { pwaHeadLinks } from "@/lib/pwa-manifest";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { useTenantAdmin } from "@/hooks/use-tenant-admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { clearTenantCache } from "@/lib/tenant";
import {
  DEFAULT_MENSAGEM_CANCELAMENTO,
  DEFAULT_MENSAGEM_CONFIRMACAO,
  DEFAULT_MENSAGEM_RECONFIRMACAO,
  PLACEHOLDERS,
  PLACEHOLDERS_CANCELAMENTO,
} from "@/lib/confirmacao";
import { TIPO_LABEL, type ReservaTipo } from "@/lib/reservations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/$slug/admin/configuracoes")({
  head: ({ params }) => ({
    meta: [{ title: "Configurações | Teggly" }, { name: "robots", content: "noindex" }],
    links: pwaHeadLinks(`/${params.slug}/admin`, "Admin"),
  }),
  ssr: false,
  component: ConfiguracoesPage,
});

const TODOS_TIPOS: ReservaTipo[] = ["mesa", "aniversario", "evento", "casamento"];

function ConfiguracoesPage() {
  const { slug } = useParams({ from: "/$slug/admin/configuracoes" });
  const admin = useTenantAdmin(slug);
  const tenant = admin.tenant;
  const qc = useQueryClient();

  const [nome, setNome] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cor, setCor] = useState("#B4552D");
  const [tipos, setTipos] = useState<ReservaTipo[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [mensagemCancelamento, setMensagemCancelamento] = useState("");
  const [mensagemReconfirmacao, setMensagemReconfirmacao] = useState("");
  const [limiteSemana, setLimiteSemana] = useState("");
  const [limiteFimDeSemana, setLimiteFimDeSemana] = useState("");
  const [pixelFacebook, setPixelFacebook] = useState("");
  const [observacaoArea, setObservacaoArea] = useState("");

  useEffect(() => {
    if (!tenant) return;
    setNome(tenant.nome ?? "");
    setLogoUrl(tenant.logo_url ?? "");
    setEndereco(tenant.endereco ?? "");
    setTelefone(tenant.telefone_contato ?? "");
    setEmail(tenant.email_contato ?? "");
    setWhatsapp(tenant.whatsapp ?? "");
    setCor(tenant.cor_primaria ?? "#B4552D");
    setTipos((tenant.tipos_aceitos ?? []) as ReservaTipo[]);
    setMensagem(tenant.mensagem_confirmacao ?? DEFAULT_MENSAGEM_CONFIRMACAO);
    setMensagemCancelamento(tenant.mensagem_cancelamento ?? DEFAULT_MENSAGEM_CANCELAMENTO);
    setMensagemReconfirmacao(tenant.mensagem_reconfirmacao ?? DEFAULT_MENSAGEM_RECONFIRMACAO);
    setLimiteSemana(tenant.horario_limite_semana?.slice(0, 5) ?? "");
    setLimiteFimDeSemana(tenant.horario_limite_fim_semana?.slice(0, 5) ?? "");
    setPixelFacebook(tenant.pixel_facebook_id ?? "");
    setObservacaoArea(tenant.observacao_area ?? "");
  }, [tenant]);

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tenants")
        .update({
          nome: nome.trim(),
          logo_url: logoUrl.trim() || null,
          endereco: endereco.trim() || null,
          telefone_contato: telefone.trim() || null,
          email_contato: email.trim() || null,
          whatsapp: whatsapp.trim() || null,
          cor_primaria: cor,
          tipos_aceitos: tipos.length > 0 ? tipos : TODOS_TIPOS,
          mensagem_confirmacao: mensagem.trim() || DEFAULT_MENSAGEM_CONFIRMACAO,
          mensagem_cancelamento: mensagemCancelamento.trim() || DEFAULT_MENSAGEM_CANCELAMENTO,
          mensagem_reconfirmacao: mensagemReconfirmacao.trim() || DEFAULT_MENSAGEM_RECONFIRMACAO,
          horario_limite_semana: limiteSemana || null,
          horario_limite_fim_semana: limiteFimDeSemana || null,
          pixel_facebook_id: pixelFacebook.trim() || null,
          observacao_area: observacaoArea.trim() || null,
        })
        .eq("id", tenant!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas.");
      clearTenantCache(slug);
      qc.invalidateQueries({ queryKey: ["tenant", slug] });
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  function toggleTipo(t: ReservaTipo) {
    setTipos((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  if (!admin.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AdminShell slug={slug} tenantNome={tenant?.nome ?? ""} active="configuracoes">
      <div className="mx-auto max-w-4xl px-5 pb-10 pt-6">
        <PageHeader
          title="Configurações"
          description={
            <>
              Estes dados aparecem para o cliente em{" "}
              <span className="font-mono text-foreground">/{slug}</span>.
            </>
          }
        />

        <section className="mt-6 space-y-4 animate-in-up">
          <Accordion
            type="multiple"
            defaultValue={[
              "identidade",
              "reservas",
              ...(typeof window !== "undefined" && window.location.hash === "#plano"
                ? ["plano"]
                : []),
            ]}
            className="space-y-3"
          >
            <AccordionItem
              value="identidade"
              className="rounded-xl border border-border bg-card px-5"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <span>
                  <span className="block text-base font-semibold text-foreground">
                    Identidade e contato
                  </span>
                  <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                    Nome, cor, logo e como o cliente fala com a casa.
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-5 pb-5">
                <div className="space-y-4 border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
                  <h3 className="font-semibold">Identidade</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[13px]">Nome do estabelecimento</Label>
                      <Input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="h-11 rounded-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px]">Cor principal</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={cor}
                          onChange={(e) => setCor(e.target.value)}
                          className="h-11 w-14 cursor-pointer rounded-md border border-border bg-card p-1"
                        />
                        <Input
                          value={cor}
                          onChange={(e) => setCor(e.target.value)}
                          className="h-11 flex-1 rounded-md font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px]">URL do logo</Label>
                    <Input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://..."
                      className="h-11 rounded-md"
                    />
                    {logoUrl.trim() && (
                      <img
                        src={logoUrl}
                        alt={`Logo ${nome}`}
                        className="mt-2 h-14 w-auto rounded-lg object-contain"
                      />
                    )}
                  </div>
                  {tenant && <MarcaOptIn tenantId={tenant.id} />}
                </div>

                <div className="space-y-4 border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
                  <h3 className="font-semibold">Contato</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[13px]">Endereço</Label>
                      <Input
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        className="h-11 rounded-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px]">Telefone</Label>
                      <Input
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className="h-11 rounded-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px]">E-mail</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px]">WhatsApp</Label>
                      <Input
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="h-11 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="reservas"
              className="rounded-xl border border-border bg-card px-5"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <span>
                  <span className="block text-base font-semibold text-foreground">Reservas</span>
                  <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                    Tipos aceitos, áreas e horário-limite.
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-5 pb-5">
                <div className="space-y-4 border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
                  <h3 className="font-semibold">Tipos de reserva aceitos</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Somente os selecionados aparecem para o cliente.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {TODOS_TIPOS.map((t) => {
                      const on = tipos.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTipo(t)}
                          className={`h-11 xl:h-9 rounded-full px-4 text-xs font-medium transition-all ${
                            on
                              ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
                              : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {TIPO_LABEL[t]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
                  <div>
                    <h3 className="font-semibold">Observação sobre áreas (reserva de mesa)</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Aparece na tela de reserva de mesa, junto ao campo "Área desejada". Use para
                      listar as áreas da casa e avisar que a escolhida não é garantida. Deixe em
                      branco para não mostrar nada.
                    </p>
                  </div>
                  <Textarea
                    value={observacaoArea}
                    onChange={(e) => setObservacaoArea(e.target.value)}
                    placeholder="Ex: Trabalhamos com as áreas Salão, Fundos, Corredor e Varanda. Não garantimos o local de preferência — isso depende da quantidade de reservas na data escolhida."
                    className="min-h-24 rounded-md text-sm leading-relaxed"
                  />
                </div>

                <div className="space-y-4 border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
                  <div>
                    <h3 className="font-semibold">Horário-limite para reservas</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Último horário aceito para mesa/aniversário (capacidade normal, até 30
                      pessoas). Deixe em branco para não aplicar corte, além do horário de
                      fechamento padrão.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[13px]">Dias de semana (seg–sex)</Label>
                      <Input
                        type="time"
                        value={limiteSemana}
                        onChange={(e) => setLimiteSemana(e.target.value)}
                        className="h-11 rounded-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px]">Fim de semana (sáb–dom)</Label>
                      <Input
                        type="time"
                        value={limiteFimDeSemana}
                        onChange={(e) => setLimiteFimDeSemana(e.target.value)}
                        className="h-11 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="mensagens"
              className="rounded-xl border border-border bg-card px-5"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <span>
                  <span className="block text-base font-semibold text-foreground">
                    Mensagens de WhatsApp
                  </span>
                  <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                    Confirmação, cancelamento e reconfirmação.
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-5 pb-5">
                <div className="space-y-4 border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
                  <h3 className="font-semibold">Mensagem de confirmação (WhatsApp)</h3>
                  <p className="text-sm text-muted-foreground">
                    Texto enviado ao cliente ao confirmar a reserva. Sem emoji, apenas texto.
                  </p>
                  <Textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    className="min-h-56 rounded-md font-mono text-[13px] leading-relaxed"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {PLACEHOLDERS.map((p) => (
                      <button
                        key={p.token}
                        type="button"
                        onClick={() => setMensagem((m) => `${m}${p.token}`)}
                        title={p.descricao}
                        className="inline-flex min-h-11 items-center rounded-md bg-muted px-3 font-mono text-xs text-muted-foreground lg:min-h-0 lg:px-2 lg:py-1 transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {p.token}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMensagem(DEFAULT_MENSAGEM_CONFIRMACAO)}
                    className="inline-flex min-h-11 items-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline lg:min-h-0"
                  >
                    Restaurar mensagem padrão
                  </button>
                </div>

                <div className="space-y-4 border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
                  <h3 className="font-semibold">Mensagem de cancelamento (WhatsApp)</h3>
                  <p className="text-sm text-muted-foreground">
                    Texto enviado ao cliente quando uma reserva é cancelada pelo painel. Sempre
                    inclui um link para o cliente fazer uma nova reserva.
                  </p>
                  <Textarea
                    value={mensagemCancelamento}
                    onChange={(e) => setMensagemCancelamento(e.target.value)}
                    className="min-h-56 rounded-md font-mono text-[13px] leading-relaxed"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {PLACEHOLDERS_CANCELAMENTO.map((p) => (
                      <button
                        key={p.token}
                        type="button"
                        onClick={() => setMensagemCancelamento((m) => `${m}${p.token}`)}
                        title={p.descricao}
                        className="inline-flex min-h-11 items-center rounded-md bg-muted px-3 font-mono text-xs text-muted-foreground lg:min-h-0 lg:px-2 lg:py-1 transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {p.token}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMensagemCancelamento(DEFAULT_MENSAGEM_CANCELAMENTO)}
                    className="inline-flex min-h-11 items-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline lg:min-h-0"
                  >
                    Restaurar mensagem padrão
                  </button>
                </div>

                <div className="space-y-4 border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
                  <div>
                    <h3 className="font-semibold">Mensagem de reconfirmação (WhatsApp)</h3>
                    <p className="text-sm text-muted-foreground">
                      Texto enviado ao clicar em "Reconfirmar + WhatsApp" numa reserva já confirmada
                      — use perto do dia do evento para reduzir faltas, pedindo que o cliente
                      confirme presença de novo.
                    </p>
                  </div>
                  <Textarea
                    value={mensagemReconfirmacao}
                    onChange={(e) => setMensagemReconfirmacao(e.target.value)}
                    className="min-h-56 rounded-md font-mono text-[13px] leading-relaxed"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {PLACEHOLDERS.map((p) => (
                      <button
                        key={p.token}
                        type="button"
                        onClick={() => setMensagemReconfirmacao((m) => `${m}${p.token}`)}
                        title={p.descricao}
                        className="inline-flex min-h-11 items-center rounded-md bg-muted px-3 font-mono text-xs text-muted-foreground lg:min-h-0 lg:px-2 lg:py-1 transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {p.token}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMensagemReconfirmacao(DEFAULT_MENSAGEM_RECONFIRMACAO)}
                    className="inline-flex min-h-11 items-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline lg:min-h-0"
                  >
                    Restaurar mensagem padrão
                  </button>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="marketing"
              className="rounded-xl border border-border bg-card px-5"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <span>
                  <span className="block text-base font-semibold text-foreground">Marketing</span>
                  <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                    Pixel do Meta para medir anúncios.
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-5 pb-5">
                <div className="space-y-4 border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
                  <div>
                    <h3 className="font-semibold">Pixel do Meta (Facebook/Instagram Ads)</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      ID do pixel para medir conversões dos anúncios. Quando preenchido, a página
                      desta empresa passa a registrar PageView, um clique por tipo de reserva
                      (Click_Reserva_Mesa, Click_Reserva_Aniversario, Click_Reserva_Evento,
                      Click_Reserva_Casamento) e o evento Lead ao enviar uma reserva. Deixe em
                      branco para não carregar nenhum pixel nesta empresa.
                    </p>
                  </div>
                  <Input
                    value={pixelFacebook}
                    onChange={(e) => setPixelFacebook(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ex: 831333738696755"
                    inputMode="numeric"
                    className="h-11 rounded-md font-mono"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="plano"
              id="plano"
              className="rounded-xl border border-border bg-card px-5"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <span>
                  <span className="block text-base font-semibold text-foreground">Seu plano</span>
                  <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                    Plano atual, reservas do mês e comparação.
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                <PlanoSecao
                  ready={admin.ready}
                  tenantId={tenant?.id ?? null}
                  tenantNome={tenant?.nome ?? ""}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ajuda" className="rounded-xl border border-border bg-card px-5">
              <AccordionTrigger className="py-4 hover:no-underline">
                <span>
                  <span className="block text-base font-semibold text-foreground">Ajuda</span>
                  <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                    Refazer o passo a passo e falar com a gente.
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                <AjudaSecao />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="seguranca"
              className="rounded-xl border border-border bg-card px-5"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <span>
                  <span className="block text-base font-semibold text-foreground">Segurança</span>
                  <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                    Senha de acesso ao painel.
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-5 pb-5">
                <div className="space-y-4 border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
                  <h3 className="font-semibold">Segurança</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Altere a senha de acesso a este painel.
                  </p>
                  <Link
                    to="/$slug/admin/trocar-senha"
                    params={{ slug }}
                    className="mt-4 inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <KeyRound className="h-4 w-4" /> Alterar senha
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button
            onClick={() => salvar.mutate()}
            disabled={salvar.isPending || nome.trim().length < 2}
            className="h-12 w-full rounded-md bg-primary text-primary-foreground hover:bg-blue-700"
          >
            {salvar.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar configurações
          </Button>
        </section>
      </div>
    </AdminShell>
  );
}
