export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case "auth/popup-closed-by-user": return "La connexion a été annulée. Tu peux réessayer quand tu veux.";
    case "auth/popup-blocked": return "Ton navigateur a bloqué la fenêtre Google. Autorise les fenêtres de connexion pour ce site puis réessaie.";
    case "auth/cancelled-popup-request": return "Une fenêtre de connexion est déjà ouverte. Termine la connexion dans cette fenêtre.";
    case "auth/network-request-failed": return "La connexion a été interrompue. Vérifie ton accès à Internet puis réessaie.";
    case "auth/unauthorized-domain": return "La connexion n’est pas encore disponible à cette adresse. Réessaie depuis l’adresse habituelle du site.";
    case "auth/operation-not-allowed": return "La connexion Google est momentanément indisponible. Réessaie plus tard.";
    case "auth/user-disabled": return "Ce compte a été désactivé. Contacte le responsable du site.";
    case "auth/too-many-requests": return "Trop de tentatives rapprochées. Patiente quelques instants puis réessaie.";
    default: return "Impossible de se connecter pour le moment. Réessaie dans quelques instants.";
  }
}
