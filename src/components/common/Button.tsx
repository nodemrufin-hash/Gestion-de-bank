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
  primary: "text-white active:scale-95 hover:opacity-90",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:border-slate-400 shadow-sm",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-700",
  outline: "bg-transparent border border-white/30 hover:bg-white/10 text-white",
};

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { backgroundColor: "#081A2E" },
  secondary: {},
  ghost: {},
  outline: {},
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
  style,
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

  const mergedStyle = { ...variantStyles[variant], ...style };

  if (href)
    return (
      <Link href={href} className={classes} style={mergedStyle}>
        {children}
      </Link>
    );
  return (
    <button className={classes} style={mergedStyle} {...props}>
      {children}
    </button>
  );
}
