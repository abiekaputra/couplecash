"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "bg-card border text-foreground text-sm shadow-lg",
          error: "border-destructive/30 text-destructive",
          success: "border-accent/40",
        },
      }}
    />
  );
}
