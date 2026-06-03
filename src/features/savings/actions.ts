"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createTransaction, getProfiles, getBalances } from "@/features/transactions/service";
import { updateGoal, getSavingsHistory, computeSavingsStats } from "./service";
import type { ActionResult } from "@/features/transactions/actions";

/** Admin only — deposit saving on behalf of any couple member */
export async function depositAction(formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: "Not authenticated" };
  if (session.profile.role !== "admin") return { success: false, error: "Admin only" };

  const targetUserId = String(formData.get("target_user_id") ?? "");
  const rawAmount = Number(String(formData.get("amount") ?? "0").replace(/[^0-9]/g, ""));
  const note = String(formData.get("note") ?? "").trim();
  const date = String(formData.get("transaction_date") ?? new Date().toISOString().slice(0, 10));

  if (!targetUserId) return { success: false, error: "Select a user" };
  if (rawAmount <= 0) return { success: false, error: "Amount must be greater than 0" };

  const profiles = await getProfiles(session.profile.couple_id);
  if (!profiles.find((p) => p.id === targetUserId)) {
    return { success: false, error: "Invalid user" };
  }

  await createTransaction({
    couple_id: session.profile.couple_id,
    user_id: targetUserId,
    type: "expense",
    category: "saving",
    amount: rawAmount,
    note: note || null,
    transaction_date: date,
    created_by: session.userId,
  });

  revalidatePath("/savings");
  revalidatePath("/");
  return { success: true };
}

/** Admin only — withdraw saving back to user balance */
export async function withdrawAction(formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: "Not authenticated" };
  if (session.profile.role !== "admin") return { success: false, error: "Admin only" };

  const targetUserId = String(formData.get("target_user_id") ?? "");
  const rawAmount = Number(String(formData.get("amount") ?? "0").replace(/[^0-9]/g, ""));
  const note = String(formData.get("note") ?? "").trim();
  const date = String(formData.get("transaction_date") ?? new Date().toISOString().slice(0, 10));

  if (!targetUserId) return { success: false, error: "Select a user" };
  if (rawAmount <= 0) return { success: false, error: "Amount must be greater than 0" };

  const profiles = await getProfiles(session.profile.couple_id);
  if (!profiles.find((p) => p.id === targetUserId)) {
    return { success: false, error: "Invalid user" };
  }

  // Validate: cannot withdraw more than current net savings total
  const movements = await getSavingsHistory(session.profile.couple_id);
  const { netTotal } = computeSavingsStats(movements, profiles);
  if (rawAmount > netTotal) {
    return {
      success: false,
      error: `Cannot withdraw more than current savings (${new Intl.NumberFormat("id-ID").format(netTotal)})`,
    };
  }

  await createTransaction({
    couple_id: session.profile.couple_id,
    user_id: targetUserId,
    type: "income",
    category: "saving",
    amount: rawAmount,
    note: note || null,
    transaction_date: date,
    created_by: session.userId,
  });

  revalidatePath("/savings");
  revalidatePath("/");
  return { success: true };
}

/** Admin only — update goal title and/or target */
export async function updateGoalAction(formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: "Not authenticated" };
  if (session.profile.role !== "admin") return { success: false, error: "Admin only" };

  const title = String(formData.get("title") ?? "").trim();
  const rawTarget = Number(
    String(formData.get("target_amount") ?? "0").replace(/[^0-9]/g, "")
  );

  if (!title) return { success: false, error: "Goal title is required" };
  if (rawTarget <= 0) return { success: false, error: "Target must be greater than 0" };

  await updateGoal(session.profile.couple_id, {
    title,
    target_amount: rawTarget,
  });

  revalidatePath("/savings");
  revalidatePath("/");
  return { success: true };
}
