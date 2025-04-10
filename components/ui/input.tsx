import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "expense" | "income";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <div className="relative">
        {variant === "expense" && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 select-none pointer-events-none">
            -
          </span>
        )}
        {variant === "income" && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 select-none pointer-events-none">
            +
          </span>
        )}
        <input
          type={type}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            variant === "expense" && "pl-7 border-red-300 focus-visible:ring-red-200",
            variant === "income" && "pl-7 border-green-300 focus-visible:ring-green-200",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
