"use client";
import { useEffect, useRef, useState } from "react";
import ResumePreview from "./ResumePreview";
import type { AppState } from "@/lib/schema";

/** Scale only the on-screen preview; print keeps the original document layout. */
export default function ResponsiveResumePreview({ state, variantId, showStatus = true }: { state: AppState; variantId: string; showStatus?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const document = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 1, width: 794, height: 1123, pages: 1 });
  useEffect(() => {
    const outer = container.current;
    const content = document.current;
    if (!outer || !content) return;
    const measure = () => {
      const width = content.offsetWidth;
      const height = content.offsetHeight;
      if (!width || !outer.clientWidth) return;
      const scale = Math.min(1, outer.clientWidth / width);
      const pages = Math.max(1, Math.ceil((height - width * 20 / 210 - 2) / (width * 277 / 210)));
      setSize((old) => old.scale === scale && old.width === width && old.height === height && old.pages === pages ? old : { scale, width, height, pages });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(content);
    measure();
    return () => observer.disconnect();
  }, []);
  return <div ref={container} data-resume-preview className="w-full min-w-0 overflow-hidden">
    {showStatus && <div data-resume-status role="status" className={`mb-3 rounded-xl border px-3 py-2 text-xs leading-5 ${size.pages > 1 ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-600"}`}>
      <span className="font-semibold">A4 · {size.pages} {size.pages > 1 ? "pages estimées" : "page estimée"}</span>
      <span className="ml-2">{size.pages > 1 ? "Le contenu dépasse une page. Essaie une densité plus compacte ou ajuste ta sélection." : "Tout le contenu sélectionné est conservé."}</span>
    </div>}
    <div data-resume-viewport className="mx-auto" style={{ width: size.width * size.scale, height: size.height * size.scale }}>
      <div ref={document} data-resume-scale style={{ width: "210mm", transform: `scale(${size.scale})`, transformOrigin: "top left" }}>
        <ResumePreview state={state} variantId={variantId} />
      </div>
    </div>
  </div>;
}
