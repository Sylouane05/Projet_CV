"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CircleAlert, X } from "lucide-react";

export type DialogOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};
type Job = DialogOptions & { notice?: boolean; resolve: (accepted: boolean) => void; trigger: HTMLElement | null };
type DialogApi = {
  confirm: (options: DialogOptions) => Promise<boolean>;
  notify: (options: DialogOptions) => Promise<void>;
};
const DialogContext = createContext<DialogApi | null>(null);
export function useDialog() {
  const api = useContext(DialogContext);
  if (!api) throw new Error("DialogProvider manquant.");
  return api;
}

export default function DialogProvider({ children }: { children: ReactNode }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const accept = useRef<HTMLButtonElement>(null);
  const queue = useRef<Job[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const enqueue = useCallback((options: DialogOptions, notice = false) => new Promise<boolean>((resolve) => {
    const entry: Job = { ...options, notice, resolve, trigger: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    queue.current.push(entry);
    if (queue.current.length === 1) setJob(entry);
  }), []);
  const finish = useCallback((accepted: boolean) => {
    const current = queue.current.shift();
    if (!current) return;
    dialog.current?.close();
    current.resolve(accepted);
    setJob(queue.current[0] ?? null);
    requestAnimationFrame(() => {
      if (!queue.current.length && current.trigger?.isConnected) current.trigger.focus();
    });
  }, []);
  useEffect(() => {
    const element = dialog.current;
    if (!job || !element) return;
    element.showModal();
    (job.notice ? accept : cancel).current?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = oldOverflow;
    };
  }, [job]);
  useEffect(() => () => {
    for (const pending of queue.current) pending.resolve(false);
    queue.current = [];
  }, []);
  const api: DialogApi = {
    confirm: (options) => enqueue(options),
    notify: async (options) => { await enqueue(options, true); },
  };
  return <DialogContext.Provider value={api}>
    {children}
    <dialog ref={dialog} className="app-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
          .filter((control) => control.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first || !last) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}
      onCancel={(event) => { event.preventDefault(); finish(false); }}
      onClick={(event) => { if (event.target === event.currentTarget) finish(false); }}>
      {job && <div className="relative p-6 sm:p-8">
        <button type="button" onClick={() => finish(false)} aria-label="Fermer la fenêtre" className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition hover:bg-slate-100"><X size={18} /></button>
        <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${job.destructive ? "bg-amber-100 text-amber-800" : "bg-teal-50 text-teal-800"}`}><CircleAlert size={24} aria-hidden="true" /></div>
        <h2 id={`${id}-title`} className="pr-5 text-xl font-semibold tracking-tight text-slate-950">{job.title}</h2>
        <p id={`${id}-description`} className="mt-3 text-sm leading-6 text-slate-600">{job.description}</p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {!job.notice && <button ref={cancel} type="button" onClick={() => finish(false)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">{job.cancelLabel ?? "Annuler"}</button>}
          <button ref={accept} type="button" onClick={() => finish(true)} className={`rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${job.destructive ? "bg-slate-900 hover:bg-slate-700" : "bg-teal-800 hover:bg-teal-900"}`}>{job.confirmLabel ?? (job.notice ? "J’ai compris" : "Continuer")}</button>
        </div>
      </div>}
    </dialog>
  </DialogContext.Provider>;
}
