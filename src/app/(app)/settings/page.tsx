import Link from "next/link";
import { ChevronRight, RefreshCw, Download } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileForm } from "./profile-form";

export default async function SettingsPage() {
  const session = await getCurrentUser();
  const { profile } = session!;

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto w-full px-4 pb-10">
      <PageHeader title="Settings" className="px-0" />

      {/* User card */}
      <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
        <div
          className="size-11 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
          style={{ background: profile.avatar_color ?? "#FF8B7B" }}
        >
          {profile.display_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">{profile.display_name}</p>
            {profile.role === "admin" && <Badge>Admin</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{profile.username}@couplecash.app</p>
        </div>
      </div>

      {/* Profile edit */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile</p>
        <ProfileForm displayName={profile.display_name} />
      </div>

      {/* Appearance */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appearance</p>
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Theme</p>
          <ThemeToggle />
        </div>
      </div>

      {/* Admin section */}
      {profile.role === "admin" && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
          <div className="rounded-xl border bg-card overflow-hidden divide-y">
            <Link href="/settings/recurring"
              className="flex items-center justify-between px-4 py-3.5 text-sm hover:bg-muted transition"
            >
              <div className="flex items-center gap-2.5">
                <RefreshCw className="size-4 text-muted-foreground" />
                <span className="font-medium">Recurring templates</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      )}

      {/* Data */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</p>
        <div className="rounded-xl border bg-card overflow-hidden divide-y">
          <a
            href="/api/export/transactions"
            download="couplecash-transactions.csv"
            className="flex items-center justify-between px-4 py-3.5 text-sm hover:bg-muted transition"
          >
            <div className="flex items-center gap-2.5">
              <Download className="size-4 text-muted-foreground" />
              <span className="font-medium">Export transactions CSV</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Logout mobile */}
      <div className="md:hidden pt-2">
        <LogoutButton />
      </div>
    </div>
  );
}
