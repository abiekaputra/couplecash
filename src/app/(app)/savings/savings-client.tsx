"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PiggyBank, Plus, Minus, Settings2 } from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import { Sheet } from "@/components/ui/sheet";
import { CategoryIcon } from "@/components/category-icon";
import { depositAction, withdrawAction, updateGoalAction } from "@/features/savings/actions";
import type { SavingGoal, Profile } from "@/types/database";
import type { SavingMovement } from "@/features/savings/service";

type Contribution = { profile: Profile; amount: number; pct: number };

interface SavingsClientProps {
  goal: SavingGoal | null;
  netTotal: number;
  contributions: Contribution[];
  movements: SavingMovement[];
  profiles: Profile[];
  isAdmin: boolean;
}

// ── Deposit/Withdraw form sheet ──────────────────────────────────────────────

function SavingActionSheet({
  mode,
  profiles,
  open,
  onClose,
}: {
  mode: "deposit" | "withdraw";
  profiles: Profile[];
  open: boolean;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [userId, setUserId] = useState(profiles[0]?.id ?? "");
  const [displayAmount, setDisplayAmount] = useState("");
  const [rawAmount, setRawAmount] = useState(0);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  function handleAmountInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const num = parseInt(raw || "0", 10);
    setRawAmount(num);
    setDisplayAmount(raw === "" ? "" : new Intl.NumberFormat("id-ID").format(num));
  }

  function handleSubmit() {
    setError(null);
    if (rawAmount <= 0) { setError("Enter an amount"); return; }
    const fd = new FormData();
    fd.append("target_user_id", userId);
    fd.append("amount", String(rawAmount));
    fd.append("note", note);
    fd.append("transaction_date", date);
    const action = mode === "deposit" ? depositAction : withdrawAction;
    startTransition(async () => {
      const result = await action(fd);
      if (!result.success) { setError(result.error); return; }
      toast.success(mode === "deposit" ? "Deposit recorded" : "Withdrawal recorded");
      setDisplayAmount(""); setRawAmount(0); setNote("");
      onClose();
    });
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === "deposit" ? "Deposit Saving" : "Withdraw Saving"}
    >
      <div className="flex flex-col gap-4 p-4">
        {/* User */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium">For</p>
          <div className="flex gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setUserId(p.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition",
                  userId === p.id ? "border-primary bg-primary-soft text-primary" : "bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                <div
                  className="size-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: p.avatar_color ?? "#ccc" }}
                >
                  {p.display_name.charAt(0)}
                </div>
                {p.display_name}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
          <input
            type="text" inputMode="numeric" placeholder="0"
            value={displayAmount} onChange={handleAmountInput}
            className="w-full rounded-xl border bg-card pl-10 pr-4 py-3.5 text-xl font-semibold outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>

        {/* Note */}
        <input
          type="text" placeholder="Note (optional)"
          value={note} onChange={(e) => setNote(e.target.value)} maxLength={200}
          className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />

        {/* Date */}
        <input
          type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />

        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
      </div>

      <div className="sticky bottom-0 bg-background border-t px-4 py-3">
        <button
          type="button" onClick={handleSubmit} disabled={pending}
          className={cn(
            "w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-60",
            mode === "deposit"
              ? "bg-accent text-accent-foreground hover:bg-accent/90"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/90",
          )}
        >
          {pending ? "Saving…" : mode === "deposit" ? "Record deposit" : "Record withdrawal"}
        </button>
      </div>
    </Sheet>
  );
}

// ── Edit goal sheet ──────────────────────────────────────────────────────────

function EditGoalSheet({
  goal,
  open,
  onClose,
}: {
  goal: SavingGoal | null;
  open: boolean;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(goal?.title ?? "Our shared goal");
  const [displayTarget, setDisplayTarget] = useState(
    goal ? new Intl.NumberFormat("id-ID").format(Number(goal.target_amount)) : ""
  );
  const [rawTarget, setRawTarget] = useState(Number(goal?.target_amount ?? 0));
  const [error, setError] = useState<string | null>(null);

  function handleTargetInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const num = parseInt(raw || "0", 10);
    setRawTarget(num);
    setDisplayTarget(raw === "" ? "" : new Intl.NumberFormat("id-ID").format(num));
  }

  function handleSave() {
    setError(null);
    if (!title.trim()) { setError("Title is required"); return; }
    if (rawTarget <= 0) { setError("Target must be greater than 0"); return; }
    const fd = new FormData();
    fd.append("title", title);
    fd.append("target_amount", String(rawTarget));
    startTransition(async () => {
      const result = await updateGoalAction(fd);
      if (!result.success) { setError(result.error); return; }
      toast.success("Goal updated");
      onClose();
    });
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit Goal">
      <div className="flex flex-col gap-4 p-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Goal name</p>
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. DP Rumah" maxLength={60}
            className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Target amount</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
            <input
              type="text" inputMode="numeric" placeholder="0"
              value={displayTarget} onChange={handleTargetInput}
              className="w-full rounded-xl border bg-card pl-10 pr-4 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>
        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
      </div>
      <div className="sticky bottom-0 bg-background border-t px-4 py-3">
        <button
          type="button" onClick={handleSave} disabled={pending}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save goal"}
        </button>
      </div>
    </Sheet>
  );
}

