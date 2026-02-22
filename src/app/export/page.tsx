"use client";

import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAppStore } from "@/store/app-store";
import ResumePreview from "@/components/ResumePreview";
import { exportBundle, importBundle } from "@/lib/storage";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const { state, loading, activeVariantId, replaceState } = useAppStore();

  const [busyPdf, setBusyPdf] = useState(false);
  const [busyData, setBusyData] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const variantId = useMemo(() => {
    if (!state) return null;
    return activeVariantId ?? state.resumeVariants?.[0]?.id ?? null;
  }, [state, activeVariantId]);

  if (loading || !state) return <div>Chargement…</div>;
  if (!variantId) return <div>Aucun variant disponible.</div>;

  // ----------------------------
  // PDF
  // ----------------------------
  async function downloadPdf() {
    setMsg(null);
    setBusyPdf(true);
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

          (root as HTMLElement).style.backgroundColor = "#ffffff";
          (root as HTMLElement).style.color = "#000000";

          const all = root.querySelectorAll<HTMLElement>("*");
          all.forEach((node) => {
            const cs = doc.defaultView?.getComputedStyle(node);
            if (!cs) return;

            if (
              cs.color &&
              (cs.color.includes("lab(") || cs.color.includes("oklch(") || cs.color.includes("color("))
            ) {
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

      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save("cv.pdf");

      setMsg({ type: "ok", text: "PDF généré ✅" });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ? String(e.message) : "Erreur lors de la génération PDF" });
    } finally {
      setBusyPdf(false);
    }
  }

  // ----------------------------
  // Export / Import JSON
  // ----------------------------
  async function onExportJson() {
    setMsg(null);
    setBusyData(true);
    try {
      const bundle = await exportBundle();
      const d = new Date(bundle.exportedAt);
      const yyyy = String(d.getFullYear());
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const filename = `cv-builder-backup-${yyyy}-${mm}-${dd}.json`;

      downloadJson(filename, bundle);
      setMsg({ type: "ok", text: "Export JSON terminé ✅ (backup téléchargé)" });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ? String(e.message) : "Erreur export JSON" });
    } finally {
      setBusyData(false);
    }
  }

  function onPickImport() {
    setMsg(null);
    fileRef.current?.click();
  }

  async function onImportFile(file: File | null) {
    if (!file) return;
    setMsg(null);
    setBusyData(true);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const nextState = await importBundle(json);
      await replaceState(nextState);

      setMsg({ type: "ok", text: "Import JSON terminé ✅ (données restaurées)" });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ? String(e.message) : "Erreur import JSON" });
    } finally {
      setBusyData(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Export</h1>

        <button className="border rounded px-3 py-2 bg-white" onClick={downloadPdf} disabled={busyPdf}>
          {busyPdf ? "Génération..." : "Télécharger PDF"}
        </button>
      </div>

      {msg ? (
        <div
          className={`border rounded p-3 text-sm ${
            msg.type === "ok" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}
        >
          {msg.text}
        </div>
      ) : null}

      {/* ✅ Backup / Restore */}
      <div className="border rounded bg-white p-4 space-y-3">
        <div className="font-medium">Sauvegarde / Restauration</div>
        <div className="text-sm text-gray-600">
          Exporte toutes tes infos (profil, expériences, projets, compétences, loisirs, variants + photo) dans un fichier
          <span className="font-medium"> .json</span> et importe-le quand tu veux.
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <button
            type="button"
            className="border rounded px-4 py-2 bg-white hover:bg-gray-50 disabled:opacity-60"
            onClick={onExportJson}
            disabled={busyData}
          >
            Exporter mes données (.json)
          </button>

          <button
            type="button"
            className="border rounded px-4 py-2 bg-white hover:bg-gray-50 disabled:opacity-60"
            onClick={onPickImport}
            disabled={busyData}
          >
            Importer un backup (.json)
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => onImportFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="text-xs text-gray-500">
          ⚠️ L’import remplace tes données actuelles (backup complet).
        </div>
      </div>

      {/* Preview */}
      <div className="overflow-auto border rounded bg-gray-100 p-4">
        <ResumePreview state={state} variantId={variantId} />
      </div>

      <div className="text-sm text-gray-600">
        Astuce : sélectionne tes expériences dans l’onglet “CV”, puis reviens ici.
      </div>
    </div>
  );
}