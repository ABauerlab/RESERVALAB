import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  Check,
  Link2,
  Phone,
  Users,
} from "lucide-react";

import { BrandIcon } from "@/components/brand/BrandIcons";
import { PhoneChat } from "@/components/landing/PhoneChat";
import { PlanosSection } from "@/components/landing/PlanosSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PLANOS, ORDEM_PLANOS } from "@/lib/plans";
import {
  EMAIL_CONTATO,
  INSTAGRAM_TEGGLY,
  SITE_URL,
  WHATSAPP_TEGGLY,
  mailtoContato,
} from "@/lib/site";

const DESCRICAO =
  "Plataforma de reservas e atendimento inteligente para restaurantes: reservas, WhatsApp, clientes, cardápio e Link Hub em um só lugar.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Teggly · Mais reservas. Menos trabalho." },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: "Teggly · Mais reservas. Menos trabalho." },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:image", content: `${SITE_URL}/og-image.png` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE_URL}/og-image.png` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Teggly",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: DESCRICAO,
          offers: ORDEM_PLANOS.map((id) => ({
            "@type": "Offer",
            name: PLANOS[id].nome,
            price: (PLANOS[id].mensalCentavos / 100).toFixed(2),
            priceCurrency: "BRL",
          })),
        }),
      },
    ],
  }),
  component: Landing,
});

/* ---------------------------------- UI ---------------------------------- */

/** Brand System (Website): movimento so na entrada do hero. As secoes nao animam. */
function Reveal({ children }: { children: React.ReactNode; delay?: number }) {
  return <>{children}</>;
}

const CTA_ASSUNTO = "Quero começar com o Teggly";
const CTA_CORPO = "Nome do restaurante:\nCidade:\nWhatsApp para contato:";

function CTAPrimary({ onDark = false }: { onDark?: boolean }) {
  return (
    <a
      href={mailtoContato(CTA_ASSUNTO, CTA_CORPO)}
      className={`group inline-flex h-[52px] items-center justify-center gap-2 rounded-[10px] px-6 text-base font-semibold transition duration-200 ease-teggly focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 ${
        onDark
          ? "bg-white text-slate-900 hover:bg-slate-100"
          : "bg-primary text-primary-foreground shadow-blue hover:bg-blue-700"
      }`}
    >
      Começar agora
      <ArrowRight className="h-5 w-5 transition-transform motion-safe:group-hover:translate-x-0.5" />
    </a>
  );
}

