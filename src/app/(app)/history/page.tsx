import { getCurrentUser } from "@/lib/auth";
import { listTransactions } from "@/features/transactions/service";
import { PageHeader } from "@/components/page-header";
import { TransactionList } from "./transaction-list";

export default async function HistoryPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  // Fetch all — client component handles period/search filtering in memory
  const transactions = await listTransactions({ period: "all" });

  return (
    <div className="flex flex-col gap-1 max-w-lg mx-auto w-full">
      <PageHeader
        title="History"
        subtitle={`${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`}
        className="pb-3"
      />
      <TransactionList
        initial={transactions}
        currentUserId={session.userId}
        isAdmin={session.profile.role === "admin"}
      />
    </div>
  );
}
