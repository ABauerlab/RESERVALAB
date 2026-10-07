import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/** Ação principal compacta de uma linha. 44px de toque no mobile, 36px no desktop. */
export function QuickAction({
  children,
  onClick,
  busy,
  disabled,
  variant = "primary",
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      disabled={disabled || busy}
      className={cn(
        "inline-flex h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3.5 text-[13px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 xl:h-9",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-blue-700"
          : "border border-border bg-card text-foreground hover:bg-accent",
        className,
      )}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : Icon ? (
        <Icon className="h-3.5 w-3.5" />
      ) : null}
      {children}
    </button>
  );
}
