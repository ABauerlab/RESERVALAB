import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CalendarX2,
  BarChart3,
  ClipboardList,
  Filter,
  Link2,
  MessageSquareText,
  Palette,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
} from "lucide-react";

import { Reveal } from "@/components/landing/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const WHATSAPP =
  "https://wa.me/5531998021169?text=" +
  encodeURIComponent("Ola! Quero usar o Reservi na minha empresa.");

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reservi | Sistema de Reservas e Agendamentos para Empresas" },
      {
        name: "description",
        content:
          "Organize reservas, horários e clientes em um único sistema. Simplifique a gestão de reservas da sua empresa com o Reservi.",
      },
      {
        property: "og:title",
        content: "Reservi | Sistema de Reservas e Agendamentos para Empresas",
      },
      {
        property: "og:description",
        content:
          "Organize reservas, horários e clientes em um único sistema. Simplifique a gestão de reservas da sua empresa com o Reservi.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://reservatestelab.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://reservatestelab.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Reservi",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description:
            "Sistema de reservas e agendamentos para empresas: formulário público, painel administrativo, bloqueio de agenda e notificações.",
        }),
      },
    ],
  }),
  component: Landing,
});

/* ---------------------------------- UI ---------------------------------- */

function CTAPrimary({ className = "" }: { className?: string }) {
  return (
    <a
      href={WHATSAPP}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-terracotta px-6 text-sm font-medium text-terracotta-foreground shadow-[var(--shadow-md)] transition-all hover:bg-terracotta/90 hover:shadow-[var(--shadow-lg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:hover:-translate-y-0.5 ${className}`}
    >
      Quero usar o Reservi
      <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" />
    </a>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-terracotta">
      {children}
    </p>
  );
}

/* Mockup: painel desktop */
function DesktopMockup() {
  const rows = [
    { n: "Marina Alves", h: "12:30", p: "4", s: "Confirmada" },
    { n: "Rafael Lima", h: "13:00", p: "2", s: "Pendente" },
    { n: "Estúdio Norte", h: "14:00", p: "12", s: "Confirmada" },
    { n: "Camila Souza", h: "15:30", p: "6", s: "Pendente" },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-lg)]">
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-terracotta/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
        <span className="ml-3 truncate text-[11px] text-muted-foreground">
          reservalab / painel
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Hoje", "12"],
            ["Pendentes", "3"],
            ["Confirmadas", "8"],
            ["Pessoas", "46"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border bg-background p-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {k}
              </p>
              <p className="mt-1 font-serif text-2xl">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {["Todas", "Pendente", "Confirmada", "Cancelada"].map((c, i) => (
            <span
              key={c}
              className={`rounded-full px-3 py-1 text-[11px] ${
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {c}
            </span>
          ))}
        </div>

        <ul className="mt-4 space-y-2">
          {rows.map((r) => (
            <li
              key={r.n}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.n}</p>
                <p className="text-xs text-muted-foreground">
                  {r.h} · {r.p} pessoas
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  r.s === "Confirmada"
                    ? "bg-success/15 text-success"
                    : "bg-warning/20 text-foreground/70"
                }`}
              >
                {r.s}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* Mockup: formulário mobile */
function MobileMockup() {
  return (
    <div className="mx-auto w-[210px] overflow-hidden rounded-[2rem] border-4 border-brown/90 bg-card shadow-[var(--shadow-lg)]">
      <div className="flex justify-center bg-brown/90 pb-1.5 pt-1">
        <span className="h-1 w-12 rounded-full bg-background/40" />
      </div>
      <div className="space-y-3 p-4">
        <p className="text-[9px] uppercase tracking-[0.2em] text-terracotta">
          Nova reserva
        </p>
        <p className="font-serif text-xl leading-tight">Reserve sua mesa</p>
        <div className="space-y-2">
          {["Nome completo", "WhatsApp", "Data"].map((f) => (
            <div key={f} className="rounded-lg border border-border bg-background px-2.5 py-2">
              <p className="text-[9px] text-muted-foreground">{f}</p>
            </div>
          ))}
          <div className="rounded-lg border border-border bg-background px-2.5 py-2">
            <p className="text-[9px] text-muted-foreground">Horário</p>
            <p className="text-[11px] font-medium">12:30</p>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-2.5 py-2">
            <p className="text-[9px] text-muted-foreground">Pessoas</p>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="rounded bg-muted px-1.5">-</span>4
              <span className="rounded bg-muted px-1.5">+</span>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-terracotta py-2 text-center text-[11px] font-medium text-terracotta-foreground">
          Enviar reserva
        </div>
      </div>
    </div>
  );
}

/* Fluxograma "Ver como funciona" */
function Fluxograma() {
  const steps = [
    {
      icon: Link2,
      t: "Cliente abre seu link",
      d: "reserva.bauerlab.com.br/suaempresa com a identidade da sua empresa.",
    },
    {
      icon: ClipboardList,
      t: "Preenche a reserva",
      d: "Dados, data, horário disponível e quantidade de pessoas. Sem login.",
    },
    {
      icon: Bell,
      t: "Você recebe na hora",
      d: "A reserva cai no painel em tempo real com notificação.",
    },
    {
      icon: MessageSquareText,
      t: "Confirma e avisa",
      d: "Um clique confirma e envia a mensagem pronta no WhatsApp do cliente.",
    },
    {
      icon: Search,
      t: "Cliente acompanha",
      d: "Com o código, ele consulta ou edita a reserva sozinho.",
    },
  ];
  return (
    <ol className="relative space-y-3 md:grid md:grid-cols-5 md:gap-3 md:space-y-0">
      {steps.map((s, i) => (
        <Reveal as="li" key={s.t} delay={i * 70} className="relative">
          <div className="h-full rounded-2xl border border-border bg-card p-4 transition-all motion-safe:hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream text-terracotta">
                <s.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Etapa {i + 1}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium">{s.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.d}</p>
          </div>
          {i < steps.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute left-1/2 hidden h-3 w-3 md:block md:left-auto md:right-[-10px] md:top-1/2 md:-translate-y-1/2 md:text-border"
            >
              <ArrowRight className="h-3 w-3 text-border" />
            </span>
          )}
        </Reveal>
      ))}
    </ol>
  );
}

/* -------------------------------- Página -------------------------------- */

function Landing() {
  const recursos = [
    {
      icon: CalendarCheck,
      t: "Página pública de reservas",
      d: "Cada empresa no seu endereço /nomedaempresa, com os tipos de reserva que ela aceita.",
    },
    {
      icon: Filter,
      t: "Painel com filtros e busca",
      d: "Filtre por status (pendente, confirmada, cancelada, finalizada), data e nome.",
    },
    {
      icon: MessageSquareText,
      t: "Confirmação por WhatsApp",
      d: "Mensagem personalizável enviada ao cliente em um clique ao confirmar.",
    },
    {
      icon: Bell,
      t: "Notificações push",
      d: "Alerta de nova reserva mesmo com o aplicativo fechado no celular.",
    },
    {
      icon: CalendarX2,
      t: "Bloqueio de agenda",
      d: "Feche dias inteiros ou faixas de horário para não receber pedidos.",
    },
    {
      icon: Search,
      t: "Acompanhamento por código",
      d: "O cliente consulta e edita a própria reserva sem precisar de login.",
    },
    {
      icon: BarChart3,
      t: "Relatórios",
      d: "Reservas por período, por tipo e por status, direto no painel.",
    },
    {
      icon: ClipboardList,
      t: "Mensagem do dia",
      d: "Gere a lista de reservas do dia agrupada por área, pronta para copiar.",
    },
    {
      icon: Palette,
      t: "Configuração da empresa",
      d: "Logo, nome, contatos, endereço e tipos de reserva aceitos.",
    },
  ];

  const segmentos = [
    "Restaurantes",
    "Bares",
    "Estúdios",
    "Clínicas",
    "Barbearias",
    "Salões",
    "Coworkings",
    "Espaços esportivos",
    "Casas de evento",
    "Buffets",
  ];

  const beneficios = [
    { t: "Menos conversa, mais reserva", d: "O cliente preenche sozinho; você só confirma." },
    { t: "Sem conflito de horário", d: "Horários e bloqueios controlados pelo próprio sistema." },
    { t: "Tudo em um lugar", d: "Histórico, status e dados do cliente centralizados." },
    { t: "Funciona no celular", d: "Instalável como aplicativo, feito primeiro para mobile." },
    { t: "Cara de empresa séria", d: "Página de reservas com a identidade do seu negócio." },
    { t: "Equipe alinhada", d: "Lista do dia pronta para enviar ao time." },
  ];

  const faq = [
    {
      q: "O meu cliente precisa criar conta para reservar?",
      a: "Não. A reserva é feita em uma página pública, sem login. Ao final ele recebe um código para acompanhar ou editar a reserva.",
    },
    {
      q: "Como eu recebo as reservas?",
      a: "Elas aparecem no painel administrativo em tempo real, e você pode ativar notificações push para ser avisado mesmo com o aplicativo fechado.",
    },
    {
      q: "Consigo bloquear dias ou horários?",
      a: "Sim. Na aba Agenda você bloqueia dias inteiros ou faixas de horário, e esses períodos deixam de aceitar novos pedidos.",
    },
    {
      q: "Dá para personalizar a página da minha empresa?",
      a: "Sim. Nome, logo, contatos, endereço, tipos de reserva aceitos e a mensagem de confirmação do WhatsApp são configuráveis no painel.",
    },
    {
      q: "Serve para o meu tipo de negócio?",
      a: "O Reservi atende negócios que trabalham com reservas e agendamentos, como restaurantes, bares, estúdios, clínicas, barbearias, salões, coworkings, espaços esportivos e eventos.",
    },
    {
      q: "Como começo a usar?",
      a: "Fale com a nossa equipe pelo WhatsApp. Criamos o acesso da sua empresa e você configura o restante pelo painel.",
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md safe-top">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5">
          <a href="#hero" className="min-w-0 flex-1">
            <span className="font-serif text-xl tracking-tight">Reservi</span>
          </a>
          <nav aria-label="Navegação principal" className="hidden items-center gap-6 md:flex">
            <a href="#como-funciona" className="text-sm text-muted-foreground transition hover:text-foreground">Como funciona</a>
            <a href="#recursos" className="text-sm text-muted-foreground transition hover:text-foreground">Recursos</a>
            <a href="#segmentos" className="text-sm text-muted-foreground transition hover:text-foreground">Segmentos</a>
            <a href="#faq" className="text-sm text-muted-foreground transition hover:text-foreground">Dúvidas</a>
          </nav>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 shrink-0 items-center rounded-xl bg-terracotta px-4 text-xs font-medium text-terracotta-foreground transition hover:bg-terracotta/90 sm:text-sm"
          >
            Falar com a gente
          </a>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section id="hero" className="relative border-b border-border/60">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,var(--cream),transparent_70%)]"
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 lg:pb-24">
            <div>
              <Reveal>
                <SectionTag>Reservas e agendamentos</SectionTag>
                <h1 className="mt-5 font-serif text-[2.6rem] leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.1rem]">
                  Sua empresa recebe reservas.<br className="hidden sm:block" /> O Reservi cuida do resto.
                </h1>
                <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-lg">
                  Centralize reservas, horários e clientes em um sistema simples, profissional e feito para facilitar sua operação.
                </p>
              </Reveal>
              <Reveal delay={120}>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <CTAPrimary />
                  <a
                    href="#como-funciona"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-medium transition hover:bg-accent motion-safe:hover:-translate-y-0.5"
                  >
                    Ver como funciona
                  </a>
                </div>
                <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" />
                  Cada empresa com seu próprio endereço e acesso privado.
                </p>
              </Reveal>
            </div>

            <Reveal delay={180} className="relative">
              <div className="relative">
                <DesktopMockup />
                <div className="pointer-events-none absolute -bottom-14 hidden xl:block xl:-left-24">
                  <MobileMockup />
                </div>
              </div>
              <div className="mt-10 xl:hidden">

                <MobileMockup />
              </div>
            </Reveal>
          </div>
        </section>

        {/* PROBLEMA */}
        <section className="border-b border-border/60 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <SectionTag>O problema</SectionTag>
              <h2 className="mt-4 max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">
                Reservas no WhatsApp viram bagunça.
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Conversas espalhadas", "Reservas perdidas no meio de centenas de mensagens."],
                ["Conflito de horários", "Duas reservas no mesmo horário e nenhum controle real."],
                ["Retrabalho manual", "Anotar em caderno, planilha e print para lembrar o dia."],
                ["Cliente sem retorno", "Ele volta a perguntar porque não sabe se foi confirmado."],
              ].map(([t, d], i) => (
                <Reveal key={t} delay={i * 70}>
                  <div className="h-full rounded-2xl border border-border bg-card p-5">
                    <p className="font-medium">{t}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* SOLUÇÃO */}
        <section className="border-b border-border/60 bg-cream/50 py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
            <Reveal>
              <SectionTag>A solução</SectionTag>
              <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-5xl">
                Um só lugar para tudo que envolve reserva.
              </h2>
              <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
                O cliente reserva pelo seu link. Você recebe, confirma e avisa pelo WhatsApp sem sair do painel. Os horários, bloqueios e o histórico ficam organizados automaticamente.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  "Formulário público com os tipos de reserva que você aceita",
                  "Painel em tempo real com status de cada reserva",
                  "Horários e bloqueios controlados pelo sistema",
                ].map((li) => (
                  <li key={li} className="flex gap-3 text-sm">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" aria-hidden="true" />
                    <span className="text-muted-foreground">{li}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={140}>
              <DesktopMockup />
            </Reveal>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="scroll-mt-20 border-b border-border/60 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <SectionTag>Como funciona</SectionTag>
              <h2 className="mt-4 max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">
                Em 3 passos para começar.
              </h2>
            </Reveal>

            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {[
                ["01", "Configure sua empresa", "Nome, logo, contatos, endereço, horários e os tipos de reserva que você aceita."],
                ["02", "Divulgue seu link", "Compartilhe reserva.bauerlab.com.br/suaempresa nas redes, no perfil e no WhatsApp."],
                ["03", "Gerencie pelo painel", "Receba, confirme, edite, bloqueie a agenda e acompanhe os relatórios."],
              ].map(([n, t, d], i) => (
                <Reveal key={n} delay={i * 90}>
                  <div className="h-full rounded-2xl border border-border bg-card p-6 transition-all motion-safe:hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
                    <p className="font-serif text-4xl text-terracotta">{n}</p>
                    <p className="mt-4 font-medium">{t}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={80}>
              <h3 className="mt-16 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                O fluxo completo da reserva
              </h3>
            </Reveal>
            <div className="mt-6">
              <Fluxograma />
            </div>
          </div>
        </section>

        {/* RECURSOS */}
        <section id="recursos" className="scroll-mt-20 border-b border-border/60 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <SectionTag>Funcionalidades</SectionTag>
              <h2 className="mt-4 max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">
                O que já está pronto no sistema.
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recursos.map((r, i) => (
                <Reveal key={r.t} delay={(i % 3) * 70}>
                  <article className="h-full rounded-2xl border border-border bg-card p-5 transition-all motion-safe:hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-terracotta">
                      <r.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-medium">{r.t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.d}</p>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal delay={100}>
              <div className="mt-12 grid items-center gap-10 rounded-3xl border border-border bg-cream/50 p-6 sm:p-10 lg:grid-cols-[1fr_auto]">
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl">
                    Do celular do cliente ao seu painel.
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                    A página de reserva é feita para o celular e pode ser instalada como aplicativo. O painel funciona igualmente bem no computador do balcão.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" /> Mobile-first
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Store className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" /> Multiempresa
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" /> Acesso restrito por empresa
                    </span>
                  </div>
                </div>
                <MobileMockup />
              </div>
            </Reveal>
          </div>
        </section>

        {/* SEGMENTOS */}
        <section id="segmentos" className="scroll-mt-20 border-b border-border/60 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <SectionTag>Segmentos</SectionTag>
              <h2 className="mt-4 max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">
                Feito para quem trabalha com reservas.
              </h2>
            </Reveal>
            <ul className="mt-9 flex flex-wrap gap-2.5">
              {segmentos.map((s, i) => (
                <Reveal as="li" key={s} delay={i * 40}>
                  <span className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent">
                    {s}
                  </span>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="border-b border-border/60 bg-cream/50 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <SectionTag>Benefícios</SectionTag>
              <h2 className="mt-4 max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">
                O que muda na sua rotina.
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {beneficios.map((b, i) => (
                <Reveal key={b.t} delay={(i % 3) * 70}>
                  <div className="h-full rounded-2xl border border-border bg-card p-5">
                    <p className="font-medium">{b.t}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-b border-border/60 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-5">
            <Reveal>
              <SectionTag>Dúvidas frequentes</SectionTag>
              <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-5xl">
                Perguntas comuns.
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <Accordion type="single" collapsible className="mt-8">
                {faq.map((f) => (
                  <AccordionItem key={f.q} value={f.q}>
                    <AccordionTrigger className="text-left text-sm sm:text-base">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <div className="rounded-3xl border border-border bg-primary px-6 py-14 text-center text-primary-foreground sm:px-10">
                <h2 className="mx-auto max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">
                  Pronto para organizar as reservas da sua empresa?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/70 sm:text-base">
                  Fale com a nossa equipe e receba o acesso da sua empresa no Reservi.
                </p>
                <div className="mt-9 flex justify-center">
                  <CTAPrimary />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card safe-bottom">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2">
          <div>
            <p className="font-serif text-xl">Reservi</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Sistema de reservas e agendamentos para empresas. Um produto bauerlab.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm sm:justify-items-end">
            <nav aria-label="Links da página" className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Página</p>
              <a href="#como-funciona" className="block text-muted-foreground transition hover:text-foreground">Como funciona</a>
              <a href="#recursos" className="block text-muted-foreground transition hover:text-foreground">Recursos</a>
              <a href="#faq" className="block text-muted-foreground transition hover:text-foreground">Dúvidas</a>
            </nav>
            <nav aria-label="Contato e acesso" className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Contato</p>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="block text-muted-foreground transition hover:text-foreground">WhatsApp</a>
              <a href="mailto:contato.bauerlab@gmail.com" className="block text-muted-foreground transition hover:text-foreground">E-mail</a>
              <Link to="/master/login" className="block text-muted-foreground transition hover:text-foreground">Área administrativa</Link>
            </nav>
          </div>
        </div>
        <div className="border-t border-border">
          <p className="mx-auto max-w-6xl px-5 py-5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/60">
            Reservi · bauerlab
          </p>
        </div>
      </footer>
    </div>
  );
}
