# CV Builder

Pour reprendre le projet : lire [SUIVI_PROJET.md](SUIVI_PROJET.md) (état actuel, décisions et prochains chantiers).

Application de création de CV : profil, bibliothèque, variantes, export PDF et sauvegardes JSON avec photo.

Site public : **https://cv-builder-214cb.web.app** — Firebase Hosting, version sans assistance IA.

## Démarrage

- Copier `.env.example` vers `.env.local` et renseigner les valeurs Firebase ; garder `OPENAI_API_KEY` côté serveur.
- `npm install`
- `npm run dev`
- `npm run build` puis `npm start` pour la production.
- `npx tsc --noEmit` pour vérifier les types.
- `node --test tests/*.test.cjs` pour tester les protections IA et les transitions de synchronisation sans appel payant.

## Assistance IA

Définir `OPENAI_API_KEY` côté serveur dans `.env.local`. Ne jamais exposer cette clé dans une variable publique.
En production, les appels sont désactivés par défaut. `AI_PUBLIC_ACCESS=enabled` les active explicitement.
La protection actuelle limite les appels à 10 par minute et par instance serveur, avec un contenu maximal de 128 Ko et des champs bornés.
Cette limite en mémoire est réinitialisée au redémarrage et ne constitue pas une authentification. Avant une ouverture publique, ajouter un accès utilisateur et une limite partagée entre les instances. Configurer aussi un budget auprès du fournisseur.

## Données et PDF

Les données restent dans le navigateur (IndexedDB), sauf le contenu envoyé lors des actions IA.
Exporter régulièrement une sauvegarde JSON. L’import remplace les données après confirmation ; la photo et l’état sont restaurés dans une même transaction.
Photos acceptées : JPEG, PNG, WebP, 5 Mo maximum. Sauvegardes importées : 10 Mo maximum.
L’export PDF ouvre l’impression du navigateur : choisir « Enregistrer au format PDF » et désactiver les en-têtes/pieds de page du navigateur.

## Firebase : première étape de migration

Le panneau latéral propose la connexion Google. Le CV du compte est chargé à la connexion puis sauvegardé automatiquement après 1,5 seconde sans modification. L’état « Enregistrement… » / « Sauvegardé en ligne » confirme les transferts. Aucun abonnement temps réel n’est utilisé.

Chaque compte dispose d’une base IndexedDB distincte (`cv-builder-user-<uid>`), photos comprises. L’ancien stockage `cv-builder` reste l’espace invité, sans migration automatique vers un compte. À la déconnexion, les données du compte quittent l’écran ; sa copie locale reste disponible pour sa prochaine connexion. Sur un appareil partagé, l’isolation applicative ne remplace pas une session Windows privée.

Les modifications non envoyées et leur révision sont conservées localement. Une reconnexion reprend leur envoi si le CV en ligne n’a pas changé. Sinon, l’utilisateur choisit la version à conserver. Les transactions refusent aussi un écrasement concurrent pendant une sauvegarde. Les boutons de sauvegarde immédiate et de récupération restent disponibles.

Sans connexion réseau, les modifications du compte restent locales : le site ne prétend pas les avoir sauvegardées en ligne. Le bouton de réessai et le retour du réseau relancent la synchronisation. Fermer la page avant l’envoi laisse les modifications locales en attente pour la prochaine connexion.

Configuration à effectuer dans le projet `cv-builder-214cb` :

1. Authentication : activer Google, choisir une adresse de support et autoriser `localhost` ainsi que le domaine du site.
2. Créer la base Firestore par défaut.
3. Publier le contenu de `firestore.rules` dans Firestore > Règles.
4. Les photos sont préparées dans le navigateur (JPEG, côté maximal de 640 px) et enregistrées dans le document Firestore privé avec le CV. Cloud Storage, sa facturation et ses règles CORS ne sont pas nécessaires pour les nouvelles sauvegardes.
5. Publier les règles Firestore mises à jour pour accepter le format de sauvegarde version 2. Avec Firebase CLI installé et connecté au bon projet : `firebase deploy --only firestore:rules`.

