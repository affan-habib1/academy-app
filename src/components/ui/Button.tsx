import * as React from "react";

import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
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
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-emerald-600 text-white hover:bg-emerald-700",
        variant === "secondary" && "bg-slate-100 text-slate-700 hover:bg-slate-200",
        variant === "outline" && "border border-slate-200 text-slate-700 hover:bg-slate-100",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2",
        size === "lg" && "px-5 py-2.5",
        className,
      )}
      {...props}
    />
  );
}
