import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A unified loading component with support for full-page, container, and inline sizes.
 */
export function Loader({ className, size = "default", fullPage = false, text }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    default: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4",
    xl: "h-16 w-16 border-4",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Outer pulse */}
        <div className={cn(
          "absolute inset-0 rounded-full bg-primary/20 animate-ping",
          size === "sm" ? "h-4 w-4" : size === "lg" ? "h-12 w-12" : size === "xl" ? "h-16 w-16" : "h-8 w-8"
        )} />
        {/* Main spinner */}
        <Loader2 
          className={cn(
            "animate-spin text-primary",
            size === "sm" ? "h-4 w-4" : size === "lg" ? "h-12 w-12" : size === "xl" ? "h-16 w-16" : "h-8 w-8",
            className
          )} 
        />
      </div>
      {text && <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
        {spinner}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {spinner}
    </div>
  );
}

/**
 * Specific PageLoader for entire views.
 */
export function PageLoader({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] w-full animate-in fade-in duration-500">
      <Loader size="lg" text={text} />
    </div>
  );
}
