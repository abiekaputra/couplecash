import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardValue, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconColor,
  trend,
  className,
  loading,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32 mt-1" />
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {Icon && (
            <div className={cn("rounded-full p-1.5", iconColor ?? "bg-muted")}>
              <Icon className="size-3.5 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardValue>{value}</CardValue>
      </CardHeader>
      {(sub || trend) && (
        <CardContent>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {sub && <span>{sub}</span>}
            {trend && (
              <span
                className={cn(
                  "font-medium",
                  trend.positive ? "text-accent-foreground" : "text-destructive",
                )}
              >
                {trend.positive ? "↑" : "↓"} {trend.value}
              </span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
