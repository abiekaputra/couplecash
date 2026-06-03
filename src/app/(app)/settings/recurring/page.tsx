import { getCurrentUser } from "@/lib/auth";
import { listTemplates } from "@/features/recurring/service";
import { getProfiles } from "@/features/transactions/service";
import { PageHeader } from "@/components/page-header";
import { RecurringClient } from "./recurring-client";
import { redirect } from "next/navigation";

export default async function RecurringPage() {
  const session = await getCurrentUser();
  if (!session) return null;
  if (session.profile.role !== "admin") redirect("/settings");

  const [templates, profiles] = await Promise.all([
    listTemplates(session.profile.couple_id),
    getProfiles(session.profile.couple_id),
  ]);

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full pt-4">
      <PageHeader title="Recurring" subtitle="Auto-inserted monthly" className="pb-0" />
      <RecurringClient
        templates={templates}
        profiles={profiles}
        currentUserId={session.userId}
      />
    </div>
  );
}
