import { createClient } from "@/lib/supabase/server";
import type { RecurringTemplate } from "@/types/database";

export async function listTemplates(coupleId: string): Promise<RecurringTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_templates")
    .select("*")
    .eq("couple_id", coupleId)
    .order("day_of_month");
  if (error) throw error;
  return data as RecurringTemplate[];
}

export async function createTemplate(
  input: Omit<RecurringTemplate, "id" | "last_run_date" | "created_at" | "updated_at">,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_templates")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as RecurringTemplate;
}

export async function updateTemplate(
  id: string,
  input: Partial<Pick<RecurringTemplate, "type" | "category" | "amount" | "note" | "day_of_month" | "active" | "user_id">>,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_templates")
    .update(input)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_templates")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function markRun(id: string, date: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_templates")
    .update({ last_run_date: date })
    .eq("id", id);
  if (error) throw error;
}
