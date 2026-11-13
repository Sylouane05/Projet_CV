# CV Builder — suivi et contexte du projet

Dernière mise à jour : 13 novembre 2026.

## Intention du propriétaire

La base technique, les pages de compte, les dialogues, le nouveau modèle de CV et la refonte visuelle du studio sont implémentés. Le site est publié sur https://cv-builder-214cb.web.app avec métadonnées de partage. Les prochains objectifs sont le contrôle du vrai PDF, les essais sur un téléphone réel et les améliorations de produit. Les sections datées ci-dessous distinguent les contrôles réalisés des limites restantes.

L’utilisateur travaille sur son site dans **Edge**. Les onglets Chrome ouverts par les agents étaient des tests temporaires et peuvent disparaître. Ne pas lui demander de retrouver une fenêtre de test fermée.

## État actuel

- Application Next.js 16 / React 19 / TypeScript, Tailwind CSS, Zustand, validation Zod.
- Site public Firebase Hosting : https://cv-builder-214cb.web.app (forfait sans facturation, IA désactivée dans la version statique).
- Pages : `/profile`, `/library`, `/resume`, `/export`. La racine affiche un accueil public distinct de l’éditeur, même pour une personne déjà connectée.
- Profil, expériences, projets, compétences, formations, langues, certifications, loisirs, variantes de CV.
- Authentification Firebase Google avec pages dédiées `/connexion` et `/inscription`, liens dans le panneau latéral et accès invité conservé. Google uniquement, conformément au choix explicite du propriétaire.
- Projet Firebase : `cv-builder-214cb`. Configuration Web publique lue par `src/lib/firebase.ts` depuis `NEXT_PUBLIC_FIREBASE_*` dans `.env.local`. Pas d’Analytics initialisé, pas de clé d’administration dans le navigateur.
- Firestore : un instantané du CV complet dans `users/{uid}/backups/main` avec révision et date de sauvegarde.
- Chargement du CV à la connexion et sauvegarde automatique après 1,5 seconde sans modification. Aucun abonnement aux données en temps réel nécessaire.
- Interface : chargement, modifications à enregistrer, enregistrement, sauvegardé en ligne, erreur et conflit.
- Conflits entre appareils protégés par transaction ; l’utilisateur choisit la version à conserver.
- Modifications non envoyées conservées localement avec leur révision pour la reprise.
- IndexedDB distinct par compte : `cv-builder-user-<uid>`. L’ancienne base `cv-builder` reste l’espace invité. Les photos locales sont aussi séparées.
- Bouton explicite « Importer mon ancien CV local » pour reprendre les données de l’ancienne version dans le compte. Ne pas copier automatiquement le CV invité vers un nouveau compte.
- Export/import JSON conservé, avec photo et validation ; restauration atomique. Fichier importé : 10 Mo max ; photo PNG/JPEG/WebP : 5 Mo max.
- Nouvelles sauvegardes cloud version 2 : photo JPEG allégée intégrée au document Firestore privé, sans Cloud Storage. Le format JSON exporté reste version 1. Voir la section de migration sans facturation ci-dessous.
- Assistance IA : résumé, reformulation, adéquation à une offre ; validation des entrées, taille bornée, budget de 10 requêtes/minute par instance. Production désactivée par défaut sauf `AI_PUBLIC_ACCESS=enabled`.

## Vérifications réalisées et limites

- Compilation de production réussie. Les premières erreurs Windows nécessitaient un lancement avec les accès appropriés ; un blocage de pré-rendu de la bibliothèque a été corrigé avec Suspense.
- Dernière suite complète : 31 tests réussis (IA, synchronisation et document CV). TypeScript passe aussi après les derniers ajustements du PDF.
- Connexion Google et sauvegarde Firestore vérifiées dans le navigateur. L’utilisateur confirme voir ses données dans Firestore et avoir repris son CV dans Edge.
- Chargement et sauvegarde automatiques vérifiés en navigateur. Changements de compte, réponses tardives, reprise et conflits testés avec des dépendances simulées ; ne pas prétendre qu’un test réel avec deux comptes a été réalisé.
- Contrôle mobile des quatre pages à 320 px : pas de débordement horizontal dans les vues testées. Aperçu de démonstration testé avec 16 expériences. Les formulaires fortement remplis et tous les appareils ne sont pas exhaustivement vérifiés.
- Cloud Storage est bloqué par le forfait actuel, constaté dans la console. Les nouvelles sauvegardes n’en dépendent plus ; le téléchargement hérité d’une photo version 1 peut encore en dépendre si elle est absente localement. Aucun forfait payant activé.
- Nettoyage des anciennes photos en ligne à prévoir.
- Les protections IA actuelles ne constituent pas une authentification ni une limite distribuée. Avant ouverture publique, vérifier le jeton Firebase côté serveur et utiliser une limite partagée ; ne pas simplement activer les appels payants publiquement.
- L’isolation locale par compte n’est pas un chiffrement : les données restent sur le disque du navigateur.

