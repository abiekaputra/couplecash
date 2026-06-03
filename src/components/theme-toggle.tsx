"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "system", icon: Monitor, label: "System" },
  { value: "dark", icon: Moon, label: "Dark" },
];

function applyTheme(t: Theme) {
  const dark =
    t === "dark" ||
    (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Add transition class, apply change, remove after animation
  document.documentElement.classList.add("theme-transitioning");
  document.documentElement.classList.toggle("dark", dark);
  setTimeout(() => {
    document.documentElement.classList.remove("theme-transitioning");
  }, 300);

  try { localStorage.setItem("cc-theme", t); } catch {}
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cc-theme") as Theme | null;
      if (stored) setTheme(stored);
    } catch {}
  }, []);

  function handleChange(t: Theme) {
    setTheme(t);
    applyTheme(t);
  }

  return (
    <div className="flex rounded-xl border bg-muted p-1 gap-1">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => handleChange(value)}
          title={label}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors",
            theme === value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
