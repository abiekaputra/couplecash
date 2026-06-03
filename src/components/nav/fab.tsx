"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Fab() {
  const path = usePathname();
  if (path === "/add") return null;

  return (
    <Link
      href="/add"
      aria-label="Add transaction"
      className={cn(
        // Mobile: sits above bottom nav
        "fixed bottom-20 right-4 z-50",
        // Desktop: sits above bottom of screen, offset for sidebar
        "md:bottom-6 md:right-6",
        "flex size-14 items-center justify-center rounded-full",
        "bg-primary shadow-lg shadow-primary/25",
        "text-primary-foreground",
        "hover:bg-primary/90 active:scale-95 transition-all",
      )}
    >
      <Plus className="size-6" />
    </Link>
  );
}
