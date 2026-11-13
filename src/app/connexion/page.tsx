import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = { title: "Connexion | CV Builder", description: "Connectez-vous avec Google pour retrouver vos CV et poursuivre votre travail." };

export default function Page() {
  return <AuthPage mode="login" />;
}
