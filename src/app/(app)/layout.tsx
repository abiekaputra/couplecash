import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/nav/sidebar";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Fab } from "@/components/nav/fab";
import { ToastProvider } from "@/components/toast-provider";
import { RecurringRunner } from "@/components/recurring-runner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  return (
    <>
      <ToastProvider />
      <RecurringRunner />
      <Sidebar profile={session.profile} />

      <div className="flex flex-col min-h-screen md:pl-56">
        <main className="flex-1 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      <Fab />
      <BottomNav />
    </>
  );
}
