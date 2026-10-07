import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { fetchPerfil, tabela } from "@/lib/cardapio";

/**
 * "Usar minha marca nas páginas públicas". Desligado por padrão: a cor e o logo de Identidade só
 * valem na página de reservas, cardápio e links depois que a empresa liga. O painel não muda.
 */
export function MarcaOptIn({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const perfilQ = useQuery({
    queryKey: ["cardapio-admin", "perfil", tenantId],
    queryFn: async () => {
      const { data, error } = await fetchPerfil(tenantId);
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const salvar = useMutation({
    mutationFn: async (valor: boolean) => {
      const { error } = await tabela("tenant_perfil").upsert(
        { tenant_id: tenantId, marca_ativa: valor },
        { onConflict: "tenant_id" },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, valor) => {
      toast.success(
        valor ? "Sua marca está ativa nas páginas públicas." : "Visual Teggly restaurado.",
      );
      qc.invalidateQueries({ queryKey: ["cardapio-admin"] });
      qc.invalidateQueries({ queryKey: ["marca"] });
    },
    onError: () => toast.error("Não foi possível alterar."),
  });
  const ativa =
    (perfilQ.data as { marca_ativa?: boolean } | null | undefined)?.marca_ativa ?? false;
  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
      <Switch
        id="marca-ativa"
        checked={ativa}
        disabled={perfilQ.isLoading || salvar.isPending}
        onCheckedChange={(v) => salvar.mutate(v)}
        aria-label="Usar minha marca nas páginas públicas"
        className="mt-0.5"
      />
      <div>
        <Label htmlFor="marca-ativa" className="text-sm font-semibold">
          Usar minha marca nas páginas públicas
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          A cor principal e o logo acima passam a valer na página de reservas, no cardápio e nos
          links. Desligado, essas páginas usam o visual Teggly. O painel não muda.
        </p>
      </div>
    </div>
  );
}
