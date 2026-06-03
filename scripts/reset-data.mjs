// Reset semua data transaksi + saving goal ke default
// Credentials (profiles, auth.users) tetap utuh.
// Usage: pnpm reset-data

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing env vars. Run with: pnpm reset-data");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const COUPLE_ID = "c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0";

(async () => {
  console.log("Resetting all transaction data...\n");

  // 1. Delete all transactions
  const { error: txErr, count } = await supabase
    .from("transactions")
    .delete()
    .eq("couple_id", COUPLE_ID);
  if (txErr) { console.error("transactions:", txErr.message); process.exit(1); }
  console.log(`✓ Deleted all transactions`);

  // 2. Delete all recurring templates
  const { error: recErr } = await supabase
    .from("recurring_templates")
    .delete()
    .eq("couple_id", COUPLE_ID);
  if (recErr) { console.error("recurring_templates:", recErr.message); process.exit(1); }
  console.log("✓ Deleted all recurring templates");

  // 3. Reset saving goal to default
  const { error: goalErr } = await supabase
    .from("saving_goal")
    .update({ title: "Our shared goal", target_amount: 10000000 })
    .eq("couple_id", COUPLE_ID);
  if (goalErr) { console.error("saving_goal:", goalErr.message); process.exit(1); }
  console.log("✓ Reset saving goal → 'Our shared goal' Rp 10.000.000");

  // 4. Verify
  const { count: remaining } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true });
  console.log(`\nVerification: ${remaining} transactions remaining (should be 0)`);
  console.log("\n✓ Done. Login credentials untouched.");
  console.log("  abieka / 021204  (admin)");
  console.log("  semma  / 060605");
})();
