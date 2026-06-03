"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Utensils, ShoppingBag, Car, Smile, Zap, PiggyBank,
  Banknote, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addTransactionAction } from "@/features/transactions/actions";
import { todayISO } from "./utils";
import type { Profile } from "@/types/database";

// ─── Category definitions ─────────────────────────────────────────────────────

interface CatDef { value: string; label: string; icon: React.ElementType; adminOnly?: boolean }

const EXPENSE_CATS: CatDef[] = [
  { value: "food",      label: "Food",      icon: Utensils },
  { value: "shop",      label: "Shop",      icon: ShoppingBag },
  { value: "transport", label: "Transport", icon: Car },
  { value: "fun",       label: "Fun",       icon: Smile },
  { value: "bills",     label: "Bills",     icon: Zap },
  { value: "saving",    label: "Saving",    icon: PiggyBank, adminOnly: true },
];

const INCOME_CATS: CatDef[] = [
  { value: "income",  label: "Income",   icon: Banknote },
  { value: "saving",  label: "Withdraw", icon: PiggyBank, adminOnly: true },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface AddFormProps {
  profiles: Profile[];
  currentUser: Profile;
}

export function AddForm({ profiles, currentUser }: AddFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("food");
  const [displayAmount, setDisplayAmount] = useState("");
  const [rawAmount, setRawAmount] = useState(0);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [userId, setUserId] = useState(currentUser.id);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentUser.role === "admin";
  const categories = type === "expense"
    ? EXPENSE_CATS.filter(c => !c.adminOnly || isAdmin)
    : INCOME_CATS.filter(c => !c.adminOnly || isAdmin);

  // Reset category when type changes
  function handleTypeChange(t: "income" | "expense") {
    setType(t);
    setCategory(t === "expense" ? "food" : "income");
    setError(null);
  }

  function handleAmountInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const num = parseInt(raw || "0", 10);
    setRawAmount(num);
    setDisplayAmount(raw === "" ? "" : new Intl.NumberFormat("id-ID").format(num));
  }

  function handleSubmit() {
    setError(null);
    if (rawAmount <= 0) {
      setError("Enter an amount greater than 0");
      return;
    }

    const fd = new FormData();
    fd.append("type", type);
    fd.append("category", category);
    fd.append("amount", String(rawAmount));
    fd.append("note", note);
    fd.append("transaction_date", date);
    fd.append("target_user_id", userId);

    startTransition(async () => {
      const result = await addTransactionAction(fd);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success("Transaction saved");
      router.push("/");
    });
  }

  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto px-4 pt-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted transition"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold">Add Transaction</h1>
      </div>

      {/* Type toggle */}
      <div className="flex rounded-xl border bg-muted p-1 gap-1">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition",
              type === t
                ? t === "expense"
                  ? "bg-card text-destructive shadow-sm"
                  : "bg-card text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={displayAmount}
            onChange={handleAmountInput}
            className="w-full rounded-xl border bg-card pl-10 pr-4 py-3.5 text-xl font-semibold tracking-tight outline-none transition focus:ring-2 focus:ring-ring/40 focus:border-ring"
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Category</label>
        <div className="grid grid-cols-3 gap-2">
          {categories.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition",
                category === value
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Admin: user selector */}
      {isAdmin && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">For</label>
          <div className="flex gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setUserId(p.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition",
                  userId === p.id
                    ? "border-primary bg-primary-soft text-primary"
                    : "bg-card text-muted-foreground hover:bg-muted",
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
      )}

      {/* Note */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Note <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="What's this for?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring/40 focus:border-ring"
        />
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring/40 focus:border-ring"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.99] transition disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save Transaction"}
      </button>
    </div>
  );
}
