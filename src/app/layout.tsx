import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/components/AppProviders";

const title = "CV Builder — Votre parcours, en mieux.";
const description = "Créez un CV qui vous ressemble. Rassemblez votre parcours, personnalisez votre mise en page et exportez votre CV en PDF.";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title, description, applicationName: "CV Builder",
  openGraph: { title, description, siteName: "CV Builder", locale: "fr_FR", type: "website" },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
