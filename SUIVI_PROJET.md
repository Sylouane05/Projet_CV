# CV Builder — suivi et contexte du projet

Dernière mise à jour : 13 novembre 2026.

## Intention du propriétaire

La base technique est construite. La prochaine phase doit porter sur l’identité visuelle, les parcours de compte, la refonte du CV et le déploiement public. Ne pas considérer la refonte graphique comme déjà réalisée.

L’utilisateur travaille sur son site dans **Edge**. Les onglets Chrome ouverts par les agents étaient des tests temporaires et peuvent disparaître. Ne pas lui demander de retrouver une fenêtre de test fermée.

## État actuel

- Application Next.js 16 / React 19 / TypeScript, Tailwind CSS, Zustand, validation Zod.
- Pages : `/profile`, `/library`, `/resume`, `/export`. La racine redirige vers le profil.
- Profil, expériences, projets, compétences, formations, langues, certifications, loisirs, variantes de CV.
- Authentification Firebase Google intégrée dans le panneau latéral ; **pas encore de pages dédiées connexion/inscription**.
- Projet Firebase : `cv-builder-214cb`. Configuration Web publique dans `src/lib/firebase.ts`. Pas d’Analytics initialisé, pas de clé d’administration dans le navigateur.
- Firestore : un instantané du CV complet dans `users/{uid}/backups/main` avec révision et date de sauvegarde.
- Chargement du CV à la connexion et sauvegarde automatique après 1,5 seconde sans modification. Aucun abonnement aux données en temps réel nécessaire.
- Interface : chargement, modifications à enregistrer, enregistrement, sauvegardé en ligne, erreur et conflit.
- Conflits entre appareils protégés par transaction ; l’utilisateur choisit la version à conserver.
- Modifications non envoyées conservées localement avec leur révision pour la reprise.
- IndexedDB distinct par compte : `cv-builder-user-<uid>`. L’ancienne base `cv-builder` reste l’espace invité. Les photos locales sont aussi séparées.
- Bouton explicite « Importer mon ancien CV local » pour reprendre les données de l’ancienne version dans le compte. Ne pas copier automatiquement le CV invité vers un nouveau compte.
- Export/import JSON conservé, avec photo et validation ; restauration atomique. Fichier importé : 10 Mo max ; photo PNG/JPEG/WebP : 5 Mo max.
- Photos en ligne prévues dans Cloud Storage, chemins privés par utilisateur. Réutilisation de la photo inchangée pour éviter les envois à chaque modification.
- Assistance IA : résumé, reformulation, adéquation à une offre ; validation des entrées, taille bornée, budget de 10 requêtes/minute par instance. Production désactivée par défaut sauf `AI_PUBLIC_ACCESS=enabled`.

## Vérifications réalisées et limites

- Compilation de production réussie. Les premières erreurs Windows nécessitaient un lancement avec les accès appropriés ; un blocage de pré-rendu de la bibliothèque a été corrigé avec Suspense.
- Dernière suite complète : 11 tests réussis (IA et synchronisation). TypeScript passe aussi après les derniers ajustements du PDF.
- Connexion Google et sauvegarde Firestore vérifiées dans le navigateur. L’utilisateur confirme voir ses données dans Firestore et avoir repris son CV dans Edge.
- Chargement et sauvegarde automatiques vérifiés en navigateur. Changements de compte, réponses tardives, reprise et conflits testés avec des dépendances simulées ; ne pas prétendre qu’un test réel avec deux comptes a été réalisé.
- Contrôle mobile des quatre pages à 320 px : pas de débordement horizontal dans les vues testées. Aperçu de démonstration testé avec 16 expériences. Les formulaires fortement remplis et tous les appareils ne sont pas exhaustivement vérifiés.
- Configuration réelle de Storage, règles Storage et CORS à vérifier avant de promettre le transfert de photos entre appareils. Cloud Storage exige actuellement le forfait Blaze ; aucun forfait payant n’a été activé par l’agent.
- Nettoyage des anciennes photos en ligne à prévoir.
- Les protections IA actuelles ne constituent pas une authentification ni une limite distribuée. Avant ouverture publique, vérifier le jeton Firebase côté serveur et utiliser une limite partagée ; ne pas simplement activer les appels payants publiquement.
- L’isolation locale par compte n’est pas un chiffrement : les données restent sur le disque du navigateur.

## Point prioritaire : le modèle de CV

L’utilisateur a fourni `C:/Users/sylou/Downloads/export.pdf`, examiné et rendu en images. Il présente son vrai CV sur **deux pages mal équilibrées**, avec beaucoup d’espace inutilisé sur la seconde et les loisirs isolés à gauche. L’utilisateur a explicitement signalé le problème.

Décision : viser **une page A4 lisible pour son volume de contenu**, en retravaillant l’en-tête, la photo, les cadres, les espacements et la hiérarchie avant de réduire le texte. Ne pas promettre de faire tenir n’importe quelle quantité de contenu en une page et ne pas supprimer silencieusement des informations.

Corrections déjà apportées :

