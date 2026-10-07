import { cn } from "@/lib/utils";

/** A gota Teggly: indicador de item ativo / "agora". Puramente visual. */
export function Drop({ className, animate }: { className?: string; animate?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-2.5 shrink-0 -rotate-45 rounded-[50%_50%_50%_0] bg-primary",
        animate && "animate-drop",
        className,
      )}
    />
  );
}
