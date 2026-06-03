import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryLoading() {
  return (
    <div className="flex flex-col gap-1 max-w-lg mx-auto w-full px-4 pt-4">
      <Skeleton className="h-6 w-24 mb-1" />
      <Skeleton className="h-3 w-28 mb-4" />
      <Skeleton className="h-10 rounded-xl mb-3" />
      <div className="flex gap-1 mb-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="flex-1 h-8 rounded-lg" />)}
      </div>
      <Skeleton className="h-3 w-12 mb-2" />
      <div className="rounded-xl border overflow-hidden divide-y">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <Skeleton className="size-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