## Constat sur l’ancien modèle de CV (avant refonte)

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

L’ancien composant limitait certains éléments avec `slice` (missions selon densité, formations, etc.). Ces limites sont supprimées dans la refonte décrite ci-dessous.

## Chantiers demandés pour la reprise

1. **Pages connexion et inscription** dédiées, cohérentes avec la future identité visuelle. Réalisées avec Google uniquement, choix explicite du propriétaire. Les parcours e-mail/mot de passe ne sont pas demandés pour cette étape.
2. **Boîtes de dialogue personnalisées**, accessibles et cohérentes, à la place des `window.confirm` et `window.alert` de l’application : import, récupération, conflits, erreurs photo, etc. Prévoir focus, clavier, Échap et retour au déclencheur. Conserver la confirmation des remplacements de données. La fenêtre d’impression native reste distincte des dialogues applicatifs.
3. **Identité visuelle et logo** réalisés : palette, typographie, composants et états homogènes. Voir la section datée de refonte du studio.
4. **Refonte graphique du site** réalisée pour les quatre écrans, avec contrôle responsive à 320 px.
5. **Refonte du modèle de CV** implémentée et vérifiée sur contenu fictif. Reste à vérifier le vrai PDF court et un long, photo, QR code, liens et coupures.
6. **Déploiement public réel** réalisé sur Firebase Hosting : https://cv-builder-214cb.web.app. Export statique, sans routes IA ni activation de facturation ; voir les contrôles de publication en fin de suivi.
7. **Aperçu lors du partage d’un lien** réalisé : titre, description, PNG Open Graph, métadonnées sociales et favicon, sans données privées du CV.
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

## Alerte Google API key après publication GitHub

Le propriétaire a publié le dépôt sur GitHub et reçu une alerte « Google API key ». La clé Firebase était en clair dans `src/lib/firebase.ts` ; elle a été déplacée dans `.env.local`, avec toute la configuration Web. Le fichier `.env.example` ne contient que les noms des variables ; `.env*` reste ignoré sauf cet exemple.

Un contrôle de toutes les révisions locales a trouvé une version de `src/lib/firebase.ts` contenant la clé Google, dans le commit `ba9d71d`. Aucun motif de clé OpenAI ou de clé privée de compte de service n’a été trouvé dans cet historique local. Cela ne constitue pas un audit des branches distantes, des journaux, ni des restrictions du compte Google Cloud.

Les captures `artifacts/` et `firebase-rules-review.png`, qui étaient suivies, sont retirées de l’index Git et ajoutées au gitignore sans supprimer les copies locales. Les versions déjà publiées restent potentiellement dans l’historique GitHub.

Le propriétaire indique avoir réglé l’alerte et demande de poursuivre le projet. Les restrictions et la rotation n’ont pas été revérifiées par l’agent. Aucun changement de clé ou de restrictions Google Cloud, aucune réécriture d’historique, aucun commit ni push n’a été réalisé par l’agent pour cette correction. Ne pas prétendre que l’alerte distante est résolue.

Attention : `NEXT_PUBLIC_*` reste visible dans le navigateur après compilation. La séparation du dépôt n’est pas une protection d’accès ; les règles Firebase et les restrictions de clé restent nécessaires.

## Pages de compte et dialogues intégrés — 13 novembre 2026

Choix confirmé par le propriétaire : **Google uniquement pour commencer**, sans formulaire e-mail/mot de passe.

