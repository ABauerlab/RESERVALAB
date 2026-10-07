import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-card px-3.5 py-1 text-base shadow-xs transition duration-200 ease-teggly file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 aria-invalid:border-error-500 aria-invalid:ring-4 aria-invalid:ring-error-500/15 disabled:cursor-not-allowed disabled:bg-muted disabled:text-slate-400 md:text-[15px]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
