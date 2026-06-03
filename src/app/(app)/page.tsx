import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  getBalances, getMonthlySpend,
  getTodaySpend, getSavingGoal, getProfiles,
} from "@/features/transactions/service";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { formatIDR } from "@/lib/utils";
import {
  Wallet, TrendingDown, CalendarDays,
  PiggyBank, Plus, Clock,
} from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  food: "Food", shop: "Shop", transport: "Transport",
  fun: "Fun", bills: "Bills",
};

export default async function DashboardPage() {
  const session = await getCurrentUser();
  if (!session) return null;
  const { profile } = session;

  const [balances, monthly, today, goal, profiles] = await Promise.all([
    getBalances(profile.couple_id),
    getMonthlySpend(profile.couple_id),
    getTodaySpend(profile.couple_id),
    getSavingGoal(profile.couple_id).catch(() => null),
    getProfiles(profile.couple_id),
  ]);

  // Map userId → profile
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

  // Sort profiles so current user is first
  const sorted = [
    profiles.find((p) => p.id === profile.id)!,
    ...profiles.filter((p) => p.id !== profile.id),
  ].filter(Boolean);

  const targetAmount = goal?.target_amount ?? 0;
  const savingsTotal = balances.savingsTotal;
  const progressPct = targetAmount > 0
    ? Math.min(100, Math.round((savingsTotal / targetAmount) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-6 max-w-lg mx-auto w-full">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Good day,</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-xl font-semibold">{profile.display_name}</h1>
            {profile.role === "admin" && <Badge>Admin</Badge>}
          </div>
        </div>
        <Logo variant="mark" markClassName="size-9 opacity-80" />
      </div>

      {/* Balances */}
      <section>
        <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
          Balances
        </p>
        <div className="grid grid-cols-2 gap-3">
          {sorted.map((p) => (
            <StatCard
              key={p.id}
              title={p.display_name}
              value={formatIDR(balances.balanceMap[p.id] ?? 0)}
              icon={Wallet}
              iconColor={p.id === sorted[0].id ? "bg-primary-soft" : "bg-secondary/20"}
            />
          ))}
        </div>
      </section>

      {/* Shared savings */}
      <section className="rounded-xl border bg-accent/15 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="size-4 text-accent-foreground/70" />
            <p className="text-sm font-semibold text-accent-foreground">
              {goal?.title ?? "Shared Savings"}
            </p>
          </div>
          {targetAmount > 0 && (
            <p className="text-xs text-muted-foreground">
              Goal: {formatIDR(targetAmount, { compact: true })}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-2.5 rounded-full bg-accent/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-end justify-between mt-2">
          <div>
            <p className="text-2xl font-semibold text-accent-foreground">
              {formatIDR(savingsTotal)}
            </p>
            {targetAmount > 0 && savingsTotal < targetAmount && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatIDR(targetAmount - savingsTotal)} to go
              </p>
            )}
            {savingsTotal >= targetAmount && targetAmount > 0 && (
              <p className="text-xs font-medium text-accent-foreground mt-0.5">
                🎉 Goal reached!
              </p>
            )}
          </div>
          <p className="text-sm font-semibold text-accent-foreground/80">
            {progressPct}%
          </p>
        </div>
      </section>

      {/* Today */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <CalendarDays className="size-3.5 text-muted-foreground" />
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Today
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {sorted.map((p) => (
            <StatCard
              key={p.id}
              title={`${p.display_name}`}
              value={formatIDR(today[p.id] ?? 0)}
              icon={TrendingDown}
              iconColor="bg-destructive/10"
              sub="spent today"
            />
          ))}
        </div>
      </section>

      {/* This month */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="size-3.5 text-muted-foreground" />
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            This month
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {sorted.map((p) => (
            <StatCard
              key={p.id}
              title={p.display_name}
              value={formatIDR(monthly.spendMap[p.id] ?? 0)}
              icon={TrendingDown}
              iconColor="bg-destructive/10"
              sub="spent this month"
            />
          ))}
        </div>

        {/* Top category */}
        {monthly.topCategory && (
          <div className="mt-3 rounded-xl border bg-card px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Biggest category</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold capitalize">
                {CATEGORY_LABEL[monthly.topCategory[0]] ?? monthly.topCategory[0]}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatIDR(monthly.topCategory[1])}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/add"
          className="flex items-center justify-center gap-2 rounded-xl border bg-card py-3 text-sm font-medium text-foreground hover:bg-muted transition"
        >
          <Plus className="size-4 text-primary" />
          Add expense
        </Link>
        <Link
          href="/history"
          className="flex items-center justify-center gap-2 rounded-xl border bg-card py-3 text-sm font-medium text-foreground hover:bg-muted transition"
        >
          <Clock className="size-4 text-secondary" />
          View history
        </Link>
      </section>
    </div>
  );
}
