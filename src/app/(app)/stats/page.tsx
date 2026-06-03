import { getCurrentUser } from "@/lib/auth";
import { getProfiles, listTransactions } from "@/features/transactions/service";
import { PageHeader } from "@/components/page-header";
import { StatsClient } from "./stats-client";

export default async function StatsPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const [profiles, allTransactions] = await Promise.all([
    getProfiles(session.profile.couple_id),
    listTransactions({ period: "all" }),
  ]);

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full pt-4">
      <PageHeader title="Stats" className="pb-0" />
      <StatsClient profiles={profiles} allTransactions={allTransactions} />
    </div>
  );
}