// ── Savings movement row ─────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Main export ──────────────────────────────────────────────────────────────

export function SavingsClient({
  goal, netTotal, contributions, movements, profiles, isAdmin,
}: SavingsClientProps) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [editGoalOpen, setEditGoalOpen] = useState(false);

  const target = Number(goal?.target_amount ?? 0);
  const pct = target > 0 ? Math.min(100, Math.round((netTotal / target) * 100)) : 0;

  // Group movements by date
  const grouped = movements.reduce((acc, mv) => {
    const key = mv.transaction_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(mv);
    return acc;
  }, {} as Record<string, SavingMovement[]>);
  const groupedEntries = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="flex flex-col gap-5 px-4 pb-10">
      {/* Goal card */}
      <div className="rounded-xl border bg-accent/15 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="size-5 text-accent-foreground/70" />
            <p className="font-semibold text-accent-foreground">{goal?.title ?? "Shared Savings"}</p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setEditGoalOpen(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition"
              title="Edit goal"
            >
              <Settings2 className="size-4" />
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="h-3 rounded-full bg-accent/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Saved: {formatIDR(netTotal)}</span>
            <span>{pct}%</span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-accent-foreground">{formatIDR(netTotal)}</p>
            {target > 0 && netTotal < target && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatIDR(target - netTotal)} remaining of {formatIDR(target, { compact: true })}
              </p>
            )}
            {target > 0 && netTotal >= target && (
              <p className="text-xs font-medium text-accent-foreground mt-0.5">🎉 Goal reached!</p>
            )}
          </div>
        </div>
      </div>

      {/* Contribution split */}
      <div className="grid grid-cols-2 gap-3">
        {contributions.map(({ profile, amount, pct: cPct }) => (
          <div key={profile.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="size-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: profile.avatar_color ?? "#ccc" }}
              >
                {profile.display_name.charAt(0)}
              </div>
              <p className="text-xs font-medium text-muted-foreground">{profile.display_name}</p>
            </div>
            <p className="text-lg font-semibold text-foreground">{formatIDR(amount)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{cPct}% of savings</p>
          </div>
        ))}
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDepositOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent/20 border border-accent/40 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/30 transition"
          >
            <Plus className="size-4" /> Deposit
          </button>
          <button
            type="button"
            onClick={() => setWithdrawOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border bg-card py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted transition"
          >
            <Minus className="size-4" /> Withdraw
          </button>
        </div>
      )}

      {/* History */}
      {movements.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          <PiggyBank className="size-8 text-muted-foreground/50" />
          <p className="font-medium">No savings movements yet</p>
          {isAdmin && <p className="text-xs">Tap Deposit to start saving together.</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">History</p>
          {groupedEntries.map(([date, mvs]) => (
            <div key={date}>
              <p className="text-xs text-muted-foreground mb-2">{formatDate(date)}</p>
              <div className="rounded-xl border bg-card overflow-hidden divide-y">
                {mvs.map((mv) => (
                  <div key={mv.id} className="flex items-center gap-3 px-3 py-3">
                    <CategoryIcon category="saving" size="md" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {mv.note || (mv.type === "expense" ? "Deposit" : "Withdrawal")}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div
                          className="size-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ background: mv.profile.avatar_color ?? "#ccc" }}
                        >
                          {mv.profile.display_name.charAt(0)}
                        </div>
                        <p className="text-xs text-muted-foreground">{mv.profile.display_name}</p>
                      </div>
                    </div>
                    <p className={cn(
                      "text-sm font-semibold shrink-0",
                      mv.type === "expense" ? "text-accent-foreground" : "text-destructive",
                    )}>
                      {mv.type === "expense" ? "+" : "-"}{formatIDR(Number(mv.amount))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheets */}
      <SavingActionSheet mode="deposit" profiles={profiles} open={depositOpen} onClose={() => setDepositOpen(false)} />
      <SavingActionSheet mode="withdraw" profiles={profiles} open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
      <EditGoalSheet goal={goal} open={editGoalOpen} onClose={() => setEditGoalOpen(false)} />
    </div>
  );
}
