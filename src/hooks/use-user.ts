"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface UserState {
  userId: string | null;
  profile: Profile | null;
  loading: boolean;
}

/**
 * Client-side hook — reads the current session + profile.
 * Use only in Client Components. For Server Components use getCurrentUser() instead.
 */
export function useUser(): UserState {
  const [state, setState] = useState<UserState>({
    userId: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({ userId: null, profile: null, loading: false });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setState({
        userId: user.id,
        profile: profile as Profile | null,
        loading: false,
      });
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