function Tag({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-[0.08em] ${onDark ? "text-blue-300" : "text-blue-700"}`}
    >
      {children}
    </p>
  );
}

function H2({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <h2
      className={`mt-3 max-w-2xl text-[1.9rem] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-5xl ${onDark ? "text-white" : ""}`}
    >
      {children}
    </h2>
  );
}

/** Linha + gota: o elemento proprietario. Um destaque por composicao. */
function LinhaGota({ passos }: { passos: Array<{ t: string; d: string }> }) {
  return (
    <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
      <span
        aria-hidden="true"
        className="absolute left-3 top-2 hidden h-0.5 w-[calc(100%-1.5rem)] bg-gradient-to-r from-blue-600 to-blue-200 md:block"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-[0.45rem] top-2 w-0.5 bg-gradient-to-b from-blue-600 to-blue-200 md:hidden"
      />
      {passos.map((p, i) => (
        <li key={p.t} className="relative pl-10 md:pl-0 md:pt-10">
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 size-4 -rotate-45 rounded-[50%_50%_50%_0] bg-primary md:left-0"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
            Passo {i + 1}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{p.t}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.d}</p>
        </li>
      ))}
    </ol>
  );
}

function Tela({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`w-full rounded-[20px] border border-border bg-card shadow-lg ${className}`}
    />
  );
}

const faq = [
  {
    q: "Preciso trocar meu número de WhatsApp?",
    a: "Não. O Teggly usa o número que o restaurante já tem. Seus clientes continuam falando com o mesmo contato.",
  },
  {
    q: "O Assistente pode errar uma reserva?",
    a: "Ele responde dúvidas, envia o link de reserva e só confirma ou cancela quando o próprio cliente pede, pelo sistema. Não inventa horário nem disponibilidade: se não souber, diz que vai confirmar com a casa.",
  },
  {
    q: "O cliente precisa baixar um app ou criar conta?",
    a: "Não. Ele reserva pelo seu link ou pelo WhatsApp, em poucos toques, e acompanha a reserva por um código.",
  },
  {
    q: "O cardápio é cobrado à parte?",
    a: "Não. O cardápio digital e o Link Hub estão em todos os planos, inclusive no Gratuito.",
  },
  {
    q: "O plano Gratuito tem prazo?",
    a: "Não. São 40 reservas por mês, sem cartão e sem data para acabar. Se passar do limite, nenhuma reserva fica escondida e você escolhe o plano que cabe na sua casa.",
  },
  {
    q: "Posso usar a marca do meu restaurante?",
    a: "Sim. Logo e cor do restaurante aparecem nas páginas públicas quando você liga a opção. O painel continua sendo do Teggly.",
  },
  {
    q: "Funciona para bares e para casas com várias unidades?",
    a: "Funciona. Cada casa tem sua agenda, seu cardápio e sua página. Para redes, conversamos sobre o melhor formato.",
  },
  {
    q: "Como começo?",
    a: "Fale com a gente. Cadastramos o seu restaurante, liberamos o acesso e o painel leva você pelos primeiros passos.",
  },
];

/* ---------------------------------- Página ---------------------------------- */

function Landing() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow-md"
      >
        Ir para o conteúdo
      </a>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5">
          <a href="#topo" className="flex min-h-11 items-center">
            <img
              src="/brand/Teggly_Logo_Primary.svg"
              alt="Teggly"
              width={118}
              height={28}
              className="h-7 w-auto"
            />
          </a>
          <nav aria-label="Seções" className="ml-4 hidden items-center gap-1 md:flex">
            {(
              [
                ["#produto", "Produto"],
                ["#como-funciona", "Como funciona"],
                ["#planos", "Planos"],
                ["#faq", "Dúvidas"],
              ] as const
            ).map(([href, rotulo]) => (
              <a
                key={href}
                href={href}
                className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-slate-700 transition hover:text-foreground"
              >
                {rotulo}
              </a>
            ))}
          </nav>
          <a
            href={mailtoContato(CTA_ASSUNTO, CTA_CORPO)}
            className="ml-auto inline-flex h-11 shrink-0 items-center rounded-[10px] bg-primary px-4 text-[15px] font-semibold text-primary-foreground shadow-blue transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
          >
            Começar agora
          </a>
        </div>
      </header>

      <main id="conteudo">
        {/* 1. HERO */}
        <section id="topo" className="relative overflow-hidden">
          <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-5 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <span className="ai-pulse" aria-hidden="true" /> Assistente no WhatsApp
              </p>
              <h1 className="mt-6 text-[2.75rem] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[3.5rem] xl:text-[4.5rem]">
                Mais reservas.
                <br />
                Menos trabalho.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                O Teggly recebe as reservas, confirma e lembra seus clientes pelo WhatsApp, a
                qualquer hora, com a marca do seu restaurante.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CTAPrimary />
                <a
                  href={WHATSAPP_TEGGLY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-[52px] items-center justify-center rounded-[10px] border border-border bg-card px-6 text-base font-semibold transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
                >
                  Falar com especialista
                </a>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Plano Gratuito com cardápio incluído. Sem cartão.
              </p>
              <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
                {(
                  [
                    [CalendarCheck, "Reservas online"],
                    [Bell, "Lembretes automáticos"],
                    [Users, "Clientes e histórico"],
                    [BarChart3, "Relatórios"],
                  ] as const
                ).map(([Icone, rotulo]) => (
                  <li key={rotulo} className="flex flex-col items-start gap-2.5">
                    <span className="grid size-14 place-items-center rounded-full bg-blue-50 text-blue-700">
                      <Icone className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium leading-snug">{rotulo}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative isolate">
              <div
                aria-hidden="true"
                className="absolute inset-x-4 inset-y-6 -z-10 rounded-[2rem] bg-gradient-to-br from-amber-200 via-orange-200 to-amber-100 opacity-70"
              />
              <div className="px-2 py-8 sm:px-8">
                <PhoneChat />
              </div>
              <p className="mt-2 text-center text-xs text-slate-600">
                Exemplo de conversa. Nomes e horários são ilustrativos.
              </p>
            </div>
          </div>
        </section>

        {/* 2. PROBLEMA E SOLUÇÃO */}
        <section className="border-y border-border/60 bg-slate-50 py-[72px] md:py-28">
          <div className="mx-auto max-w-[1200px] px-5">
            <Reveal>
              <Tag>O problema</Tag>
              <H2>Reserva chega por todo lado.</H2>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <Reveal>
                <div className="h-full rounded-lg border border-border bg-card p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Hoje
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    <li className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm">
                      <BrandIcon marca="whatsapp" className="h-4 w-4" /> WhatsApp
                    </li>
                    <li className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm">
                      <BrandIcon marca="instagram" className="h-4 w-4" /> Instagram
                    </li>
                    <li className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm">
                      <Phone className="h-4 w-4" aria-hidden="true" /> Telefone
                    </li>
                    <li className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm">
                      <BookOpen className="h-4 w-4" aria-hidden="true" /> Caderno
                    </li>
                  </ul>
                  <p className="mt-6 text-base leading-relaxed text-slate-700">
                    Você responde cada pedido, anota, confirma e lembra. Quando a casa enche, o
                    celular não para e algum pedido fica sem resposta.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={80}>
                <div className="h-full rounded-lg border border-primary bg-card p-6 shadow-md ring-1 ring-primary">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">
                    Com o Teggly
                  </p>
                  <ul className="mt-5 space-y-3 text-base">
                    {[
                      "Todo pedido cai na mesma agenda",
                      "O cliente recebe confirmação e lembrete sozinho",
                      "A equipe só entra quando precisa",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-base leading-relaxed text-slate-700">
                    Você cuida do seu restaurante. O Teggly cuida da operação.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 3. COMO FUNCIONA */}
        <section id="como-funciona" className="scroll-mt-20 py-[72px] md:py-28">
          <div className="mx-auto max-w-[1200px] px-5">
            <Reveal>
              <Tag>Como funciona</Tag>
              <H2>Do “tem mesa?” até o cliente sentado.</H2>
            </Reveal>
            <Reveal delay={80}>
              <LinhaGota
                passos={[
                  {
                    t: "O cliente pede",
                    d: "Pelo WhatsApp ou pelo seu link de reserva, a qualquer hora e de qualquer lugar.",
                  },
                  {
                    t: "O Teggly resolve",
                    d: "Mostra os horários, confirma e envia o código da reserva.",
                  },
                  {
                    t: "Você abre a agenda",
                    d: "Tudo organizado, confirmado e lembrado. A equipe entra na conversa se precisar.",
                  },
                ]}
              />
            </Reveal>
          </div>
        </section>

        {/* 4. PRODUTO */}
        <section
          id="produto"
          className="scroll-mt-20 border-y border-border/60 bg-slate-50 py-[72px] md:py-28"
        >
          <div className="mx-auto max-w-[1200px] px-5">
            <Reveal>
              <Tag>O painel</Tag>
              <H2>Quem chega, quando chega e quantos são.</H2>
              <p className="mt-4 max-w-2xl text-lg text-slate-600">
                O painel que sua equipe entende no primeiro dia. Reservas do dia, o que precisa de
                atenção e os próximos dias, em uma tela.
              </p>
            </Reveal>
            <Reveal delay={80}>
              <Tela
                src="/site/produto-hoje.png"
                alt="Tela Hoje do Teggly: linha do serviço com reservas por horário, pendentes e reconfirmações."
                className="mt-10"
              />
              <p className="mt-3 text-xs text-slate-600">
                Telas reais do Teggly com dados de exemplo.
              </p>
            </Reveal>
            <div className="mt-16 grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <Reveal>
                <h3 className="text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">
                  Onde cabe mais gente.
                </h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  A agenda mostra a semana, o que está pendente e quanto movimento cada horário tem.
                  Bloqueie datas e feriados e a página de reserva respeita.
                </p>
              </Reveal>
              <Reveal delay={80}>
                <Tela
                  src="/site/produto-agenda.png"
                  alt="Tela Agenda do Teggly: semana com reservas por dia e horários do dia selecionado."
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* 5. AUTOMAÇÃO E ASSISTENTE (única seção escura) */}
        <section className="bg-slate-900 py-[72px] text-white md:py-28">
          <div className="mx-auto grid max-w-[1200px] gap-12 px-5 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-blue-300">
                <span className="ai-pulse" aria-hidden="true" /> Assistente
              </p>
              <H2 onDark>Confirma, lembra e atende. Sem você.</H2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-300">
                Cada reserva segue uma jornada pronta. O cliente é avisado na hora certa e o
                Assistente responde o que for simples. Se o assunto pede gente, a equipe assume.
              </p>
              <p className="mt-6 text-sm text-slate-400">
                Confirmação e lembrete no Essencial. Assistente no Pro.
              </p>
            </Reveal>
            <Reveal delay={80}>
              <ol className="relative space-y-6 rounded-lg border border-white/10 bg-white/5 p-6 pl-12">
                <span
                  aria-hidden="true"
                  className="absolute bottom-9 left-[1.65rem] top-9 w-0.5 bg-gradient-to-b from-blue-500 to-blue-900"
                />
                {[
                  ["Reserva criada", "Pelo link da casa, por telefone ou pela equipe."],
                  ["Confirmação", "O cliente recebe os dados e o código no WhatsApp."],
                  ["Lembrete", "Um aviso antes da data, para a mesa não ficar vazia."],
                  [
                    "Reconfirmação",
                    "Se falta confirmar, o cliente recebe um aviso e responde “sim”.",
                  ],
                  [
                    "Cliente chega",
                    "Você finaliza a reserva no painel e o histórico do cliente cresce.",
                  ],
                ].map(([t, d]) => (
                  <li key={t} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[2.15rem] top-1 size-3 -rotate-45 rounded-[50%_50%_50%_0] bg-blue-500"
                    />
                    <p className="font-semibold">{t}</p>
                    <p className="text-sm text-slate-300">{d}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* 6. TUDO CONECTADO */}
        <section id="recursos" className="scroll-mt-20 py-[72px] md:py-28">
          <div className="mx-auto max-w-[1200px] px-5">
            <Reveal>
              <Tag>Tudo conectado</Tag>
              <H2>Cada reserva alimenta o resto.</H2>
              <p className="mt-4 max-w-2xl text-lg text-slate-600">
                A reserva cria o cliente. O cliente guarda o histórico. A agenda e os relatórios
                mostram o resultado. Nada fica solto.
              </p>
            </Reveal>
            <Reveal delay={80}>
              <ol className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-lg font-semibold">
                {["Reserva", "Cliente", "Agenda", "Relatórios"].map((t, i, a) => (
                  <li key={t} className="flex items-center gap-3">
                    {t}
                    {i < a.length - 1 && (
                      <span aria-hidden="true" className="h-0.5 w-8 rounded-full bg-blue-200" />
                    )}
                  </li>
                ))}
              </ol>
            </Reveal>

            <div className="mt-20 grid items-center gap-12 lg:grid-cols-2">
              <Reveal>
                <Tag>Sua marca</Tag>
                <h3 className="mt-3 text-[1.9rem] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-4xl">
                  Seu cliente reserva com você. Não com um app.
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-slate-600">
                  Página de reserva, cardápio e Link Hub com o logo e a cor do restaurante. O Teggly
                  trabalha nos bastidores.
                </p>
                <ul className="mt-6 space-y-4">
                  {[
                    [
                      "Sua marca",
                      "Logo e cor do restaurante nas páginas públicas, quando você ligar.",
                    ],
                    ["Seus clientes", "A base é sua: exporte a lista quando quiser."],
                    [
                      "Seu cardápio e seu Link Hub",
                      "Em todos os planos, com destaque para iFood e outros canais da casa.",
                    ],
                  ].map(([t, d]) => (
                    <li key={t} className="border-l-2 border-blue-200 pl-4">
                      <p className="font-semibold">{t}</p>
                      <p className="text-sm text-slate-600">{d}</p>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={80}>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <Tela
                    src="/site/produto-reserva.png"
                    alt="Página de reserva de um restaurante de exemplo, com nome, telefone, pessoas e data."
                  />
                  <Tela
                    src="/site/produto-link-hub.png"
                    alt="Link Hub de um restaurante de exemplo, com Reservar mesa em destaque."
                  />
                  <Tela
                    src="/site/produto-cardapio.png"
                    alt="Cardápio digital de um restaurante de exemplo, com categorias e preços."
                  />
                </div>
                <p className="mt-3 text-xs text-slate-600">Telas reais com dados de exemplo.</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 7. PROVA */}
        <section className="border-y border-border/60 bg-slate-50 py-14">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg font-semibold">
              Em uso no Iracema Bistrô Bar, em Santa Tereza, Belo Horizonte.
            </p>
            <p className="text-sm text-slate-600">
              Quer ver funcionando na sua casa? Mostramos em 20 minutos.
            </p>
          </div>
        </section>

        {/* 8. PLANOS */}
        <section id="planos" className="scroll-mt-20 py-[72px] md:py-28">
          <div className="mx-auto max-w-[1200px] px-5">
            <Reveal>
              <Tag>Planos</Tag>
              <H2>Comece grátis. Pague quando a casa encher.</H2>
              <p className="mt-4 max-w-2xl text-lg text-slate-600">
                Cardápio e Link Hub em todos os planos. A diferença está no volume de reservas e na
                automação do WhatsApp.
              </p>
            </Reveal>
            <PlanosSection />
          </div>
        </section>

        {/* 9. FAQ */}
        <section
          id="faq"
          className="scroll-mt-20 border-t border-border/60 bg-slate-50 py-[72px] md:py-28"
        >
          <div className="mx-auto grid max-w-[1200px] gap-10 px-5 lg:grid-cols-[1fr_1.6fr]">
            <Reveal>
              <Tag>Dúvidas</Tag>
              <H2>Perguntas comuns.</H2>
            </Reveal>
            <Reveal delay={80}>
              <Accordion type="single" collapsible className="lg:mt-0">
                {faq.map((f) => (
                  <AccordionItem key={f.q} value={f.q}>
                    <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-slate-600">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>

        {/* 10. CTA */}
        <section className="py-[72px] md:py-28">
          <div className="mx-auto max-w-[1200px] px-5">
            <Reveal>
              <div className="rounded-[20px] bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 px-6 py-14 text-center text-white sm:px-10">
                <h2 className="mx-auto max-w-2xl text-[2rem] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-5xl">
                  Sexta cheia. Celular em paz.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
                  Comece grátis e receba as primeiras reservas ainda esta semana.
                </p>
                <div className="mt-8 flex justify-center">
                  <CTAPrimary onDark />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card safe-bottom">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-12 sm:grid-cols-2">
          <div>
            <a href="#topo" className="inline-flex">
              <img
                src="/brand/Teggly_Logo_Primary.svg"
                alt="Teggly"
                width={118}
                height={28}
                className="h-7 w-auto"
              />
            </a>
            <p className="mt-3 text-sm font-semibold">Mais reservas. Menos trabalho.</p>
            <p className="mt-1 max-w-sm text-sm text-slate-600">
              Feito no Brasil para quem vive de receber pessoas.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm sm:justify-items-end">
            <nav aria-label="Página" className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                Página
              </p>
              {(
                [
                  ["#produto", "Produto"],
                  ["#planos", "Planos"],
                  ["#faq", "Dúvidas"],
                ] as const
              ).map(([href, rotulo]) => (
                <a
                  key={href}
                  href={href}
                  className="flex min-h-11 items-center text-slate-600 transition hover:text-foreground"
                >
                  {rotulo}
                </a>
              ))}
            </nav>
            <nav aria-label="Contato" className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                Contato
              </p>
              <a
                href={`mailto:${EMAIL_CONTATO}`}
                className="flex min-h-11 items-center text-slate-600 transition hover:text-foreground"
              >
                E-mail
              </a>
              <a
                href={`https://instagram.com/${INSTAGRAM_TEGGLY}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-2 text-slate-600 transition hover:text-foreground"
              >
                <BrandIcon marca="instagram" className="h-4 w-4" /> @{INSTAGRAM_TEGGLY}
              </a>
              <Link
                to="/master/login"
                className="flex min-h-11 items-center text-slate-600 transition hover:text-foreground"
              >
                Área administrativa
              </Link>
            </nav>
          </div>
        </div>
        <div className="border-t border-border">
          <p className="mx-auto max-w-[1200px] px-5 py-5 text-xs text-slate-600">
            © {new Date().getFullYear()} Teggly. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
