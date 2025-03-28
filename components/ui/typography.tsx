import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function H1({ children, className, ...props }: TypographyProps) {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className, ...props }: TypographyProps) {
  return (
    <h2
      className={cn(
        "mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className, ...props }: TypographyProps) {
  return (
    <h3
      className={cn(
        "mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function P({ children, className, ...props }: TypographyProps) {
  return (
    <p
      className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function Blockquote({ children, className, ...props }: TypographyProps) {
  return (
    <blockquote
      className={cn("mt-6 border-l-2 pl-6 italic", className)}
      {...props}
    >
      {children}
    </blockquote>
  );
}

export function List({ children, className, ...props }: TypographyProps) {
  return (
    <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)} {...props}>
      {children}
    </ul>
  );
}

export function InlineLink({
  children,
  className,
  ...props
}: TypographyProps & { href?: string }) {
  return (
    <a
      className={cn(
        "font-medium text-primary underline underline-offset-4",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}
