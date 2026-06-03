"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  // Track mount state to avoid SSR portal errors
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet panel */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 rounded-t-2xl bg-background",
          "max-h-[92vh] overflow-y-auto",
          "md:left-auto md:right-6 md:bottom-6 md:w-[420px] md:rounded-2xl md:max-h-[80vh]",
          className,
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3.5 border-b bg-background/95 backdrop-blur">
          <p className="font-semibold text-foreground">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
