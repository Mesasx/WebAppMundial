"use client";
import clsx from "clsx";
import { barColor } from "@/lib/labels";

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function Bar({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-slate-400 mb-0.5">
          <span>{label}</span>
          <span>{Math.round(value)}</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-ink-900 overflow-hidden">
        <div className={clsx("h-full rounded-full transition-all", barColor(value))} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-ink-600 border-t-pitch-500" />
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-center text-slate-400 py-12">{children}</div>;
}

export function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-pop">
      <div className="card px-5 py-3 shadow-xl border-pitch-500/40 flex items-center gap-3 max-w-md">
        <span className="text-sm">{msg}</span>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
      </div>
    </div>
  );
}