Implémentation :

- `/connexion` et `/inscription` utilisent `src/components/AuthPage.tsx` et un habillage dédié sans barre latérale d’édition. Palette vert profond, ivoire et accent clair ; illustration de CV en HTML/CSS. Il s’agit d’une première direction visuelle pour les pages de compte, pas de la refonte complète ni du logo final.
- Liens croisés connexion/inscription, retour au CV et mode invité. L’inscription explique qu’une première connexion Google crée le compte ; elle ne crée pas un second compte pour un utilisateur existant.
- Connexion Google via le SDK existant, état occupé, erreurs en français (`src/lib/auth-errors.ts`), retour au profil après succès. Une personne déjà connectée retrouve un lien pour accéder à son CV.
- Titres et descriptions propres aux deux pages. Métadonnées de partage globales et image Open Graph restent à faire.
- `src/components/DialogProvider.tsx`, monté dans le layout, remplace tous les `window.confirm`/`window.alert` applicatifs présents à cette étape. API asynchrone `confirm` et `notify`, demandes mises en file.
- Fenêtre HTML `dialog` personnalisée : fond atténué, annulation initiale, focus contenu avec Tab/Maj+Tab, fermeture par Échap, croix ou fond, retour du focus au déclencheur. Les confirmations de remplacement restent explicites.
- Intégration à la restauration JSON, à la récupération cloud, au choix de version lors d’un conflit, à l’import de l’ancien CV local et aux erreurs de photo.
- Vérification du compte avant d’appliquer une action confirmée pour éviter d’exécuter une ancienne demande après un changement de compte.
- La fenêtre native d’impression et la fenêtre d’authentification Google ne sont pas remplacées.

Vérifications en navigateur : pages de compte sur ordinateur et à 390/320 pixels, liens croisés, accès invité ; ouverture puis annulation d’un import fictif ; validations/notifications sans opération sur des données réelles ; focus initial, boucle clavier avant/arrière, Échap et retour du focus. La connexion Google depuis `/connexion` a abouti au profil. Confirmation cloud ouverte puis annulée sur le compte connecté sans modifier le CV.

Une route de test temporaire `/dialog-check` a servi à vérifier le clavier et a été supprimée. Captures locales ignorées par Git : `artifacts/connexion-desktop.png`, `artifacts/inscription-mobile.png`, `artifacts/dialogue-restauration-mobile.png`. Les tests de création d’un compte Google entièrement neuf ne sont pas réalisés.

Le serveur local a été relancé avec `npm run dev -- --webpack` pour la vérification sur Windows. Ne pas ouvrir les anciens onglets d’erreur du navigateur intégré comme s’ils étaient la page courante.

Contrôles finaux de cette étape : compilation de production réussie (routes connexion et inscription présentes, route de test absente), TypeScript validé pendant la compilation, lint des cinq nouveaux fichiers validé, 11 tests IA/synchronisation réussis. La suppression de la route de test avait laissé des types de développement obsolètes ; seuls ces fichiers générés ont été nettoyés avant la compilation réussie.

## Refonte du modèle de CV — 13 novembre 2026

- Nouveau composant de document pur `src/components/ResumeDocument.tsx` ; `ResumePreview.tsx` ne gère que les photos locales et le QR LinkedIn.
- Papier A4, police Arial sans chargement distant, en-tête compact, photo de 25 mm, QR à droite, coordonnées sur la largeur, colonne latérale légère et rubriques sans cadres.
- Taille de corps normale : 13 px (environ 9,75 pt). Les modes compact/normal/aéré changent la typographie et les espacements, jamais le nombre de missions affichées.
- Suppression des limites arbitraires de nombre de missions, formations, liens, compétences et loisirs. Les rubriques vides sont omises du document. Le texte entre crochets est conservé. Les préférences de visibilité restent appliquées.
- Ordre de sélection des expériences et projets conservé ; niveaux de compétences affichés si l’option est active. Ordre des rubriques respecté dans leur colonne respective. Technologies d’expérience/projet affichées si renseignées.
- Dates mensuelles en français, coordonnées et liens web cliquables ; seuls les protocoles http/https sont autorisés pour les liens web saisis.
- Nouvelle couleur par défaut vert profond pour les variantes nouvellement créées. Les variantes existantes conservent leur couleur enregistrée.
- L’aperçu responsive affiche une **estimation** du nombre de pages A4 et un avertissement si le contenu dépasse. Le document s’allonge au lieu de couper les données. Cette estimation ne remplace pas un contrôle du PDF réel, notamment lorsque les règles de saut de page déplacent un bloc.
- L’export attend les photos/QR et leur décodage ; les erreurs d’image sont signalées. Un changement de compte ou de version pendant sa préparation annule l’export en cours. Les URL temporaires de photos sont libérées au démontage.

