import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface Session {
  userId: string;
  email: string;
  profile: Profile;
}

/** Server-side: returns the current session + profile, or null if not authed. */
export async function getCurrentUser(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: profile as Profile,
  };
}
