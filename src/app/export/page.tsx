"use client";

import { useMemo, useRef, useState } from "react";
import StudioPageHeader from "@/components/StudioPageHeader";
import { ChevronDown, Download, FolderArchive } from "lucide-react";
import { useDialog } from "@/components/DialogProvider";
import { useAppStore } from "@/store/app-store";
import ResponsiveResumePreview from "@/components/ResponsiveResumePreview";
import { getStorageScope } from "@/lib/db";
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
  const { confirm } = useDialog();
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
      if (!el) throw new Error("L’aperçu du CV n’est pas encore disponible.");

      const scope = getStorageScope();
      const version = el.dataset.resumeVersion;
      const stillCurrent = () => document.getElementById("resume-a4") === el && el.dataset.variantId === variantId && el.dataset.resumeVersion === version && getStorageScope() === scope;
      const timeout = Date.now() + 8000;
      while (el.dataset.assetsReady === "false") {
        if (!stillCurrent()) throw new Error("Le CV a changé pendant la préparation. Relance l’export.");
        if (Date.now() > timeout) throw new Error("Les images ne sont pas encore prêtes. Patiente un instant puis réessaie.");
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      if (el.dataset.assetsError) throw new Error(el.dataset.assetsError);
      await document.fonts.ready;
      const images = Array.from(el.querySelectorAll("img"));
      try { await Promise.all(images.map((img) => img.decode())); }
      catch { throw new Error("Une image du CV est illisible. Remplace-la dans ton profil puis réessaie."); }
      if (!stillCurrent()) throw new Error("Le CV a changé pendant la préparation. Relance l’export.");
      window.print();

      setMsg({ type: "ok", text: "Dans la fenêtre d’impression, choisis « Enregistrer au format PDF »." });
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
      const bundle = await exportBundle(state ?? undefined);
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
    if (file.size > 10 * 1024 * 1024) { setMsg({ type: "err", text: "Le fichier dépasse la limite de 10 Mo." }); return; }
    setMsg(null);
    setBusyData(true);

    const scope = getStorageScope();
    try {
      if (!await confirm({ title: "Restaurer cette sauvegarde ?", description: `Le fichier « ${file.name} » remplacera toutes les données du CV actuel. Exporte ton CV avant de continuer si tu souhaites le conserver.`, confirmLabel: "Restaurer la sauvegarde", destructive: true })) return;
      if (scope !== getStorageScope()) throw new Error("Le compte a changé pendant la confirmation. Réessaie.");
      const text = await file.text();
      const json = JSON.parse(text);

      const nextState = await importBundle(json, scope);
      if (scope !== getStorageScope()) throw new Error("Le compte a changé pendant l’import. Réessaie.");
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
    <div data-export-page className="studio-page export-page">
      <StudioPageHeader eyebrow="04 / LA PROCHAINE ÉTAPE" title="Prêt à faire la différence." description="Votre parcours est prêt à rencontrer sa prochaine opportunité.">

        <button className="studio-primary" onClick={downloadPdf} disabled={busyPdf}>
          <Download size={16} aria-hidden="true" />{busyPdf ? "Préparation…" : "Exporter en PDF"}
        </button>
      </StudioPageHeader>

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
      <details className="studio-card studio-disclosure export-backup-card border rounded bg-white p-4 space-y-3">
        <summary><FolderArchive size={17} aria-hidden="true" /><span>Vos sauvegardes<small>Exporter ou restaurer vos données.</small></span><ChevronDown size={16} aria-hidden="true" /></summary>
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
      </details>

      {/* Preview */}
      <div data-print-area className="export-preview-stage min-w-0 border rounded bg-gray-100 p-2 sm:p-4">
        <ResponsiveResumePreview state={state} variantId={variantId} />
      </div>

      <div className="text-sm text-gray-600">
        Pour le PDF, choisis « Enregistrer au format PDF », le format A4 et désactive les en-têtes et pieds de page du navigateur.
      </div>
    </div>
  );
}