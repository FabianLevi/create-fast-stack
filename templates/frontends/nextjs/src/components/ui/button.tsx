import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VARIANT = {
  DEFAULT: "default",
  OUTLINE: "outline",
  GHOST: "ghost",
} as const;

type Variant = (typeof VARIANT)[keyof typeof VARIANT];

const SIZE = {
  DEFAULT: "default",
  SM: "sm",
  LG: "lg",
} as const;

type Size = (typeof SIZE)[keyof typeof SIZE];

const variantStyles: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
  outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
};

const sizeStyles: Record<Size, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-10 px-6",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = VARIANT.DEFAULT,
  size = SIZE.DEFAULT,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}
