import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = { title: "Inscription | CV Builder", description: "Créez votre espace CV Builder avec Google et retrouvez vos CV sur vos appareils." };

export default function Page() {
  return <AuthPage mode="signup" />;
}
