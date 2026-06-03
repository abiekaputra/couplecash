import { Skeleton } from "@/components/ui/skeleton";

export default function StatsLoading() {
  return (
    <div className="flex flex-col gap-5 px-4 pt-4 max-w-lg mx-auto w-full">
      <Skeleton className="h-6 w-20" />
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="flex-1 h-8 rounded-lg" />)}
      </div>
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="flex-1 h-8 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-52 rounded-xl" />
      <Skeleton className="h-52 rounded-xl" />
    </div>
  );
}
