import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Badge Teggly: pilula com ponto, fundo tom 50, ponto tom 500 e texto tom 700.
const badgeVariants = cva(
  "inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full border border-transparent px-2.5 text-xs font-semibold transition-colors before:size-[7px] before:rounded-full before:bg-current before:content-[''] focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/30",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground before:bg-blue-500",
        secondary: "bg-muted text-muted-foreground before:bg-slate-400",
        success: "bg-success-50 text-success-700 before:bg-success-500",
        warning: "bg-warning-50 text-warning-700 before:bg-warning-500",
        destructive: "bg-error-50 text-error-700 before:bg-error-500",
        outline: "border-border text-foreground before:hidden",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