Vérification :

- Jeu fictif comparable en volume au CV reçu : photo, QR, six groupes de compétences, deux expériences, quatre projets, deux formations, langues, certification et loisirs. En mode normal, la dernière entrée se termine vers 1015 px sur une page A4 de 1123 px (largeur 794 px), à l’intérieur de la zone utile. Inspection visuelle complète réussie.
- Même exemple importé dans le mode invité du site **compilé**, sur une origine de test isolée (port 4178). Photo locale et QR chargés sans erreur, compteur « 1 page estimée ».
- Test d’une mission fictive très longue via l’interface de bibliothèque : compteur « 3 pages estimées », marqueur final présent dans le document. Données fictives remises dans leur état normal après le test.
- Aperçu réel à 320 px : largeur utilisée égale à la largeur disponible, sans débordement horizontal.
- 16 tests réussis : les 11 précédents et 5 nouveaux tests dans `tests/resume-document.test.cjs` (missions conservées dans toutes les densités, longues listes, visibilité/sélections sans modification des données, protocoles de liens, ordre et niveaux).
- Compilation de production réussie et lint des trois composants du modèle/aperçu validé.

Les données fictives de test sont dans `tests/fixtures/resume.cjs`. Les aperçus HTML et les captures sont ignorés par Git dans `artifacts/resume-qa/`, `artifacts/nouveau-modele-cv.png` et `artifacts/apercu-cv-nouveau-modele.png`. Aucun nouveau CV fictif n’a été envoyé dans le compte Firebase du propriétaire. Aucun serveur Next de développement n’a été lancé ou arrêté sur le port 3000 pendant cette étape ; seuls les serveurs de test 4177/4178 ont été utilisés puis arrêtés.

**Reste à confirmer :** exporter le vrai CV du propriétaire avec ce nouveau modèle et contrôler le nombre de pages et les coupures dans ce PDF. Aucun nouveau PDF n’a été produit pendant cette étape. Le vieux fichier `Downloads/export.pdf` ne représente plus le modèle actuel.

Prochains chantiers restants après la refonte du studio : déploiement public, aperçu Open Graph du lien partagé et contrôle du vrai PDF. Les pages de compte et les dialogues sont déjà réalisés ; ne pas les recommencer.


## Identité et refonte du studio — 13 novembre 2026

- Logo vectoriel CV sur une feuille pliée : `Brand.tsx`, `public/brand-mark.svg`, icône SVG et favicon. Même identité sur les pages de compte et dans le studio.
- Palette vert profond, ivoire et sauge, navigation latérale sur ordinateur, navigation compacte et menu de compte sur mobile. Barre d’état de sauvegarde conservée ; commandes cloud secondaires regroupées dans un panneau repliable.
- Titres et cartes homogènes pour profil, bibliothèque, composition et export (`StudioPageHeader.tsx`, styles `.studio-*`).
- Profil : sections avec icônes, champs mieux identifiés, sélecteur photo accessible au clavier, aperçu réel et progression sur six catégories réellement renseignées (`ProfileAside.tsx`). Aucun faux score de qualité du CV.
- Composition : réglages à gauche et aperçu à droite sur grand écran ; assistance pour une offre repliée par défaut. Confirmation intégrée pour supprimer une version et protection de la dernière version.
- Export : aperçu mis en valeur et sauvegardes JSON dans un panneau repliable. Les éléments du studio sont exclus de l’impression ; styles du papier A4 isolés des styles de formulaire.
- Les nouveaux profils et les nouvelles lignes de formation/langue/certification commencent vides. Le schéma accepte ces brouillons incomplets après sauvegarde ; le document omet les lignes vides. Les données existantes ne sont pas remplacées.
- Contrôles : 17 tests réussis, dont la conservation et l’omission des lignes de formulaire vides ; mise à jour immédiate de l’aperçu vérifiée avec un intitulé fictif, puis valeur restaurée. Contrôles visuels sur origine invitée de test isolée 4178, sans connexion ni écriture Firebase. Captures ignorées par Git dans `artifacts/studio-*.png`.
- Vérification finale : compilation de production et TypeScript réussis, lint des huit composants concernés et `git diff --check` réussis. Les quatre routes à 320 px ne débordent pas horizontalement ; le menu de compte mobile et les panneaux repliables fonctionnent. Le serveur de vérification 4178 est temporaire ; aucun serveur sur le port 3000 n’a été arrêté.
- Le site n’est toujours pas déployé publiquement. Le vrai PDF du propriétaire reste à exporter et contrôler ; la refonte du studio ne vaut pas validation du PDF final.


