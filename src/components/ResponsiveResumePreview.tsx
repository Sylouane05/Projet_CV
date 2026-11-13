"use client";
import { useEffect, useRef, useState } from "react";
import ResumePreview from "./ResumePreview";
import type { AppState } from "@/lib/schema";

/** Scale only the on-screen preview; print keeps the original document layout. */
export default function ResponsiveResumePreview({ state, variantId }: { state: AppState; variantId: string }) {
  const container = useRef<HTMLDivElement>(null);
  const document = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 1, width: 794, height: 1123 });
  useEffect(() => {
    const outer = container.current;
    const content = document.current;
    if (!outer || !content) return;
    const measure = () => {
      const width = content.offsetWidth;
      const height = content.offsetHeight;
      if (!width || !outer.clientWidth) return;
      const scale = Math.min(1, outer.clientWidth / width);
      setSize((old) => old.scale === scale && old.width === width && old.height === height ? old : { scale, width, height });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(content);
    measure();
    return () => observer.disconnect();
  }, []);
  return <div ref={container} data-resume-preview className="w-full min-w-0 overflow-hidden">
    <div data-resume-viewport className="mx-auto" style={{ width: size.width * size.scale, height: size.height * size.scale }}>
      <div ref={document} data-resume-scale style={{ width: "210mm", transform: `scale(${size.scale})`, transformOrigin: "top left" }}>
        <ResumePreview state={state} variantId={variantId} />
      </div>
    </div>
  </div>;
}
