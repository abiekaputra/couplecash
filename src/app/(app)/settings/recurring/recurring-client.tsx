"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import { CategoryIcon, CATEGORY_CONFIG } from "@/components/category-icon";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  createTemplateAction,
  toggleTemplateAction,
  deleteTemplateAction,
} from "@/features/recurring/actions";
import type { RecurringTemplate, Profile } from "@/types/database";

const EXPENSE_CATS = [
  { value: "food", label: "Food" }, { value: "shop", label: "Shop" },
  { value: "transport", label: "Transport" }, { value: "fun", label: "Fun" },
  { value: "bills", label: "Bills" },
];
const INCOME_CATS = [{ value: "income", label: "Income" }];

export function RecurringClient({
  templates: initial, profiles, currentUserId,
}: {
  templates: RecurringTemplate[];
  profiles: Profile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTpl, setDeleteTpl] = useState<RecurringTemplate | null>(null);
  const [pending, startTransition] = useTransition();

  // ── Add form state ──
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("bills");
  const [userId, setUserId] = useState(currentUserId);
  const [displayAmount, setDisplayAmount] = useState("");
  const [rawAmount, setRawAmount] = useState(0);
  const [note, setNote] = useState("");
  const [day, setDay] = useState("1");
  const [formError, setFormError] = useState<string | null>(null);

  function handleAmountInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const num = parseInt(raw || "0", 10);
    setRawAmount(num);
    setDisplayAmount(raw === "" ? "" : new Intl.NumberFormat("id-ID").format(num));
  }

  function handleAdd() {
    setFormError(null);
    const fd = new FormData();
    fd.append("type", type);
    fd.append("category", category);
    fd.append("amount", String(rawAmount));
    fd.append("note", note);
    fd.append("day_of_month", day);
    fd.append("user_id", userId);
    startTransition(async () => {
      const r = await createTemplateAction(fd);
      if (!r.success) { setFormError(r.error); return; }
      toast.success("Recurring template created");
      setAddOpen(false);
      setDisplayAmount(""); setRawAmount(0); setNote(""); setDay("1");
      router.refresh();
    });
  }

  function handleToggle(tpl: RecurringTemplate) {
    setTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, active: !t.active } : t));
    startTransition(async () => {
      const r = await toggleTemplateAction(tpl.id, !tpl.active);
      if (!r.success) {
        setTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, active: tpl.active } : t));
        toast.error(r.error);
      }
    });
  }

  function handleDelete() {
    if (!deleteTpl) return;
    const id = deleteTpl.id;
    setTemplates(prev => prev.filter(t => t.id !== id));
    setDeleteTpl(null);
    startTransition(async () => {
      const r = await deleteTemplateAction(id);
      if (!r.success) { toast.error(r.error); router.refresh(); }
      else toast.success("Template deleted");
    });
  }

  const cats = type === "expense" ? EXPENSE_CATS : INCOME_CATS;

  return (
    <div className="flex flex-col gap-4 px-4 pb-10">
      <button type="button" onClick={() => setAddOpen(true)}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
      >
        <Plus className="size-4" /> New template
      </button>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <RefreshCw className="size-7 text-muted-foreground/50" />
          <p className="font-medium">No recurring templates</p>
          <p className="text-xs">Add monthly bills, salary, or any fixed transaction.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden divide-y">
          {templates.map((tpl) => {
            const p = profiles.find(pr => pr.id === tpl.user_id);
            return (
              <div key={tpl.id} className={cn("flex items-center gap-3 px-3 py-3", !tpl.active && "opacity-50")}>
                <CategoryIcon category={tpl.category} size="sm" />
                <div className="flex flex-col min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {tpl.note || CATEGORY_CONFIG[tpl.category]?.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p?.display_name} · day {tpl.day_of_month} · {formatIDR(tpl.amount, { compact: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => handleToggle(tpl)}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition"
                    title={tpl.active ? "Disable" : "Enable"}
                  >
                    {tpl.active ? <ToggleRight className="size-5 text-accent-foreground" /> : <ToggleLeft className="size-5" />}
                  </button>
                  <button type="button" onClick={() => setDeleteTpl(tpl)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add sheet */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="New recurring template">
        <div className="flex flex-col gap-4 p-4">
          {/* Type */}
          <div className="flex rounded-xl border bg-muted p-1 gap-1">
            {(["expense", "income"] as const).map(t => (
              <button key={t} type="button" onClick={() => { setType(t); setCategory(t === "expense" ? "bills" : "income"); }}
                className={cn("flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition",
                  type === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
              >{t}</button>
            ))}
          </div>
          {/* Category */}
          <div className="grid grid-cols-3 gap-2">
            {cats.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => setCategory(value)}
                className={cn("flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition",
                  category === value ? "border-primary bg-primary-soft text-primary" : "bg-card text-muted-foreground hover:bg-muted")}
              >
                <CategoryIcon category={value} size="sm" />
                {label}
              </button>
            ))}
          </div>
          {/* User */}
          <div className="flex gap-2">
            {profiles.map(p => (
              <button key={p.id} type="button" onClick={() => setUserId(p.id)}
                className={cn("flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-medium transition",
                  userId === p.id ? "border-primary bg-primary-soft text-primary" : "bg-card text-muted-foreground hover:bg-muted")}
              >
                <div className="size-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: p.avatar_color ?? "#ccc" }}>{p.display_name.charAt(0)}</div>
                {p.display_name}
              </button>
            ))}
          </div>
          {/* Amount */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
            <input type="text" inputMode="numeric" placeholder="0" value={displayAmount} onChange={handleAmountInput}
              className="w-full rounded-xl border bg-card pl-10 pr-4 py-3 text-xl font-semibold outline-none focus:ring-2 focus:ring-ring/40" />
          </div>
          {/* Note */}
          <input type="text" placeholder="Label (e.g. Netflix)" value={note} onChange={e => setNote(e.target.value)}
            className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40" />
          {/* Day */}
          <div className="space-y-1">
            <p className="text-sm font-medium">Day of month</p>
            <input type="number" min="1" max="28" value={day} onChange={e => setDay(e.target.value)}
              className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40" />
            <p className="text-xs text-muted-foreground">Max 28 to be safe every month</p>
          </div>
          {formError && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
          <button type="button" onClick={handleAdd} disabled={pending}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
          >{pending ? "Saving…" : "Create template"}</button>
        </div>
      </Sheet>

      <ConfirmDialog open={!!deleteTpl} onClose={() => setDeleteTpl(null)} onConfirm={handleDelete}
        title="Delete template?" description={deleteTpl?.note || CATEGORY_CONFIG[deleteTpl?.category ?? ""]?.label}
        confirmLabel="Delete" destructive pending={pending} />
    </div>
  );
}
