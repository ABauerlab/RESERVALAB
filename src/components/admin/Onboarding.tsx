import { origemPublica } from "@/lib/site";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { usePlano } from "@/hooks/use-plano";
import { supabase } from "@/integrations/supabase/client";
import {
  CHAVE_TOUR_ATIVO,
  EVENTO_REINICIAR,
  ONBOARDING_VERSAO,
  caminhoDoPasso,
  chavePasso,
  deveMostrar,
  mesmaPagina,
  limitarPasso,
  passosDoTour,
} from "@/lib/onboarding";
import { temRecurso } from "@/lib/plans";
import { getTenantBySlug } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Alvo = { top: number; left: number; width: number; height: number };

function acharAlvo(nome: string | null): Alvo | null {
  if (!nome) return null;
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${nome}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      return { top: r.top, left: r.left, width: r.width, height: r.height };
    }
  }
  return null;
}

/**
 * Passo a passo curto apos o login. Nao bloqueia o uso: o destaque deixa os cliques passarem,
 * "Pular" esta sempre a vista e o passo atual e lembrado. Sem alvo visivel (celular, itens em
 * "Mais"), o cartao aparece sozinho acima da barra inferior.
 */
export function Onboarding({ slug }: { slug: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [i, setI] = useState(0);
  const [alvo, setAlvo] = useState<Alvo | null>(null);
  const [largo, setLargo] = useState(true);
  const cartao = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (st) => st.location.pathname });

  const tenantQ = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => getTenantBySlug(slug),
    staleTime: 5 * 60_000,
  });
  const { plano } = usePlano(!!tenantQ.data, tenantQ.data?.id ?? null);
  const passos = useMemo(
    () =>
      passosDoTour({
        whatsapp: temRecurso(plano, "whatsapp_confirmacao"),
        assistente: temRecurso(plano, "assistente_ia"),
      }),
    [plano],
  );
  const passo = passos[limitarPasso(i, passos.length)]!;
  const ultimo = i >= passos.length - 1;
  const caminho = caminhoDoPasso(slug, passo);
  const naPagina = caminho === null || mesmaPagina(pathname, caminho);

  /** Muda de passo e, se o passo mora em outra pagina, leva a pessoa para ela. */
  const irPara = useCallback(
    (novo: number) => {
      const n = limitarPasso(novo, passos.length);
      setI(n);
      try {
        sessionStorage.setItem(CHAVE_TOUR_ATIVO, "1");
        if (userId) localStorage.setItem(chavePasso(userId), String(n));
      } catch {
        /* sem storage */
      }
      const destino = caminhoDoPasso(slug, passos[n]!);
      if (destino && !mesmaPagina(window.location.pathname, destino)) {
        void navigate({ to: destino as never });
      }
    },
    [navigate, passos, slug, userId],
  );

  // Quem abre o painel pela primeira vez ve o tour; os demais so se pedirem em Ajustes.
  useEffect(() => {
    let vivo = true;
    let t: ReturnType<typeof setTimeout> | undefined;
    void supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (!vivo || !u) return;
      setUserId(u.id);
      let emAndamento = false;
      try {
        emAndamento = sessionStorage.getItem(CHAVE_TOUR_ATIVO) === "1";
      } catch {
        /* sem storage */
      }
      if (emAndamento || deveMostrar(u)) {
        let salvo = 0;
        try {
          salvo = Number(localStorage.getItem(chavePasso(u.id)) ?? 0);
        } catch {
          /* sem storage */
        }
        t = setTimeout(
          () => {
            setI(limitarPasso(salvo, 20));
            setAberto(true);
          },
          emAndamento ? 150 : 700,
        );
      }
    });
    return () => {
      vivo = false;
      if (t) clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const abrir = () => {
      setI(0);
      setAberto(true);
      try {
        sessionStorage.setItem(CHAVE_TOUR_ATIVO, "1");
      } catch {
        /* sem storage */
      }
    };
    window.addEventListener(EVENTO_REINICIAR, abrir);
    return () => window.removeEventListener(EVENTO_REINICIAR, abrir);
  }, []);

  const medir = useCallback(() => {
    setLargo(window.innerWidth >= 768);
    setAlvo(aberto && naPagina ? acharAlvo(passo.alvo) : null);
  }, [aberto, passo.alvo, naPagina]);

  useLayoutEffect(() => {
    medir();
    if (!aberto) return;
    // A pagina nova carrega dados depois de montar: mede de novo ate o alvo aparecer.
    const retries = [150, 400, 900, 1800].map((ms) => setTimeout(medir, ms));
    return () => retries.forEach(clearTimeout);
  }, [aberto, medir, i, pathname]);

  useLayoutEffect(() => {
    if (!aberto) return;
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [aberto, medir]);

  useEffect(() => {
    if (!aberto) return;
    cartao.current?.focus();
    if (userId) {
      try {
        localStorage.setItem(chavePasso(userId), String(i));
      } catch {
        /* sem storage */
      }
    }
  }, [aberto, i, userId]);

  const encerrar = useCallback(
    (como: "concluido_em" | "pulado_em") => {
      setAberto(false);
      try {
        sessionStorage.removeItem(CHAVE_TOUR_ATIVO);
      } catch {
        /* sem storage */
      }
      if (userId) {
        try {
          localStorage.removeItem(chavePasso(userId));
        } catch {
          /* sem storage */
        }
      }
      void supabase.auth
        .updateUser({
          data: {
            teggly_onboarding: { versao: ONBOARDING_VERSAO, [como]: new Date().toISOString() },
          },
        })
        .catch(() => undefined);
    },
    [userId],
  );

  useEffect(() => {
    if (!aberto) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") encerrar("pulado_em");
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [aberto, encerrar]);

  if (!aberto || typeof document === "undefined") return null;

  const pct = passos.length > 1 ? (i / (passos.length - 1)) * 100 : 100;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const estilo: React.CSSProperties =
    alvo && largo
      ? {
          left: Math.min(alvo.left + alvo.width + 16, vw - 376),
          top: Math.min(Math.max(16, alvo.top - 8), vh - 300),
        }
      : largo
        ? { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
        : { left: 16, right: 16, bottom: "calc(5.5rem + env(safe-area-inset-bottom))" };

  const copiar = () =>
    navigator.clipboard?.writeText(`${origemPublica()}/${slug}`).then(
      () => toast.success("Link copiado."),
      () => toast.error("Não foi possível copiar."),
    );

  return createPortal(
    <>
      {alvo ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[60] rounded-xl ring-2 ring-primary transition-all duration-200"
          style={{
            top: alvo.top - 4,
            left: alvo.left - 4,
            width: alvo.width + 8,
            height: alvo.height + 8,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.45)",
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[60] bg-slate-900/30"
        />
      )}
      <div
        ref={cartao}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-labelledby="onb-titulo"
        aria-describedby="onb-texto"
        className={cn(
          "fixed z-[61] w-[min(92vw,360px)] rounded-[20px] border border-border bg-card p-5 shadow-lg outline-none",
          largo ? "" : "mx-auto max-w-md",
          ultimo && "animate-drop",
        )}
        style={estilo}
      >
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          <span>
            Passo {i + 1} de {passos.length}
          </span>
          <button
            type="button"
            onClick={() => encerrar("pulado_em")}
            className="inline-flex min-h-11 items-center px-1 normal-case tracking-normal text-slate-700 underline-offset-2 hover:underline"
          >
            Pular
          </button>
        </div>
        <div
          className="relative mt-2 h-0.5 rounded-full bg-blue-100"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={passos.length}
          aria-valuenow={i + 1}
          aria-label="Progresso do passo a passo"
        >
          <span
            className="absolute left-0 top-0 h-full rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
          <span
            aria-hidden="true"
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-[50%_50%_50%_0] bg-primary"
            style={{ left: `${pct}%` }}
          />
        </div>
        <h2 id="onb-titulo" className="mt-4 text-lg font-semibold tracking-[-0.02em]">
          {passo.titulo}
        </h2>
        <p id="onb-texto" className="mt-1.5 text-sm leading-relaxed text-slate-600">
          {passo.texto}
          {passo.alvo && !alvo && passo.dicaMobile ? ` ${passo.dicaMobile}` : ""}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          {ultimo && (
            <Button
              variant="outline"
              onClick={() => void copiar()}
              className="mr-auto h-11 rounded-md"
            >
              Copiar link de reserva
            </Button>
          )}
          {i > 0 && (
            <Button variant="ghost" onClick={() => irPara(i - 1)} className="h-11 rounded-md">
              Voltar
            </Button>
          )}
          {!naPagina && caminho && (
            <Button
              variant="outline"
              onClick={() => void navigate({ to: caminho as never })}
              className="h-11 rounded-md"
            >
              Ir para esta página
            </Button>
          )}
          <Button
            onClick={() => (ultimo ? encerrar("concluido_em") : irPara(i + 1))}
            className="h-11 rounded-md"
          >
            {i === 0 ? "Começar" : ultimo ? "Concluir" : "Próximo"}
          </Button>
        </div>
      </div>
    </>,
    document.body,
  );
}
