import Link from "next/link";

export function BrandMark({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
    <rect x="1" y="1" width="46" height="46" rx="13" className="brand-mark-bg" />
    <path d="M16 11h12l7 7v19H16a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M28 11v7h7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M25 23a4 4 0 1 0 0 7M26 26l3 7 4-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
export default function Brand({ inverse = false, className = "" }: { inverse?: boolean; className?: string }) {
  return <Link href="/" aria-label="CV Builder, accueil" className={`brand ${inverse ? "brand-inverse" : ""} ${className}`}>
    <BrandMark className="brand-symbol" /><span>CV Builder<span className="brand-dot">.</span><small>VOTRE PARCOURS, EN MIEUX.</small></span>
  </Link>;
}
