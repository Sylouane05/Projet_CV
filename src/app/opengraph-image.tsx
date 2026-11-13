import { ImageResponse } from "next/og";

export const alt = "CV Builder — Votre parcours, en mieux. Un studio pour créer votre CV.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function SocialImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#f6f7f1", color: "#183a3c", padding: "60px", position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 660, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
            <rect x="1" y="1" width="46" height="46" rx="13" fill="#183a3c" />
            <path d="M16 11h12l7 7v19H16a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3Z M28 11v7h7 M25 23a4 4 0 1 0 0 7 M26 26l3 7 4-10" stroke="#e6f2d8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>CV Builder.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 36 }}>
          <div style={{ display: "flex", fontSize: 14, letterSpacing: 4, color: "#6d8063" }}>VOTRE PARCOURS, EN MIEUX.</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 67, fontWeight: 700, lineHeight: 1.12, letterSpacing: -3 }}><span>Un parcours.</span><span>Des possibilités</span><span style={{ color: "#71865f" }}>infinies.</span></div>
          <div style={{ display: "flex", fontSize: 22, maxWidth: 530, lineHeight: 1.5, color: "#61745c" }}>Créez un CV à la hauteur de votre prochaine étape.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 16, gap: 12, marginTop: 28 }}><span style={{ width: 28, height: 2, background: "#91a47e" }} /> CRÉEZ. PERSONNALISEZ. EXPORTEZ.</div>
      </div>
      <div style={{ position: "absolute", top: 68, right: 36, width: 390, height: 500, background: "#e7eddd", borderRadius: 28, display: "flex", padding: 30, transform: "rotate(6deg)" }}>
        <div style={{ width: "100%", height: "100%", background: "white", borderRadius: 7, padding: 25, display: "flex", flexDirection: "column", boxShadow: "0 20px 45px #183a3c18", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 20, borderBottom: "1px solid #e5eadf" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 54, height: 62, borderRadius: 8, background: "#d8e9bb", fontSize: 24, fontWeight: 700 }}>CV</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}><span style={{ width: 138, height: 12, background: "#183a3c", borderRadius: 3 }} /><span style={{ width: 104, height: 6, background: "#b3c29f", borderRadius: 3 }} /></div>
          </div>
          <div style={{ display: "flex", gap: 22, flex: 1 }}>
            <div style={{ width: 82, display: "flex", flexDirection: "column", gap: 10, background: "#f4f6ef", padding: 10, borderRadius: 5 }}><span style={{ fontSize: 8, fontWeight: 700 }}>COMPÉTENCES</span>{[52, 43, 58, 38, 50, 45].map((width, i) => <span key={i} style={{ width, height: 5, background: "#becbab", borderRadius: 2 }} />)}<span style={{ fontSize: 8, fontWeight: 700, marginTop: 22 }}>FORMATION</span>{[52, 40, 49, 34].map((width, i) => <span key={i} style={{ width, height: 5, background: "#ced7c2", borderRadius: 2 }} />)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>{["PROFIL", "EXPÉRIENCES", "PROJETS"].map((label) => <div key={label} style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 8 }}><span style={{ fontSize: 9, letterSpacing: 1, fontWeight: 700 }}>{label}</span>{["100%", "94%", "75%"].map((width) => <span key={width} style={{ width, height: 5, background: "#d9dfd3", borderRadius: 2 }} />)}</div>)}</div>
          </div>
        </div>
      </div>
    </div>, size,
  );
}
