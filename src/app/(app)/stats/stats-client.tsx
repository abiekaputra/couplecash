"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { cn, formatIDR } from "@/lib/utils";
import { StatCard } from "@/components/stat-card";
import { CATEGORY_CONFIG } from "@/components/category-icon";
import { TrendingDown } from "lucide-react";
import type { Profile, Transaction } from "@/types/database";
import type { StatsPeriod } from "@/features/stats/service";

// ── Colour maps ───────────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  food: "#F97316", shop: "#F43F5E", transport: "#0EA5E9",
  fun: "#A855F7", bills: "#F59E0B", saving: "#A8D8B9", income: "#A8D8B9",
};

// ── Tooltip formatters ────────────────────────────────────────────────────────
function PieTooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-xl border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold capitalize">{CATEGORY_CONFIG[name]?.label ?? name}</p>
      <p className="text-muted-foreground">{formatIDR(value)}</p>
    </div>
  );
}

function BarTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-card px-3 py-2 text-xs shadow-lg space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.dataKey}:</span>
          <span className="font-medium">{formatIDR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
const PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "6 Months" },
];

interface StatsClientProps {
  profiles: Profile[];
  allTransactions: (Transaction & { profile: { display_name: string; avatar_color: string | null; username: string } })[];
}

export function StatsClient({ profiles, allTransactions }: StatsClientProps) {
  const [period, setPeriod] = useState<StatsPeriod>("month");
  const [filterUserId, setFilterUserId] = useState<string | undefined>(undefined);

  // Stable color map — coral for first (abieka), sky for second (semma)
  const PROFILE_PALETTE = ["#FF8B7B", "#7DB9DE", "#A8D8B9", "#F59E0B"];
  const profileColors = Object.fromEntries(
    profiles.map((p, i) => [p.id, PROFILE_PALETTE[i] ?? "#ccc"])
  );

  // Compute stats client-side from allTransactions
  const stats = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");

    let fromDate: string | null = null;
    if (period === "week") {
      const d = new Date(now); d.setDate(d.getDate() - 6);
      fromDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    } else if (period === "month") {
      fromDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    } else {
      const d = new Date(now); d.setMonth(d.getMonth() - 5); d.setDate(1);
      fromDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
    }

    const rows = allTransactions.filter(t => {
      if (t.type !== "expense" || t.category === "saving") return false;
      if (fromDate && t.transaction_date < fromDate) return false;
      if (filterUserId && t.user_id !== filterUserId) return false;
      return true;
    });

    const totalPerUser: Record<string, number> = {};
    for (const p of profiles) totalPerUser[p.id] = 0;
    const catMap: Record<string, number> = {};

    for (const tx of rows) {
      totalPerUser[tx.user_id] = (totalPerUser[tx.user_id] ?? 0) + Number(tx.amount);
      catMap[tx.category] = (catMap[tx.category] ?? 0) + Number(tx.amount);
    }

    const combined = Object.values(totalPerUser).reduce((a, b) => a + b, 0);
    const categoryBreakdown = Object.entries(catMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Trend
    let trendData: { label: string; [k: string]: number | string }[] = [];
    if (period === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const label = d.toLocaleDateString("en-GB", { weekday: "short" });
        const entry: any = { label };
        for (const p of profiles) {
          entry[p.display_name] = rows
            .filter(t => t.user_id === p.id && t.transaction_date === key)
            .reduce((s, t) => s + Number(t.amount), 0);
        }
        trendData.push(entry);
      }
    } else if (period === "month") {
      for (let wi = 0; wi < 4; wi++) {
        const start = wi * 7 + 1, end = Math.min(start + 6, 31);
        const entry: any = { label: `Wk ${wi + 1}` };
        for (const p of profiles) {
          entry[p.display_name] = rows
            .filter(t => {
              if (t.user_id !== p.id) return false;
              const day = parseInt(t.transaction_date.slice(8), 10);
              return day >= start && day <= end;
            })
            .reduce((s, t) => s + Number(t.amount), 0);
        }
        trendData.push(entry);
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
        const label = d.toLocaleDateString("en-GB", { month: "short" });
        const entry: any = { label };
        for (const p of profiles) {
          entry[p.display_name] = rows
            .filter(t => t.user_id === p.id && t.transaction_date.startsWith(key))
            .reduce((s, t) => s + Number(t.amount), 0);
        }
        trendData.push(entry);
      }
    }

    return { totalPerUser, combined, categoryBreakdown, trendData };
  }, [allTransactions, period, filterUserId, profiles]);

  const hasData = stats.combined > 0;

  return (
    <div className="flex flex-col gap-5 px-4 pb-10">
      {/* Period tabs */}
      <div className="flex gap-1">
        {PERIODS.map(({ value, label }) => (
          <button key={value} type="button" onClick={() => setPeriod(value)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-semibold transition",
              period === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >{label}</button>
        ))}
      </div>

      {/* User filter */}
      <div className="flex gap-1">
        <button type="button" onClick={() => setFilterUserId(undefined)}
          className={cn("flex-1 rounded-lg py-1.5 text-xs font-medium transition border",
            !filterUserId ? "bg-foreground text-background border-foreground" : "bg-card border-border text-muted-foreground hover:bg-muted")}
        >Both</button>
        {profiles.map((p) => (
          <button key={p.id} type="button" onClick={() => setFilterUserId(p.id)}
            className={cn("flex-1 rounded-lg py-1.5 text-xs font-medium transition border",
              filterUserId === p.id ? "border-primary bg-primary-soft text-primary" : "bg-card border-border text-muted-foreground hover:bg-muted")}
          >{p.display_name}</button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {profiles.map((p) => (
          <StatCard key={p.id} title={p.display_name} value={formatIDR(stats.totalPerUser[p.id] ?? 0)}
            icon={TrendingDown} iconColor="bg-destructive/10" sub="spent" />
        ))}
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <p className="font-medium">No expense data</p>
          <p className="text-xs">Start adding transactions to see your spending breakdown.</p>
        </div>
      ) : (
        <>
          {/* Pie chart — category breakdown */}
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold mb-4">Spending by category</p>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.categoryBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={2}
                  >
                    {stats.categoryBreakdown.map((entry) => (
                      <Cell key={entry.category} fill={CAT_COLORS[entry.category] ?? "#ccc"} />
                    ))}
                  </Pie>
                  <RTooltip content={<PieTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-col gap-1.5 w-full md:w-auto">
                {stats.categoryBreakdown.map(({ category, amount }) => (
                  <div key={category} className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full shrink-0" style={{ background: CAT_COLORS[category] ?? "#ccc" }} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {CATEGORY_CONFIG[category]?.label ?? category}
                      </span>
                    </div>
                    <span className="text-xs font-medium">{formatIDR(amount, { compact: true })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar chart — trend */}
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold mb-4">Spending trend</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.trendData} barSize={14} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v === 0 ? "0" : `${Math.round(v / 1000)}K`}
                  width={36}
                />
                <RTooltip content={<BarTooltipContent />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                {profiles.map((p) => (
                  <Bar key={p.id} dataKey={p.display_name}
                    fill={profileColors[p.id] ?? "#ccc"}
                    radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
