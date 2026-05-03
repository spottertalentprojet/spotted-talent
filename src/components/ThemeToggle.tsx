import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? resolvedTheme ?? "dark" : "dark";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/80 p-1.5 shadow-[0_16px_40px_-28px_hsl(var(--foreground)/0.35)] backdrop-blur-xl",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-label="Activer le mode clair"
        aria-pressed={activeTheme === "light"}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
          activeTheme === "light"
            ? "bg-primary text-primary-foreground shadow-[0_10px_24px_-16px_hsl(var(--primary)/0.8)]"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-label="Activer le mode sombre"
        aria-pressed={activeTheme === "dark"}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
          activeTheme === "dark"
            ? "bg-primary text-primary-foreground shadow-[0_10px_24px_-16px_hsl(var(--primary)/0.8)]"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ThemeToggle;
