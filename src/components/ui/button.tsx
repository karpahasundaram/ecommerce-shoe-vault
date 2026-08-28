import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-foreground hover:bg-brand-dark",
  outline: "border border-border bg-white text-foreground hover:bg-subtle",
  ghost: "text-foreground hover:bg-subtle",
  danger: "border border-brand/30 bg-white text-brand hover:bg-brand-subtle",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

/** Class string for styling links/other elements as buttons. */
export function buttonClasses(opts?: {
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return cn(
    base,
    variants[opts?.variant ?? "primary"],
    sizes[opts?.size ?? "md"],
    opts?.className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}
