"use client";

import { useState, useTransition, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import { CategoryIcon, CATEGORY_CONFIG } from "@/components/category-icon";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EditSheet } from "./edit-sheet";
import { deleteTransactionAction } from "@/features/transactions/actions";
import type { Transaction, Profile } from "@/types/database";

type TxWithProfile = Transaction & {
  profile: { display_name: string; avatar_color: string | null; username: string };
};

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week",  label: "Week" },
  { value: "month", label: "Month" },
  { value: "all",   label: "All" },
] as const;

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface TransactionListProps {
  initial: TxWithProfile[];
  currentUserId: string;
  isAdmin: boolean;
}

export function TransactionList({ initial, currentUserId, isAdmin }: TransactionListProps) {
  const router = useRouter();
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const [search, setSearch] = useState("");
  const [editTx, setEditTx] = useState<TxWithProfile | null>(null);
  const [deleteTx, setDeleteTx] = useState<TxWithProfile | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [txList, setTxList] = useState<TxWithProfile[]>(initial);
  const [deletePending, startDelete] = useTransition();

  const openMenu = useCallback((id: string, btn: HTMLButtonElement) => {
    const rect = btn.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setOpenMenuId(id);
  }, []);

  // Client-side period filter
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekStart = (() => {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().slice(0, 10);
  })();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const filtered = useMemo(() => {
    let list = txList;

    if (period === "today") list = list.filter(t => t.transaction_date === todayStr);
    else if (period === "week") list = list.filter(t => t.transaction_date >= weekStart);
    else if (period === "month") list = list.filter(t => t.transaction_date >= monthStart);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.note?.toLowerCase().includes(q) ||
        CATEGORY_CONFIG[t.category]?.label.toLowerCase().includes(q)
      );
    }

    return list;
  }, [txList, period, search, todayStr, weekStart, monthStart]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, TxWithProfile[]>();
    for (const tx of filtered) {
      const key = tx.transaction_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  function handleDeleteConfirm() {
    if (!deleteTx) return;
    const id = deleteTx.id;
    // Optimistic remove
    setTxList(prev => prev.filter(t => t.id !== id));
    setDeleteTx(null);

    startDelete(async () => {
      const result = await deleteTransactionAction(id);
      if (!result.success) {
        // Rollback
        setTxList(prev => [...prev, deleteTx].sort(
          (a, b) => b.transaction_date.localeCompare(a.transaction_date)
        ));
        toast.error(result.error);
      } else {
        toast.success("Transaction deleted");
      }
    });
  }

  function handleSaved() {
    router.refresh();
  }

  return (
    <>
      {/* Search */}
      <div className="px-4 pb-3">
        <input
          type="text"
          placeholder="Search note or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 px-4 pb-4">
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-medium transition",
              period === value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
          <p className="font-medium">No transactions</p>
          <p className="text-xs">Try a different filter or add your first transaction.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 px-4 pb-10">
          {grouped.map(([date, txs]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                {formatDate(date)}
              </p>
              <div className="flex flex-col rounded-xl border bg-card overflow-hidden divide-y">
                {txs.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-3 py-3 relative">
                    <CategoryIcon category={tx.category} size="md" />

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground truncate">
                          {tx.note || CATEGORY_CONFIG[tx.category]?.label || tx.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div
                          className="size-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          style={{ background: tx.profile.avatar_color ?? "#ccc" }}
                        >
                          {tx.profile.display_name.charAt(0)}
                        </div>
                        <p className="text-xs text-muted-foreground">{tx.profile.display_name}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className={cn(
                        "text-sm font-semibold",
                        tx.type === "income" ? "text-accent-foreground" : "text-destructive",
                      )}>
                        {tx.type === "income" ? "+" : "-"}{formatIDR(Number(tx.amount))}
                      </p>
                      {/* Menu button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          if (openMenuId === tx.id) setOpenMenuId(null);
                          else openMenu(tx.id, e.currentTarget);
                        }}
                        className="p-1 rounded-md text-muted-foreground hover:bg-muted transition"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit sheet */}
      {editTx && (
        <EditSheet
          transaction={editTx}
          isAdmin={isAdmin}
          open={!!editTx}
          onClose={() => setEditTx(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTx}
        onClose={() => setDeleteTx(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete transaction?"
        description={deleteTx
          ? `${deleteTx.note || CATEGORY_CONFIG[deleteTx.category]?.label} · ${formatIDR(Number(deleteTx.amount))}`
          : undefined}
        confirmLabel="Delete"
        destructive
        pending={deletePending}
      />

      {/* Dropdown menu — portal so overflow:hidden on parent card doesn't clip it */}
      {openMenuId && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[150]" onClick={() => setOpenMenuId(null)} />
          <div
            className="fixed z-[160] w-36 rounded-xl border bg-card shadow-xl overflow-hidden"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button
              type="button"
              onClick={() => {
                const tx = txList.find(t => t.id === openMenuId);
                if (tx) setEditTx(tx);
                setOpenMenuId(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition"
            >
              <Pencil className="size-3.5 text-muted-foreground" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                const tx = txList.find(t => t.id === openMenuId);
                if (tx) setDeleteTx(tx);
                setOpenMenuId(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
