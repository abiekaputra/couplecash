"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  LayoutDashboard, Clock, BarChart2,
  PiggyBank, Settings, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { logout } from "@/app/login/actions";
import type { Profile } from "@/types/database";

const NAV_ITEMS = [
  { href: "/",         label: "Dashboard", icon: LayoutDashboard },
  { href: "/history",  label: "History",   icon: Clock },
  { href: "/stats",    label: "Stats",     icon: BarChart2 },
  { href: "/savings",  label: "Savings",   icon: PiggyBank },
  { href: "/settings", label: "Settings",  icon: Settings },
];

export function Sidebar({ profile }: { profile: Profile }) {
  const path = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <aside className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 md:left-0 md:z-50 border-r bg-card">
      {/* Logo */}
      <div className="px-4 py-5 border-b">
        <Logo variant="full" markClassName="size-8" textClassName="text-lg" />
      </div>

      {/* Nav links — only navigation here */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout pinned to bottom */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div
            className="size-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: profile.avatar_color ?? "#FF8B7B" }}
          >
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">
              {profile.display_name}
            </p>
            <p className="text-[10px] text-muted-foreground capitalize">
              {profile.role}
            </p>
          </div>
          <button
            type="button"
            title="Sign out"
            disabled={pending}
            onClick={() => startTransition(() => logout())}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
