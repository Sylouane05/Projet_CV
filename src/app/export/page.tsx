"use client";

import { useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAppStore } from "@/store/app-store";
import ResumePreview from "@/components/ResumePreview";

export default function ExportPage() {
  const { state, loading, activeVariantId } = useAppStore();
  const [busy, setBusy] = useState(false);

  const variantId = useMemo(() => {
    if (!state) return null;
    return activeVariantId ?? state.resumeVariants?.[0]?.id ?? null;
  }, [state, activeVariantId]);

  if (loading || !state) return <div>Chargement…</div>;
  if (!variantId) return <div>Aucun variant disponible.</div>;

  async function downloadPdf() {
    setBusy(true);
    try {
      const el = document.getElementById("resume-a4");
      if (!el) return;

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (doc) => {
          // Force des couleurs simples pour éviter lab()/oklch()
          const root = doc.getElementById("resume-a4");
          if (!root) return;

          // 1) Force background blanc + texte noir
         (root as HTMLElement).style.backgroundColor = "#ffffff";
         (root as HTMLElement).style.color = "#000000";

         // 2) Remplace toutes les couleurs "inherit" fancy par du RGB standard
        const all = root.querySelectorAll<HTMLElement>("*");
        all.forEach((node) => {
          const cs = doc.defaultView?.getComputedStyle(node);
          if (!cs) return;

          // On force les couleurs “problématiques” vers des valeurs sûres
         if (cs.color && (cs.color.includes("lab(") || cs.color.includes("oklch(") || cs.color.includes("color("))) {
           node.style.color = "#111111";
         }
         if (
           cs.backgroundColor &&
           (cs.backgroundColor.includes("lab(") ||
             cs.backgroundColor.includes("oklch(") ||
             cs.backgroundColor.includes("color("))
        ) {
          node.style.backgroundColor = "transparent";
        }
        if (
          cs.borderColor &&
          (cs.borderColor.includes("lab(") ||
            cs.borderColor.includes("oklch(") ||
            cs.borderColor.includes("color("))
       ) {
         node.style.borderColor = "#dddddd";
       }
    });
  },
});


      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // image full page A4
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);

      pdf.save("cv.pdf");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Export</h1>

        <button
          className="border rounded px-3 py-2 bg-white"
          onClick={downloadPdf}
          disabled={busy}
        >
          {busy ? "Génération..." : "Télécharger PDF"}
        </button>
      </div>

      <div className="overflow-auto border rounded bg-gray-100 p-4">
        <ResumePreview state={state} variantId={variantId} />
      </div>

      <div className="text-sm text-gray-600">
        Astuce : sélectionne tes expériences dans l’onglet “CV”, puis reviens ici.
      </div>
    </div>
  );
}
