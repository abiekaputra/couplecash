import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-6 max-w-lg mx-auto w-full">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-28" />
        </div>
        <Skeleton className="size-9 rounded-full" />
      </div>

      {/* Section label */}
      <div>
        <Skeleton className="h-3 w-16 mb-2" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>

      {/* Savings */}
      <Skeleton className="h-28 rounded-xl" />

      {/* Today */}
      <div>
        <Skeleton className="h-3 w-14 mb-2" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>

      {/* This month */}
      <div>
        <Skeleton className="h-3 w-20 mb-2" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-12 rounded-xl mt-3" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-11 rounded-xl" />
        <Skeleton className="h-11 rounded-xl" />
      </div>
    </div>
  );
}