- Aperçu A4 adapté à la largeur disponible, sans appliquer cette réduction à l’impression.
- Styles d’impression ciblés sur l’export ; correction d’une règle qui masquait aussi la colonne interne du CV.
- Marges A4, conservation des couleurs, règles pour limiter les coupures d’entrées et de cadres.
- Pas de cercle de photo vide lorsque le profil n’a pas de photo.
- Libellé cliquable « Profil LinkedIn » pour éviter que le nom soit coupé lettre par lettre près du QR code.

**Limite :** les derniers ajustements de cadres et LinkedIn n’ont pas été contrôlés sur un nouveau PDF exporté. La règle évitant de couper un cadre peut déplacer tout un bloc et accentuer les espaces vides ; ce n’est pas une solution de mise en page en une page.

L’export actuel ouvre `window.print()` ; choisir « Enregistrer au format PDF », A4, sans en-têtes/pieds de page du navigateur. Le texte du PDF reçu était sélectionnable. L’automatisation du navigateur a été bloquée par la fenêtre d’impression : ne pas confondre un clic sur Exporter et un PDF effectivement vérifié.

Le composant actuel limite aussi certains éléments avec `slice` (missions selon densité, formations, etc.). Auditer ce comportement lors de la refonte pour éviter une perte de contenu non signalée.

## Chantiers demandés pour la reprise

1. **Pages connexion et inscription** dédiées, cohérentes avec la future identité visuelle. Google est le seul fournisseur intégré actuellement. Le choix d’un accès email/mot de passe et ses parcours (vérification, réinitialisation) reste à préciser.
2. **Boîtes de dialogue personnalisées**, accessibles et cohérentes, à la place des `window.confirm` et `window.alert` de l’application : import, récupération, conflits, erreurs photo, etc. Prévoir focus, clavier, Échap et retour au déclencheur. Conserver la confirmation des remplacements de données. La fenêtre d’impression native reste distincte des dialogues applicatifs.
3. **Identité visuelle et logo**, palette, typographie, composants et états homogènes.
4. **Refonte graphique du site**, ergonomie mobile et parcours de création du CV.
5. **Refonte du modèle de CV**, priorité à une page propre pour le CV actuel ; vérifier un vrai PDF court et un long, photo, QR code, liens et coupures.
6. **Déploiement public réel** : choix de l’hébergement compatible Next.js et ses routes serveur, domaine éventuel, variables serveur, domaines Firebase autorisés, règles et CORS, protection des routes IA. Rien ne permet encore d’affirmer que le site est déployé publiquement.
7. **Aperçu lors du partage d’un lien** : titre, description, image Open Graph, métadonnées sociales et favicon. Ne jamais inclure les données privées du CV dans une image ou page publique sans un parcours de partage explicite.
8. Maintenir ce fichier pour permettre à un autre agent de reprendre sans relire le chat.

## Fichiers à lire en priorité

- `src/lib/sync-engine.ts` : moteur de synchronisation, sessions, délais, conflits.
- `src/lib/cloud-sync.ts` : liaison Firebase, stockage et Zustand.
- `src/lib/cloud-backup.ts` : lecture/écriture Firestore, photos Storage, transaction.
- `src/lib/db.ts`, `src/lib/storage.ts` : isolation IndexedDB, métadonnées locales, sauvegardes.
- `src/store/app-store.ts` : données et actions de l’éditeur.
- `src/components/CloudAccount.tsx`, `AppShell.tsx` : compte et navigation.
- `src/components/ResumePreview.tsx`, `ResponsiveResumePreview.tsx` : modèle et aperçu responsive.
- `src/app/export/page.tsx`, `src/app/globals.css` : impression, import/export, styles.
- `src/app/api/ai/*/route.ts`, `src/lib/ai-request.ts` : appels IA et protections.
- `firestore.rules`, `storage.rules`, `storage.cors.json`, `firebase.json`, `.firebaserc` : configuration à comparer avec les règles réellement publiées.
- `tests/cloud-sync.test.cjs`, `tests/ai-request.test.cjs` : tests sans appel Firebase ou IA réel.
- `README.md` : installation et configuration.

## Commandes et précautions de reprise

```text
npm run dev
npx tsc --noEmit
node --test tests/cloud-sync.test.cjs tests/ai-request.test.cjs
npm run build
```

- Lire les changements existants avant de travailler. De nombreux fichiers sont modifiés ou non suivis ; aucun commit n’a été créé pendant cette session. Ne pas écraser ces changements ni faire de reset.
- Conserver les données de l’utilisateur ; ne pas remplacer son CV par un exemple pendant les tests.
- Les artefacts locaux (`artifacts/`, `firebase-rules-review.png`) peuvent contenir des informations personnelles : ne pas les publier dans le site ou dans un dépôt public.
- Préférer des données fictives isolées pour les tests. La route temporaire `preview-check` utilisée pour le contrôle visuel a été supprimée.
- Ne pas ouvrir ou divulguer les secrets de `.env.local`. La configuration Firebase Web publique ne remplace pas des règles d’accès.
- Le téléchargement npm a nécessité temporairement les certificats système de Node (`NODE_OPTIONS=--use-system-ca`). Ne pas désactiver la vérification TLS ni lancer des installations concurrentes.
- Avant de clore une prochaine session, actualiser ici ce qui est terminé, ce qui a été réellement vérifié et les limites restantes.
