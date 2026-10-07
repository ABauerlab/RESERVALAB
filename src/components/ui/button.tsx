import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Botao Teggly: 44 px, raio 10, SemiBold 15, azul de acao com sombra azul.
const disabledSolid =
  "disabled:border-transparent disabled:bg-muted disabled:text-slate-400 disabled:shadow-none";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[15px] font-semibold cursor-pointer transition duration-200 ease-teggly focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: `bg-primary text-primary-foreground shadow-blue hover:bg-blue-700 ${disabledSolid}`,
        destructive: `bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 ${disabledSolid}`,
        outline: `border border-border bg-card text-foreground shadow-xs hover:border-slate-300 hover:bg-slate-50 ${disabledSolid}`,
        secondary: `bg-accent text-accent-foreground hover:bg-blue-100 ${disabledSolid}`,
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground disabled:text-slate-400",
        link: "text-primary underline-offset-4 hover:underline disabled:text-slate-400",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-[9px] px-3.5 text-sm [&_svg]:size-4",
        lg: "h-[52px] rounded-[12px] px-6 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
