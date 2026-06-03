import { createClient } from "@/lib/supabase/server";
import type { Transaction, SavingGoal, Profile } from "@/types/database";

export type SavingMovement = Transaction & {
  profile: { display_name: string; avatar_color: string | null };
};

/** All saving-category transactions ordered by date desc */
export async function getSavingsHistory(coupleId: string): Promise<SavingMovement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, profile:profiles!transactions_user_id_fkey(display_name, avatar_color)")
    .eq("couple_id", coupleId)
    .eq("category", "saving")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as SavingMovement[];
}

/** Per-user deposit totals and net savings balance */
export function computeSavingsStats(
  movements: SavingMovement[],
  profiles: Profile[],
) {
  const depositMap: Record<string, number> = {};
  let netTotal = 0;

  for (const mv of movements) {
    if (mv.type === "expense") {
      // deposit: saldo user turun, savings naik
      depositMap[mv.user_id] = (depositMap[mv.user_id] ?? 0) + Number(mv.amount);
      netTotal += Number(mv.amount);
    } else {
      // withdraw: saldo user naik, savings turun
      depositMap[mv.user_id] = (depositMap[mv.user_id] ?? 0) - Number(mv.amount);
      netTotal -= Number(mv.amount);
    }
  }

  netTotal = Math.max(0, netTotal);

  const contributions = profiles.map((p) => ({
    profile: p,
    amount: Math.max(0, depositMap[p.id] ?? 0),
    pct: netTotal > 0
      ? Math.round(((Math.max(0, depositMap[p.id] ?? 0)) / netTotal) * 100)
      : 0,
  }));

  return { netTotal, contributions };
}

export async function getSavingGoal(coupleId: string): Promise<SavingGoal | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saving_goal")
    .select("*")
    .eq("couple_id", coupleId)
    .single();
  if (error) return null;
  return data as SavingGoal;
}

export async function updateGoal(
  coupleId: string,
  input: { title?: string; target_amount?: number },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("saving_goal")
    .update(input)
    .eq("couple_id", coupleId);
  if (error) throw error;
}
