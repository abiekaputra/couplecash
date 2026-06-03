"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateDisplayNameAction, changePasswordAction } from "@/features/profile/actions";

export function ProfileForm({ displayName }: { displayName: string }) {
  const [name, setName] = useState(displayName);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [namePending, startName] = useTransition();
  const [pwPending, startPw] = useTransition();
  const [nameError, setNameError] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  function handleName() {
    setNameError(null);
    const fd = new FormData();
    fd.append("display_name", name);
    startName(async () => {
      const r = await updateDisplayNameAction(fd);
      if (!r.success) { setNameError(r.error); return; }
      toast.success("Name updated");
    });
  }

  function handlePassword() {
    setPwError(null);
    const fd = new FormData();
    fd.append("password", password);
    fd.append("confirm", confirm);
    startPw(async () => {
      const r = await changePasswordAction(fd);
      if (!r.success) { setPwError(r.error); return; }
      toast.success("Password changed");
      setPassword(""); setConfirm("");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Display name */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">Display name</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
        <button
          type="button"
          onClick={handleName}
          disabled={namePending || name === displayName}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
        >
          {namePending ? "Saving…" : "Save name"}
        </button>
      </div>

      {/* Password */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">Change password</p>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
        {pwError && <p className="text-xs text-destructive">{pwError}</p>}
        <button
          type="button"
          onClick={handlePassword}
          disabled={pwPending || !password}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
        >
          {pwPending ? "Changing…" : "Change password"}
        </button>
      </div>
    </div>
  );
}