## Erreur Firebase Storage signalée — 13 novembre 2026

Le propriétaire rencontre `storage/retry-limit-exceeded` en même temps qu’une note annonçant la sauvegarde automatique. Ce code indique un délai dépassé pour une opération Storage ; il ne prouve à lui seul ni un défaut de règles, ni un bucket absent, ni un problème CORS.

- Le transfert de la photo précède la transaction Firestore dans `saveCloud`. Une erreur d’envoi empêche donc l’enregistrement de cette nouvelle version du CV en ligne. Aucun contournement ne supprime ou n’omet la photo.
- `syncErrorMessage` dans `sync-engine.ts` traduit les erreurs de délai, configuration, quota, connexion et permissions. Utilisé par le moteur et les actions du compte.
- La note du compte n’annonce plus une sauvegarde réussie pendant une erreur/conflit et distingue une erreur locale.
- 19 tests passent, dont une simulation d’échec du transfert : état courant conservé, aucun checkpoint de sauvegarde cloud réussi, message explicite en français.
- Question en attente au propriétaire : dans Firebase Storage, onglet Fichiers existant ou invitation à commencer/activer Blaze ? L’activation du service, le forfait, le bucket réel, les règles publiées et les erreurs réseau restent à vérifier. Ne pas annoncer que l’envoi réel est réparé ; aucun changement de console ou forfait n’a été effectué.


### Diagnostic réel de Storage — 13 novembre 2026

Après la réponse « je ne vois rien d’anormal », inspection en lecture seule du projet `cv-builder-214cb` dans la console Firebase, page `/storage`. La console affiche explicitement : « Pour utiliser Storage, vous devez faire passer votre projet à un forfait supérieur », avec un bouton « Changer le forfait du projet ». Le service Storage est donc bloqué par le forfait actuel ; l’envoi des photos ne peut pas être annoncé opérationnel. Aucun forfait, règle, bucket ni donnée utilisateur n’a été modifié. L’onglet existant du navigateur intégré est resté sur la page Storage.

Décision demandée au propriétaire : rester sans facturation et adapter le stockage des photos, ou activer lui-même Blaze avec facturation à l’usage. Ne pas activer un forfait payant à sa place. Ne pas supprimer silencieusement la photo ou déclarer la nouvelle sauvegarde complète si elle manque.


## Photos dans Firestore sans facturation — 13 novembre 2026

Choix explicite du propriétaire : rester sans facturation et adapter le stockage des photos.

