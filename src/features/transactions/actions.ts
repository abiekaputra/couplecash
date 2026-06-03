"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createTransaction, updateTransaction, deleteTransaction, getProfiles } from "./service";
import { transactionSchema, updateTransactionSchema } from "./schema";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function addTransactionAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: "Not authenticated" };

  const raw = {
    type: formData.get("type"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    note: formData.get("note") ?? "",
    transaction_date: formData.get("transaction_date"),
    // target_user_id from form — server will verify it belongs to the couple
    target_user_id: formData.get("target_user_id") ?? session.userId,
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const targetUserId = parsed.data.target_user_id;

  // Verify target user actually belongs to the same couple
  const profiles = await getProfiles(session.profile.couple_id);
  const targetProfile = profiles.find((p) => p.id === targetUserId);
  if (!targetProfile) {
    return { success: false, error: "Invalid user" };
  }

  // Non-admin can only submit for themselves
  if (targetUserId !== session.userId && session.profile.role !== "admin") {
    return { success: false, error: "Only admin can submit for another user" };
  }

  // Saving category: admin only
  if (parsed.data.category === "saving" && session.profile.role !== "admin") {
    return { success: false, error: "Only admin can add saving transactions" };
  }

  await createTransaction({
    couple_id: session.profile.couple_id,
    user_id: targetUserId,
    type: parsed.data.type,
    category: parsed.data.category,
    amount: parsed.data.amount,
    note: parsed.data.note || null,
    transaction_date: parsed.data.transaction_date,
    created_by: session.userId,
  });

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/savings");
  return { success: true };
}

export async function updateTransactionAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: "Not authenticated" };

  const raw = {
    id: formData.get("id"),
    type: formData.get("type"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    note: formData.get("note") ?? "",
    transaction_date: formData.get("transaction_date"),
    target_user_id: formData.get("target_user_id") ?? session.userId,
  };

  const parsed = updateTransactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, ...update } = parsed.data;
  await updateTransaction(id!, {
    type: update.type,
    category: update.category,
    amount: update.amount,
    note: update.note || null,
    transaction_date: update.transaction_date,
  });

  revalidatePath("/");
  revalidatePath("/history");
  return { success: true };
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: "Not authenticated" };

  await deleteTransaction(id);

  revalidatePath("/");
  revalidatePath("/history");
  return { success: true };
}