Validation réelle : connexion Google, sauvegarde, restauration dans un autre navigateur, puis vérifier qu’un second compte ne peut pas accéder aux données du premier. Ces opérations nécessitent les services et les règles activés dans la console. La configuration Web publique est chargée depuis les variables `NEXT_PUBLIC_FIREBASE_*` de `.env.local` ; aucune clé d’administration n’est nécessaire côté navigateur. Analytics n’est pas initialisé.

La copie cloud de la photo est limitée à 220 000 caractères de données encodées. Le CV et la photo sont écrits ensemble dans une transaction ; les sauvegardes trop volumineuses sont refusées avant envoi (seuil JSON prudent de 900 000 octets). Le document Firestore reste soumis à sa limite réelle de 1 Mio et aux quotas du forfait Spark. Aucun forfait payant n’est requis ni activé par cette adaptation.

L’original est conservé dans les assets locaux du navigateur lorsqu’une copie allégée avec le même identifiant est récupérée du cloud. Un import JSON explicite continue de remplacer la photo comme demandé. Les sauvegardes cloud version 1 sans photo restent lisibles ; celles avec un ancien chemin Storage utilisent d’abord la photo locale du même compte, sinon le téléchargement hérité reste nécessaire. Le fichier JSON exporté conserve le format version 1 et la photo disponible localement.

Le bouton « Importer mon ancien CV local » copie explicitement le CV invité de ce navigateur dans le compte connecté après confirmation. Le stockage invité et le fichier JSON sont conservés. Ce bouton permet de reprendre les données de la version précédente sans les attribuer automatiquement à un autre utilisateur.

## Configuration et clés publiées

`.env.local` et les autres fichiers `.env*` sont ignorés par Git. Seul `.env.example`, sans valeurs, est destiné au dépôt. Les captures de contrôle dans `artifacts/` sont locales et ne doivent pas être publiées.

Les variables `NEXT_PUBLIC_FIREBASE_*` sont incorporées au JavaScript du navigateur par Next.js : les déplacer hors du code source évite de les commettre, mais ne les rend pas secrètes dans un site déployé. Restreindre la clé Google aux services Firebase nécessaires et aux sites autorisés. `OPENAI_API_KEY` doit rester uniquement côté serveur.

Si une clé Google a déjà déclenché une alerte, vérifier ses restrictions dans Google Cloud et effectuer sa rotation selon l’alerte. Mettre la nouvelle valeur dans `.env.local` et dans la configuration de l’hébergement, redémarrer/reconstruire, puis vérifier le site avant de révoquer l’ancienne. Le retrait du fichier actuel ne supprime pas sa présence dans l’historique Git. Ne pas fermer l’alerte en la déclarant résolue avant d’avoir contrôlé la clé et ses usages.

Références : https://firebase.google.com/docs/projects/api-keys et https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository .

## Connexion et confirmations

Les pages `/connexion` et `/inscription` proposent Google uniquement. La première connexion Google crée le compte ; les connexions suivantes retrouvent le même espace. Le mode sans compte reste accessible et n’envoie pas automatiquement le CV invité vers Firebase.

Les confirmations et les notifications applicatives sont intégrées au site, avec navigation au clavier et fermeture par Échap. Les fenêtres gérées par Google et l’impression restent celles de leurs services respectifs.

## Modèle A4 et contenu

Le modèle de CV utilise un en-tête compact et deux colonnes sans cadres. Les modes de densité changent uniquement la mise en page : toutes les missions et les autres éléments sélectionnés sont conservés. Les rubriques vides ne sont pas imprimées.

L’aperçu affiche une estimation du nombre de pages et signale un dépassement. Un CV volumineux peut conserver plusieurs pages ; aucun texte n’est coupé pour forcer une seule page. Vérifier le PDF exporté avec son propre contenu. Les photos et le QR sont chargés avant l’ouverture de l’impression.