- `cloud-photo.ts` prépare une copie JPEG dans le navigateur : côté maximal 640 px, repli possible 480/320 et qualité décroissante pour tenir dans 220 000 caractères encodés. Pas de recadrage ; fond blanc pour une image transparente. Aucun service externe de traitement.
- `cloud-backup.ts` enregistre le CV et cette photo dans la même transaction `users/{uid}/backups/main`, format cloud version 2, champ `photo` et `photoPath: null`. Plus aucun upload Storage. Contrôle avant envoi du volume JSON total à 900 000 octets (marge sous la limite Firestore de 1 Mio, qui reste applicable). Aucune omission silencieuse de la photo ou du texte.
- Lecture des versions 1 et 2. Une ancienne photo référencée dans Storage utilise d’abord l’asset local du même compte ; faute d’asset, le chemin de téléchargement Storage hérité est conservé. Une ancienne sauvegarde sans photo reste lisible.
- `exportBundle` utilise le compte capturé explicitement pendant une sauvegarde. Transactions, révisions, conflits et contrôles de changement de compte conservés.
- `importBundle` préserve l’original local d’un même identifiant pendant une restauration cloud. Un import JSON explicite conserve le comportement de remplacement voulu. Le format JSON d’import/export reste version 1.
- `firebase.ts` n’initialise plus Storage au démarrage ; la variable de bucket devient utile uniquement à la compatibilité héritée.
- Règles Firestore version 2 publiées dans la console Firebase du projet `cv-builder-214cb` : propriétaire uniquement, validation du JPEG, de son identifiant et de la taille ; format version 1 encore accepté. La console a retiré l’état « modifications non publiées » après publication. Aucun forfait, compte ni donnée CV modifié manuellement.
- Vérifications : 26 tests réussis, TypeScript et compilation de production réussis, lint des quatre fichiers concernés et `git diff --check` réussis. Nouveaux tests de sauvegarde/restauration sans Storage, migration depuis la photo locale, original conservé, import JSON explicite, absence/erreur/volume excessif, conflits, changement de compte et suppression de photo.
- Contrôle réel du code de compression dans un navigateur sur page isolée et image fictive 1800×1200 : sortie JPEG 640×427, 12 979 caractères, sérialisation/restitution réussies et original inchangé. Capture locale ignorée `artifacts/photo-firestore-verification.png`. Serveur de contrôle 4180 arrêté ; aucun serveur sur le port 3000 arrêté.
- Le contrôle de l’application ouverte dans Edge n’a pas abouti : l’autorisation d’accès à l’app a expiré. La sauvegarde réelle du CV du propriétaire avec ce nouveau format n’a pas encore été observée. Lui demander de recharger son site puis « Options du compte → Réessayer la connexion / Sauvegarder maintenant » et attendre « Sauvegardé en ligne ». Ne pas annoncer ce transfert réel comme déjà confirmé.
- Un ancien client ouvert doit être rechargé pour comprendre le format cloud version 2. Le forfait gratuit conserve ses quotas ; aucune capacité illimitée ni ouverture publique n’est promise.


## Préparation Firebase Hosting — 13 novembre 2026

Choix confirmé : Firebase Hosting sans facturation, assistance IA désactivée pour cette première publication (pas Vercel, pas Firebase App Hosting/Blaze).

- `npm run build:hosting` (`scripts/build-hosting.cjs`) exporte les fichiers statiques dans `out/`. Ce dossier seul est destiné à Hosting. Le script force l’IA côté client à indisponible et la production IA à désactivée, vérifie les six pages, l’image de partage, l’absence de routes API et de fichiers privés. Les fonctions IA restent dans les sources pour le développement ou un futur hébergement avec serveur.
- `firebase.json` configure l’hébergement statique, les pages avec slash final, une redirection de la racine vers le profil et les en-têtes de cache/type d’image. La publication est ciblée `--only hosting --project cv-builder-214cb` ; ne pas lancer un déploiement global des règles/Storage.
- `AppProviders.tsx` reprend l’initialisation client ; le layout racine devient serveur pour les métadonnées. `opengraph-image.tsx` génère un PNG statique 1200×630 aux couleurs du studio, sans CV ni donnée personnelle. Titres/descriptions/Open Graph/Twitter configurés. `SITE_URL` permet de remplacer l’origine par défaut `https://cv-builder-214cb.web.app`.
- Les contrôles IA sont masqués dans la version Hosting. Le mode local conserve ses fonctions habituelles. `AppShell` normalise le slash final pour maintenir les pages de compte sans navigation d’édition et éviter une action d’export en double.
- Export statique réussi, TypeScript et lint des nouveaux composants validés, 26 tests existants réussis. Contrôle des fichiers : six routes HTML, image PNG présente, aucun dossier API ni fichier privé. Inspection visuelle de la carte de partage réussie (`artifacts/apercu-partage.png`, ignorée par Git).
- Contrôle en navigateur des fichiers statiques sur 127.0.0.1:4178 : navigation profil/bibliothèque/composition/export fonctionnelle, boutons IA absents du profil et de la composition. Ce port de test est distinct du site du propriétaire ; aucune donnée personnelle ni connexion Google de test ajoutée.
- Blocage actuel de la publication : `firebase hosting:sites:list --project cv-builder-214cb --json` répond que les identifiants CLI ont expiré. Il faut que le propriétaire exécute `firebase login --reauth` et termine sa connexion. Cette étape lui a été demandée après préparation et contrôles des fichiers. Aucun site cible n’a encore pu être listé, et aucun déploiement Hosting n’a été réalisé. Ne pas présenter l’adresse prévue comme déjà publiée.
- Après reconnexion : lister les sites du projet pour confirmer la cible (ne pas écraser un autre site existant), publier Hosting uniquement, contrôler HTTPS/pages/OG/en-têtes, puis la connexion Google et les domaines autorisés. La sauvegarde réelle avec photo et le vrai PDF restent à confirmer, comme indiqué dans les sections précédentes.


