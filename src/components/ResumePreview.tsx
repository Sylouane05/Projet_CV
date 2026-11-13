"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { AppState } from "@/lib/schema";
import { loadPhoto } from "@/lib/storage";
import ResumeDocument from "./ResumeDocument";

type ImageResource = { key: string; src: string | null; error: string | null };
function linkedinLink(input: string) {
  const slug = input.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "").replace(/[?#/].*$/, "").replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").replace(/^-|-$/g, "").toLowerCase();
  return slug ? `https://www.linkedin.com/in/${slug}` : "";
}
export default function ResumePreview({ state, variantId }: { state: AppState; variantId: string }) {
  const photoId = state.profile.photoAssetId;
  const linkedinUrl = linkedinLink(state.profile.linkedinUsername);
  const [photo, setPhoto] = useState<ImageResource | null>(null);
  const [qr, setQr] = useState<ImageResource | null>(null);
  useEffect(() => {
    if (!photoId) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    void loadPhoto(photoId).then((src) => {
      objectUrl = src;
      if (cancelled) { if (src) URL.revokeObjectURL(src); return; }
      setPhoto({ key: photoId, src, error: src ? null : "La photo est introuvable. Ajoute-la à nouveau dans ton profil avant l’export." });
    }).catch(() => { if (!cancelled) setPhoto({ key: photoId, src: null, error: "La photo n’a pas pu être chargée. Réessaie avant l’export." }); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [photoId]);
  useEffect(() => {
    if (!linkedinUrl) return;
    let cancelled = false;
    void QRCode.toDataURL(linkedinUrl, { margin: 1, width: 160, errorCorrectionLevel: "M" }).then((src) => {
      if (!cancelled) setQr({ key: linkedinUrl, src, error: null });
    }).catch(() => { if (!cancelled) setQr({ key: linkedinUrl, src: null, error: "Le QR code LinkedIn n’a pas pu être créé. Réessaie avant l’export." }); });
    return () => { cancelled = true; };
  }, [linkedinUrl]);
  const currentPhoto = photo?.key === photoId ? photo : null;
  const currentQr = qr?.key === linkedinUrl ? qr : null;
  return <ResumeDocument state={state} variantId={variantId} photoUrl={currentPhoto?.src} linkedinQr={currentQr?.src} linkedinUrl={linkedinUrl}
    assetsReady={(!photoId || !!currentPhoto) && (!linkedinUrl || !!currentQr)} assetsError={currentPhoto?.error ?? currentQr?.error} />;
}
