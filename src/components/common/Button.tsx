import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-800 hover:bg-brand-900 text-white shadow-sm hover:shadow-md active:scale-95",
  secondary:
    "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-brand-800 shadow-sm",
  ghost: "bg-transparent hover:bg-brand-50 text-brand-800 hover:text-brand-900",
  outline:
    "bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-4 py-2 rounded-lg",
  md: "text-sm px-5 py-2.5 rounded-xl",
  lg: "text-sm px-7 py-4 rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  href,
  children,
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none";

  const classes = [
    base,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href)
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