### Publication effective et vérification — 13 novembre 2026

- Le propriétaire a renouvelé sa connexion Firebase CLI. Après activation temporaire des certificats système Node (`NODE_OPTIONS=--use-system-ca`, sans désactiver TLS), la liste des sites a confirmé l’unique site par défaut `cv-builder-214cb`, avec l’identifiant de l’application Web du CV Builder.
- `firebase deploy --only hosting --project cv-builder-214cb --non-interactive` a publié 100 fichiers depuis `out/`. La CLI confirme « release complete » et « Deploy complete ». Adresse publique réelle : **https://cv-builder-214cb.web.app**. Aucun forfait payant, Cloud Functions, App Hosting ou Storage activé. Aucun changement des règles Firestore pendant cette publication.
- Vérifications HTTPS après publication : racine redirigée vers `/profile/`, les six pages répondent 200, titres et métadonnées Open Graph corrects. Image `/opengraph-image` : 200, `image/png`, 1200×630. Le partage ne contient aucune donnée du compte ou du CV.
- Dans la console, les domaines `cv-builder-214cb.web.app` et `cv-builder-214cb.firebaseapp.com` sont déjà autorisés dans Authentication (aucune modification nécessaire).
- La connexion Google a réellement abouti dans le navigateur intégré du site public. Le profil du propriétaire et sa photo sont apparus, avec l’état « Sauvegardé en ligne ». La récupération du compte et de sa photo sur cette nouvelle origine est donc observée. Aucune édition volontaire ni réimport/remplacement de son CV n’a été fait pendant ce contrôle ; cela ne constitue pas un test de nouvelle modification sauvegardée depuis le site public.
- Navigation connectée profil → bibliothèque → composition → export → profil vérifiée avec attente des titres/commandes des pages. IA absente dans la publication statique. Pages connexion/inscription et navigation invitée testées localement sur les mêmes fichiers exportés ; absence de débordement à 320 px dans les vues locales vérifiées.
- L’override de largeur n’a pas redimensionné l’onglet public comme attendu ; ne pas prétendre qu’un essai public mobile à 320 px ou sur un vrai téléphone a été fait. Réglage temporaire réinitialisé. L’onglet public est conservé comme résultat ; aucun serveur local de test laissé en fonctionnement.
- Compilation Hosting/TypeScript réussis, lint des six fichiers d’infrastructure/présentation concernés et 26 tests réussis. `git diff --check` réussi. Source locale modifiée, sans commit ni push GitHub. L’hébergement publié n’est pas encore relié à un déploiement automatique depuis GitHub.
- Documentation README et suivi actualisés. Carte publique de partage : `artifacts/apercu-partage.png`, sans donnée personnelle. La capture de test du site (`artifacts/site-public-firebase.png`) est locale/ignorée.
- Restent : essai sur téléphone réel, nouvelle modification/sauvegarde depuis le site public, contrôle du vrai PDF (pagination et coupures), éventuel domaine personnalisé et choix futur d’une assistance IA avec serveur sécurisé.


