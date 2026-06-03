import { createClient } from "@/lib/supabase/server";
import type {
  Transaction, TransactionInsert, TransactionUpdate,
  Profile, SavingGoal,
} from "@/types/database";

export type TransactionFilters = {
  period?: "today" | "week" | "month" | "all";
  userId?: string;
  category?: string;
  search?: string;
};

function getPeriodRange(period: TransactionFilters["period"]) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  if (period === "today") return { from: today, to: today };

  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    const from = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { from, to: today };
  }

  if (period === "month") {
    const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    return { from, to: today };
  }

  return null;
}

export function todayString() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export async function listTransactions(filters: TransactionFilters = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("*, profile:profiles!transactions_user_id_fkey(display_name, avatar_color, username)")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  const range = getPeriodRange(filters.period ?? "all");
  if (range) {
    query = query.gte("transaction_date", range.from).lte("transaction_date", range.to);
  }
  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.search) query = query.ilike("note", `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data as (Transaction & {
    profile: { display_name: string; avatar_color: string | null; username: string };
  })[];
}

export async function createTransaction(input: TransactionInsert) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Transaction;
}

export async function updateTransaction(id: string, input: TransactionUpdate) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}

// ─── Dashboard helpers ────────────────────────────────────────────────────────

export async function getProfiles(coupleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("couple_id", coupleId);
  if (error) throw error;
  return data as Profile[];
}

export async function getSavingGoal(coupleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saving_goal")
    .select("*")
    .eq("couple_id", coupleId)
    .single();
  if (error) throw error;
  return data as SavingGoal;
}

/** Dynamic balance per user: income - expense (including saving deposits/withdrawals) */
export async function getBalances(coupleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("user_id, type, category, amount")
    .eq("couple_id", coupleId);
  if (error) throw error;

  const balanceMap: Record<string, number> = {};
  let savingsTotal = 0;

  for (const tx of data ?? []) {
    if (!balanceMap[tx.user_id]) balanceMap[tx.user_id] = 0;
    if (tx.type === "income") {
      balanceMap[tx.user_id] += Number(tx.amount);
      if (tx.category === "saving") savingsTotal -= Number(tx.amount);
    } else {
      balanceMap[tx.user_id] -= Number(tx.amount);
      if (tx.category === "saving") savingsTotal += Number(tx.amount);
    }
  }

  return { balanceMap, savingsTotal: Math.max(0, savingsTotal) };
}

/** Monthly spend (expense, not saving) per user + top category */
export async function getMonthlySpend(coupleId: string) {
  const supabase = await createClient();
  const from = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("transactions")
    .select("user_id, category, amount")
    .eq("couple_id", coupleId)
    .eq("type", "expense")
    .neq("category", "saving")
    .gte("transaction_date", from);
  if (error) throw error;

  const spendMap: Record<string, number> = {};
  const categoryMap: Record<string, number> = {};

  for (const tx of data ?? []) {
    spendMap[tx.user_id] = (spendMap[tx.user_id] ?? 0) + Number(tx.amount);
    categoryMap[tx.category] = (categoryMap[tx.category] ?? 0) + Number(tx.amount);
  }

  const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0] ?? null;
  return { spendMap, topCategory };
}

/** Today's spend per user */
export async function getTodaySpend(coupleId: string) {
  const supabase = await createClient();
  const today = todayString();

  const { data, error } = await supabase
    .from("transactions")
    .select("user_id, amount")
    .eq("couple_id", coupleId)
    .eq("type", "expense")
    .neq("category", "saving")
    .eq("transaction_date", today);
  if (error) throw error;

  const todayMap: Record<string, number> = {};
  for (const tx of data ?? []) {
    todayMap[tx.user_id] = (todayMap[tx.user_id] ?? 0) + Number(tx.amount);
  }
  return todayMap;
}
