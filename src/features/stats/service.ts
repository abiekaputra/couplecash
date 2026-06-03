import { createClient } from "@/lib/supabase/server";
import type { Transaction, Profile } from "@/types/database";

export type StatsPeriod = "week" | "month" | "all";

type TxRow = Pick<Transaction, "user_id" | "type" | "category" | "amount" | "transaction_date">;

export interface StatsData {
  totalPerUser: Record<string, number>;
  combined: number;
  categoryBreakdown: { category: string; amount: number }[];
  trendData: { label: string; [key: string]: number | string }[];
}

function getPeriodFrom(period: StatsPeriod): string | null {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  if (period === "month") {
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  }
  // all: last 6 months
  const d = new Date(now);
  d.setMonth(d.getMonth() - 5);
  d.setDate(1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

export async function getStatsData(
  coupleId: string,
  period: StatsPeriod,
  profiles: Profile[],
  filterUserId?: string,
): Promise<StatsData> {
  const supabase = await createClient();
  const from = getPeriodFrom(period);

  let query = supabase
    .from("transactions")
    .select("user_id, type, category, amount, transaction_date")
    .eq("couple_id", coupleId)
    .eq("type", "expense")
    .neq("category", "saving");

  if (from) query = query.gte("transaction_date", from);
  if (filterUserId) query = query.eq("user_id", filterUserId);

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as TxRow[];

  // Total per user
  const totalPerUser: Record<string, number> = {};
  for (const p of profiles) totalPerUser[p.id] = 0;
  for (const tx of rows) {
    totalPerUser[tx.user_id] = (totalPerUser[tx.user_id] ?? 0) + Number(tx.amount);
  }
  const combined = Object.values(totalPerUser).reduce((a, b) => a + b, 0);

  // Category breakdown
  const catMap: Record<string, number> = {};
  for (const tx of rows) {
    catMap[tx.category] = (catMap[tx.category] ?? 0) + Number(tx.amount);
  }
  const categoryBreakdown = Object.entries(catMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Trend data
  const trendData = buildTrend(rows, profiles, period);

  return { totalPerUser, combined, categoryBreakdown, trendData };
}

function buildTrend(
  rows: TxRow[],
  profiles: Profile[],
  period: StatsPeriod,
): { label: string; [key: string]: number | string }[] {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  if (period === "week") {
    // Last 7 days
    const days: { label: string; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const label = d.toLocaleDateString("en-GB", { weekday: "short" });
      days.push({ label, date: key });
    }
    return days.map(({ label, date }) => {
      const entry: { label: string; [key: string]: number | string } = { label };
      for (const p of profiles) {
        entry[p.display_name] = rows
          .filter(t => t.user_id === p.id && t.transaction_date === date)
          .reduce((s, t) => s + Number(t.amount), 0);
      }
      return entry;
    });
  }

  if (period === "month") {
    // 4 weeks of the current month
    const weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4"];
    return weekLabels.map((label, wi) => {
      const start = wi * 7 + 1;
      const end = Math.min(start + 6, 31);
      const entry: { label: string; [key: string]: number | string } = { label };
      for (const p of profiles) {
        entry[p.display_name] = rows
          .filter(t => {
            if (t.user_id !== p.id) return false;
            const day = parseInt(t.transaction_date.slice(8), 10);
            return day >= start && day <= end;
          })
          .reduce((s, t) => s + Number(t.amount), 0);
      }
      return entry;
    });
  }

  // All: last 6 months
  const months: { label: string; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    const label = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    months.push({ label, key });
  }
  return months.map(({ label, key }) => {
    const entry: { label: string; [key: string]: number | string } = { label };
    for (const p of profiles) {
      entry[p.display_name] = rows
        .filter(t => t.user_id === p.id && t.transaction_date.startsWith(key))
        .reduce((s, t) => s + Number(t.amount), 0);
    }
    return entry;
  });
}
