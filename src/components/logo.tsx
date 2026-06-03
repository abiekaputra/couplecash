import { cn } from "@/lib/utils";

type LogoVariant = "full" | "mark" | "wordmark";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  markClassName?: string;
  textClassName?: string;
}

export function Logo({
  variant = "full",
  className,
  markClassName,
  textClassName,
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {variant !== "wordmark" && <LogoMark className={markClassName} />}
      {variant !== "mark" && (
        <span
          className={cn(
            "text-xl font-semibold tracking-tight text-foreground",
            textClassName,
          )}
        >
          Couple<span className="text-primary">Cash</span>
        </span>
      )}
    </div>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-8 shrink-0", className)}
      role="img"
      aria-label="CoupleCash"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="cc-coral" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB1A3" />
          <stop offset="100%" stopColor="#FF7867" />
        </linearGradient>
        <linearGradient id="cc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A7D2EC" />
          <stop offset="100%" stopColor="#5BA4D2" />
        </linearGradient>
      </defs>
      {/* Left half of heart — coral */}
      <path
        d="M 32 13.6 C 29 10, 24.6 8, 20 8 C 11.8 8, 5.3 14.4, 5.3 22.7 C 5.3 32.7, 14.4 41, 28.1 53.4 L 32 57 L 32 13.6 Z"
        fill="url(#cc-coral)"
      />
      {/* Right half of heart — sky */}
      <path
        d="M 32 13.6 C 35 10, 39.4 8, 44 8 C 52.2 8, 58.7 14.4, 58.7 22.7 C 58.7 32.7, 49.6 41, 35.9 53.4 L 32 57 L 32 13.6 Z"
        fill="url(#cc-sky)"
      />
      {/* Coin slot — ties it to "Cash" (piggy bank), not just couple */}
      <rect
        x="22"
        y="29"
        width="20"
        height="3.5"
        rx="1.75"
        fill="#FFF8F1"
        opacity="0.92"
      />
    </svg>
  );
}
