import {
  Utensils, ShoppingBag, Car, Smile,
  Zap, PiggyBank, Banknote, LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryConfig {
  icon: LucideIcon;
  bg: string;
  text: string;
  label: string;
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  food:      { icon: Utensils,    bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", label: "Food" },
  shop:      { icon: ShoppingBag, bg: "bg-rose-100 dark:bg-rose-900/30",    text: "text-rose-600 dark:text-rose-400",    label: "Shop" },
  transport: { icon: Car,         bg: "bg-sky-100 dark:bg-sky-900/30",      text: "text-sky-600 dark:text-sky-400",      label: "Transport" },
  fun:       { icon: Smile,       bg: "bg-purple-100 dark:bg-purple-900/30",text: "text-purple-600 dark:text-purple-400",label: "Fun" },
  bills:     { icon: Zap,         bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-600 dark:text-amber-400",  label: "Bills" },
  saving:    { icon: PiggyBank,   bg: "bg-accent/20",                       text: "text-accent-foreground",              label: "Saving" },
  income:    { icon: Banknote,    bg: "bg-accent/20",                       text: "text-accent-foreground",              label: "Income" },
};

export function CategoryIcon({
  category,
  size = "md",
}: {
  category: string;
  size?: "sm" | "md" | "lg";
}) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.income;
  const Icon = cfg.icon;

  const sizeMap = {
    sm: { wrap: "size-7", icon: "size-3.5" },
    md: { wrap: "size-9", icon: "size-4" },
    lg: { wrap: "size-11", icon: "size-5" },
  };

  return (
    <div className={cn("rounded-xl flex items-center justify-center shrink-0", cfg.bg, sizeMap[size].wrap)}>
      <Icon className={cn(cfg.text, sizeMap[size].icon)} />
    </div>
  );
}
