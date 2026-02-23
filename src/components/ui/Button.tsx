import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "border font-medium disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" ? "px-3 py-1 text-sm" : "px-4 py-2",
        variant === "primary" && "bg-black text-white border-black",
        variant === "secondary" && "bg-white text-black border-black",
        variant === "danger" && "bg-white text-black border-black",
        className
      )}
    >
      {children}
    </button>
  );
}
