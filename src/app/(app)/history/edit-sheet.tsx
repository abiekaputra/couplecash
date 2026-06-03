"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Utensils, ShoppingBag, Car, Smile,
  Zap, PiggyBank, Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/sheet";
import { updateTransactionAction } from "@/features/transactions/actions";
import type { Transaction, Profile } from "@/types/database";

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

interface EditSheetProps {
  transaction: Transaction & { profile: { display_name: string; avatar_color: string | null; username: string } };
  isAdmin: boolean;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditSheet({ transaction: tx, isAdmin, open, onClose, onSaved }: EditSheetProps) {
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<"income" | "expense">(tx.type as "income" | "expense");
  const [category, setCategory] = useState<string>(tx.category);
  const [displayAmount, setDisplayAmount] = useState(
    new Intl.NumberFormat("id-ID").format(Number(tx.amount))
  );
  const [rawAmount, setRawAmount] = useState(Number(tx.amount));
  const [note, setNote] = useState(tx.note ?? "");
  const [date, setDate] = useState(tx.transaction_date);
  const [error, setError] = useState<string | null>(null);

  const categories = type === "expense"
    ? EXPENSE_CATS.filter(c => !c.adminOnly || isAdmin)
    : INCOME_CATS.filter(c => !c.adminOnly || isAdmin);

  function handleTypeChange(t: "income" | "expense") {
    setType(t);
    setCategory(t === "expense" ? "food" : "income");
  }

  function handleAmountInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const num = parseInt(raw || "0", 10);
    setRawAmount(num);
    setDisplayAmount(raw === "" ? "" : new Intl.NumberFormat("id-ID").format(num));
  }

  function handleSave() {
    setError(null);
    if (rawAmount <= 0) { setError("Amount must be greater than 0"); return; }

    const fd = new FormData();
    fd.append("id", tx.id);
    fd.append("type", type);
    fd.append("category", category);
    fd.append("amount", String(rawAmount));
    fd.append("note", note);
    fd.append("transaction_date", date);
    fd.append("target_user_id", tx.user_id);

    startTransition(async () => {
      const result = await updateTransactionAction(fd);
      if (!result.success) { setError(result.error); return; }
      toast.success("Transaction updated");
      onSaved();
      onClose();
    });
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit Transaction">
      <div className="flex flex-col gap-4 p-4">
        {/* Type toggle */}
        <div className="flex rounded-xl border bg-muted p-1 gap-1">
          {(["expense", "income"] as const).map((t) => (
            <button key={t} type="button" onClick={() => handleTypeChange(t)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition",
                type === t
                  ? t === "expense" ? "bg-card text-destructive shadow-sm" : "bg-card text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >{t}</button>
          ))}
        </div>

        {/* Amount */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
          <input
            type="text" inputMode="numeric" value={displayAmount} onChange={handleAmountInput}
            className="w-full rounded-xl border bg-card pl-10 pr-4 py-3 text-xl font-semibold outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
          />
        </div>

        {/* Category */}
        <div className="grid grid-cols-3 gap-2">
          {categories.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" onClick={() => setCategory(value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition",
                category === value ? "border-primary bg-primary-soft text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4" />{label}
            </button>
          ))}
        </div>

        {/* Note */}
        <input
          type="text" placeholder="Note (optional)" value={note}
          onChange={(e) => setNote(e.target.value)} maxLength={200}
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

        <button type="button" onClick={handleSave} disabled={pending}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Sheet>
  );
}
