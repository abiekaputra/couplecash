"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  listTemplates, createTemplate,
  updateTemplate, deleteTemplate, markRun,
} from "./service";
import { createTransaction } from "@/features/transactions/service";
import type { ActionResult } from "@/features/transactions/actions";
import type { RecurringTemplate } from "@/types/database";

function adminOnly(session: Awaited<ReturnType<typeof getCurrentUser>>): ActionResult | null {
  if (!session) return { success: false, error: "Not authenticated" };
  if (session.profile.role !== "admin") return { success: false, error: "Admin only" };
  return null;
}

export async function createTemplateAction(formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser();
  const guard = adminOnly(session);
  if (guard) return guard;

  const amount = Number(String(formData.get("amount") ?? "0").replace(/[^0-9]/g, ""));
  if (amount <= 0) return { success: false, error: "Amount must be > 0" };
  const day = parseInt(String(formData.get("day_of_month") ?? "1"), 10);
  if (day < 1 || day > 28) return { success: false, error: "Day must be 1–28" };

  await createTemplate({
    couple_id: session!.profile.couple_id,
    user_id: String(formData.get("user_id") ?? session!.userId),
    type: String(formData.get("type") ?? "expense") as "income" | "expense",
    category: String(formData.get("category") ?? "bills") as RecurringTemplate["category"],
    amount,
    note: String(formData.get("note") ?? "").trim() || null,
    day_of_month: day,
    active: true,
    created_by: session!.userId,
  });

  revalidatePath("/settings/recurring");
  return { success: true };
}

export async function toggleTemplateAction(id: string, active: boolean): Promise<ActionResult> {
  const session = await getCurrentUser();
  const guard = adminOnly(session);
  if (guard) return guard;

  await updateTemplate(id, { active });
  revalidatePath("/settings/recurring");
  return { success: true };
}

export async function deleteTemplateAction(id: string): Promise<ActionResult> {
  const session = await getCurrentUser();
  const guard = adminOnly(session);
  if (guard) return guard;

  await deleteTemplate(id);
  revalidatePath("/settings/recurring");
  return { success: true };
}

/**
 * Called client-side on app open.
 * Inserts transactions for any due templates and updates last_run_date.
 */
export async function runDueRecurringAction(): Promise<{ ran: number }> {
  const session = await getCurrentUser();
  if (!session) return { ran: 0 };

  const now = new Date();
  const today = now.getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(today)}`;
  const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;

  const templates = await listTemplates(session.profile.couple_id);
  let ran = 0;

  for (const tpl of templates) {
    if (!tpl.active) continue;
    if (tpl.day_of_month > today) continue;
    // Already ran this month?
    if (tpl.last_run_date && tpl.last_run_date >= monthStart) continue;

    // Build transaction date = this month's due day (capped to today if past)
    const dueDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(tpl.day_of_month)}`;

    await createTransaction({
      couple_id: session.profile.couple_id,
      user_id: tpl.user_id,
      type: tpl.type,
      category: tpl.category,
      amount: tpl.amount,
      note: tpl.note ? `${tpl.note} (auto)` : "Recurring (auto)",
      transaction_date: dueDate,
      created_by: session.userId,
    });

    await markRun(tpl.id, todayStr);
    ran++;
  }

  if (ran > 0) {
    revalidatePath("/");
    revalidatePath("/history");
  }

  return { ran };
}