## Accueil public et recherches de bibliothèque — 13 novembre 2026

- Demande : ouvrir le lien sur un écran d’accueil et ajouter une recherche dans chaque onglet de la bibliothèque.
- La racine `/` propose une présentation du studio, trois étapes, des liens connexion/inscription et un accès invité. Aucun renvoi automatique vers le profil, même connecté. `AppShell` exclut cette page de la navigation d’édition ; tous les logos renvoient désormais à l’accueil. La redirection de racine dans `firebase.json` a été supprimée.
- Chaque onglet (expériences, projets, compétences, loisirs) possède sa recherche avec libellé adapté, nombre d’éléments affichés, bouton d’effacement et état sans résultat. Recherche insensible aux accents/majuscules, sur plusieurs mots et les champs pertinents (missions, technologies, entreprise, domaine, etc.). Les symboles de technologies comme C++ sont conservés.
- Recherches indépendantes conservées pendant les changements d’onglet, sans sauvegarde dans Firestore ni modification des données filtrées. L’ajout efface le filtre de l’onglet pour rendre la nouvelle fiche visible. Paramètres d’onglet inconnus ramenés aux expériences.
- `src/lib/library-search.ts` contient le filtrage pur ; `tests/library-search.test.cjs` ajoute cinq tests de recherche/accents/mots multiples/indépendance/préservation des données et paramètres invalides. Total : 31 tests réussis. Compilation Hosting et TypeScript réussis, lint du nouvel accueil, du filtrage, de Brand et AppShell validé ; contrôle de diff réussi.
- Vérifications en navigateur sur une origine invitée isolée 127.0.0.1:4181 : accueil sans barre d’édition, accès invité, recherches des quatre onglets sur données fictives, accents, recherche sans résultat, effacement, maintien des recherches par onglet et ajout sous filtre. Aucun CV fictif envoyé à Firebase, aucune modification de son vrai CV. Serveur 4181 arrêté après les essais.
- Publication Hosting effectuée sur https://cv-builder-214cb.web.app : CLI « Deploy complete ». Racine HTTPS 200, sans Location ni redirection HTML, avec le titre d’accueil. Les quatre champs de recherche sont présents dans la bibliothèque publique. Navigation accueil → espace → bibliothèque → accueil vérifiée sur le compte connecté existant, sans édition du CV.
- Captures locales ignorées par Git : `artifacts/accueil-public.png`, `artifacts/accueil-desktop.png`, `artifacts/recherche-bibliotheque.png` (cette dernière contient uniquement des données fictives). L’onglet public est laissé sur l’accueil. Pas de commit ni push GitHub. Pas d’essai sur téléphone réel pendant cette étape.


## Retour à l’accueil après déconnexion — 13 novembre 2026

- `CloudAccount.tsx` attend le succès de `signOut`, puis appelle `router.replace("/")`. En cas d’échec, le traitement d’erreur existant garde la page et affiche le message. Aucun CV supprimé ou remplacé.
- Compilation Hosting/TypeScript, lint du composant et contrôle de diff réussis. Test existant ciblé de déconnexion du moteur de synchronisation réussi (effacement de l’écran et réponses tardives ignorées).
- Correction publiée sur Firebase Hosting. Le premier essai dans l’onglet existant a utilisé des références de modules d’une ancienne version : déconnexion effective mais maintien sur le profil. Le bundle actuel publié a été contrôlé et contient bien l’attente de `signOut` suivie de `replace("/")`. La nouvelle tentative de connexion Google n’a pas abouti dans le navigateur de test ; ne pas annoncer une vérification bout en bout réussie du nouveau clic de déconnexion.
- `firebase.json` ajoute une revalidation des pages et des données de navigation (`public,max-age=0,must-revalidate`) pour éviter de conserver des pages d’anciennes publications pendant une heure. Les fichiers versionnés `/_next/static/**` conservent leur cache immutable d’un an. En-têtes réels vérifiés après publication : 200 et valeurs attendues. Une actualisation forcée peut être nécessaire une fois pour un onglet déjà ancien.
- L’onglet de test est laissé sur l’accueil. Capture locale sans donnée privée : `artifacts/deconnexion-accueil.png`. Aucun commit ni push GitHub.