Tests du modèle : `node --test tests/resume-document.test.cjs`. Les données de démonstration sont fictives.


## Studio de création

Le studio partage une identité vert profond et ivoire avec les pages de compte. Le profil propose un aperçu en direct et une progression fondée sur les rubriques renseignées. Sur grand écran, la composition place les réglages à côté du document ; sur mobile, les panneaux se suivent. Les sauvegardes JSON restent accessibles dans « Vos sauvegardes » sur la page d’export.

Le suivi détaillé, les vérifications et les limites restantes sont consignés dans `SUIVI_PROJET.md`.


## Publication Firebase Hosting sans facturation

La version publique peut être exportée en fichiers statiques, compatibles avec Firebase Hosting sur le forfait Spark, dans ses quotas. La connexion Google, Firestore, les photos intégrées au CV et l’impression PDF restent disponibles. L’assistance IA est masquée dans cette version : ses routes serveur ne sont pas publiées. Le développement local et une future version avec serveur conservent le code IA.

1. Renseigner les variables Firebase publiques dans `.env.local`. Ne pas publier ce fichier.
2. `npm run build:hosting` crée le dossier `out/`, contrôle les six pages, l’image de partage et l’absence de routes API/fichiers privés. L’origine de partage par défaut est `https://cv-builder-214cb.web.app` ; `SITE_URL` peut la remplacer pour un domaine personnalisé.
3. Avec une connexion Firebase CLI valide, vérifier le site cible : `firebase hosting:sites:list --project cv-builder-214cb`.
4. Publier uniquement l’hébergement : `firebase deploy --only hosting --project cv-builder-214cb`. `npm run deploy:hosting` reconstruit puis effectue cette publication. Ces commandes ne modifient ni les règles Firestore, ni Storage, ni le forfait.
5. Vérifier dans Authentication → Paramètres → Domaines autorisés que `cv-builder-214cb.web.app` et `cv-builder-214cb.firebaseapp.com` sont présents. Avec une clé Google limitée par référent HTTP, autoriser également ces origines dans ses restrictions existantes.
6. Sur le site publié, vérifier connexion Google, récupération/sauvegarde avec photo, navigation directe vers chaque page, aperçu de partage, affichage mobile et PDF. L’état local de l’ancien localhost n’est pas transféré automatiquement : se connecter au même compte, après avoir confirmé sa sauvegarde en ligne.

Si la CLI répond que les identifiants ont expiré : lancer `firebase login --reauth` puis relancer la publication. Ne pas transmettre de jeton ou de clé dans le chat.


Publication vérifiée le 13 novembre 2026 : pages HTTPS, image Open Graph, connexion Google et récupération du profil avec photo. Le déploiement est effectué depuis les sources locales ; aucun déploiement automatique GitHub n’est configuré. Sur ce poste Windows, si la CLI échoue sur les certificats réseau, utiliser temporairement `$env:NODE_OPTIONS="--use-system-ca"` dans le terminal PowerShell avant la commande Firebase, sans désactiver TLS.


## Accueil et recherche

Le lien public ouvre une page d’accueil distincte de l’éditeur, avec accès à la connexion, à l’inscription et au mode invité. Le logo permet de revenir à l’accueil depuis le studio.

Chaque onglet de bibliothèque possède une recherche indépendante, insensible aux accents et aux majuscules. Elle porte sur les champs pertinents de ses fiches, affiche le nombre de résultats et ne modifie jamais le contenu du CV. L’effacement réaffiche tous les éléments ; ajouter une fiche efface le filtre actif pour la rendre visible.


Après une déconnexion réussie, le site revient automatiquement à l’accueil. Les pages sont revalidées à chaque chargement pour suivre les publications ; les fichiers versionnés conservent leur cache. Pour un onglet ouvert avant ce changement, effectuer une fois une actualisation forcée (Ctrl + F5).
