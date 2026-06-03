// Bootstrap script — creates couple, 2 auth users, profiles, and goal
// on a fresh Supabase project. Idempotent (safe to re-run).
//
// Usage: pnpm setup
//
// Requires .env.local with:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Prerequisite: schema.sql must already be run in the Supabase SQL Editor.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("  Set them in .env.local and re-run with: pnpm setup");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const COUPLE_ID = "c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0";
const ABIEKA = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  email: "abieka@couplecash.app",
  password: "021204",
  username: "abieka",
  display_name: "Abieka",
  role: "admin",
  avatar_color: "#FF8B7B",
};
const SEMMA = {
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  email: "semma@couplecash.app",
  password: "060605",
  username: "semma",
  display_name: "Semma",
  role: "member",
  avatar_color: "#7DB9DE",
};

async function preflight() {
  const { error } = await supabase.from("couples").select("id").limit(1);
  if (error?.code === "PGRST205" || /not find the table/.test(error?.message || "")) {
    console.error("✗ Table 'public.couples' missing — schema.sql has not been run.");
    console.error("");
    console.error("  Open your Supabase dashboard:");
    console.error("    https://supabase.com/dashboard/project/" + projectRef());
    console.error("  → SQL Editor → New query");
    console.error("  → paste the entire contents of supabase/schema.sql");
    console.error("  → click Run, then re-run: pnpm setup");
    process.exit(1);
  }
  if (error) throw error;
}

function projectRef() {
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return "<your-project>";
  }
}

async function ensureCouple() {
  process.stdout.write("→ couple … ");
  const { error } = await supabase
    .from("couples")
    .upsert({ id: COUPLE_ID, name: "Abieka & Semma" }, { onConflict: "id" });
  if (error) throw error;
  console.log("ok");
}

async function ensureUser(u) {
  process.stdout.write(`→ user ${u.username} … `);
  // Try lookup by id first
  const found = await supabase.auth.admin.getUserById(u.id);
  if (found.data?.user) {
    console.log("already exists");
    return;
  }
  const { error } = await supabase.auth.admin.createUser({
    user_id: u.id, // Some Supabase versions ignore this — that's OK, we'll match by id below
    id: u.id,
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { username: u.username },
  });
  if (error) {
    // If user with same email exists, find them
    if (/already/i.test(error.message)) {
      const list = await supabase.auth.admin.listUsers();
      const existing = list.data?.users.find((x) => x.email === u.email);
      if (existing) {
        console.log(`exists with id ${existing.id} (will use that id)`);
        u.id = existing.id;
        return;
      }
    }
    throw error;
  }
  console.log("created");
}

async function ensureProfile(u) {
  process.stdout.write(`→ profile ${u.username} … `);
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: u.id,
        couple_id: COUPLE_ID,
        username: u.username,
        display_name: u.display_name,
        role: u.role,
        avatar_color: u.avatar_color,
      },
      { onConflict: "id" },
    );
  if (error) throw error;
  console.log("ok");
}

async function ensureGoal() {
  process.stdout.write("→ saving_goal … ");
  const { error } = await supabase
    .from("saving_goal")
    .upsert(
      { couple_id: COUPLE_ID, title: "Our shared goal", target_amount: 10000000 },
      { onConflict: "couple_id" },
    );
  if (error) throw error;
  console.log("ok");
}

async function verify() {
  const tables = ["couples", "profiles", "saving_goal", "transactions", "recurring_templates"];
  console.log("\nVerification:");
  for (const t of tables) {
    const { count, error } = await supabase
      .from(t)
      .select("*", { count: "exact", head: true });
    if (error) console.log(`  ✗ ${t}: ${error.message}`);
    else console.log(`  ${count > 0 || ["transactions", "recurring_templates"].includes(t) ? "✓" : "·"} ${t}: ${count} rows`);
  }
  const { data: users } = await supabase.auth.admin.listUsers();
  console.log(`  ✓ auth.users: ${users?.users.length ?? 0} rows`);
}

(async () => {
  console.log(`Bootstrapping ${url}\n`);
  await preflight();
  await ensureCouple();
  await ensureUser(ABIEKA);
  await ensureUser(SEMMA);
  await ensureProfile(ABIEKA);
  await ensureProfile(SEMMA);
  await ensureGoal();
  await verify();
  console.log("\n✓ Bootstrap complete. You can now log in with:");
  console.log(`  username: abieka  password: ${ABIEKA.password}  (admin)`);
  console.log(`  username: semma   password: ${SEMMA.password}`);
})().catch((e) => {
  console.error("\n✗ Failed:", e.message || e);
  if (e.details) console.error("  details:", e.details);
  process.exit(1);
});
