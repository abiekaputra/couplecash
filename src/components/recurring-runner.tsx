"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { runDueRecurringAction } from "@/features/recurring/actions";

/**
 * Invisible component — mounted once in app layout.
 * Runs due recurring templates on the first render after page load.
 * Uses sessionStorage so it only fires once per browser session.
 */
export function RecurringRunner() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const key = `cc-recurring-${new Date().toISOString().slice(0, 7)}`;
    if (sessionStorage.getItem(key)) return;

    runDueRecurringAction().then(({ ran: count }) => {
      if (count > 0) {
        sessionStorage.setItem(key, "1");
        toast.success(`${count} recurring transaction${count > 1 ? "s" : ""} added automatically`);
      }
    });
  }, []);

  return null;
}
