import { getCurrentUser } from "@/lib/auth";
import { getSavingsHistory, getSavingGoal, computeSavingsStats } from "@/features/savings/service";
import { getProfiles } from "@/features/transactions/service";
import { PageHeader } from "@/components/page-header";
import { SavingsClient } from "./savings-client";

export default async function SavingsPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const [movements, goal, profiles] = await Promise.all([
    getSavingsHistory(session.profile.couple_id),
    getSavingGoal(session.profile.couple_id),
    getProfiles(session.profile.couple_id),
  ]);

  const { netTotal, contributions } = computeSavingsStats(movements, profiles);

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full pt-4">
      <PageHeader title="Savings" subtitle={goal?.title} className="pb-0" />
      <SavingsClient
        goal={goal}
        netTotal={netTotal}
        contributions={contributions}
        movements={movements}
        profiles={profiles}
        isAdmin={session.profile.role === "admin"}
      />
    </div>
  );
}
