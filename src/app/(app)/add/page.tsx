import { getCurrentUser } from "@/lib/auth";
import { getProfiles } from "@/features/transactions/service";
import { AddForm } from "./add-form";

export default async function AddPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const profiles = await getProfiles(session.profile.couple_id);

  return <AddForm profiles={profiles} currentUser={session.profile} />;
}
