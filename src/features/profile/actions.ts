"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/features/transactions/actions";
import type { Profile } from "@/types/database";

export async function updateDisplayNameAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: "Not authenticated" };

  const name = String(formData.get("display_name") ?? "").trim();
  if (!name) return { success: false, error: "Name cannot be empty" };
  if (name.length > 40) return { success: false, error: "Name too long (max 40)" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name })
    .eq("id", session.userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}

export async function changePasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: "Not authenticated" };

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 6) return { success: false, error: "Password must be at least 6 characters" };
  if (password !== confirm) return { success: false, error: "Passwords do not match" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { success: false, error: error.message };

  return { success: true };
}
