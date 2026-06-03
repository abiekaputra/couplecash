import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, profile:profiles!transactions_user_id_fkey(display_name, username)")
    .eq("couple_id", session.profile.couple_id)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return new NextResponse("Failed to fetch data", { status: 500 });
  }

  const headers = ["Date", "User", "Type", "Category", "Amount (IDR)", "Note", "Created At"];
  const rows = (data ?? []).map((tx: any) => [
    tx.transaction_date,
    tx.profile?.display_name ?? tx.profile?.username ?? tx.user_id,
    tx.type,
    tx.category,
    tx.amount,
    tx.note ?? "",
    tx.created_at?.slice(0, 19).replace("T", " ") ?? "",
  ]);

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row: (string | number | null)[]) => row.map(escapeCsv).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="couplecash-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
