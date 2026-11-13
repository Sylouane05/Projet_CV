import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
export default function StudioPageHeader({ eyebrow, title, description, action, children }: {
  eyebrow: string; title: string; description: string; action?: { label: string; href: string }; children?: ReactNode;
}) {
  return <header className="studio-page-heading">
    <div><p className="studio-eyebrow"><span />{eyebrow}</p><h1>{title}</h1><p className="studio-page-description">{description}</p></div>
    {action && <Link className="studio-primary" href={action.href}>{action.label}<ArrowUpRight size={17} aria-hidden="true" /></Link>}
    {children}
  </header>;
}
