# CV Builder

Pour reprendre le projet : lire [SUIVI_PROJET.md](SUIVI_PROJET.md) (état actuel, décisions et prochains chantiers).

Application de création de CV : profil, bibliothèque, variantes, export PDF et sauvegardes JSON avec photo.

## Démarrage

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
4. Pour les photos, activer Cloud Storage puis publier `storage.rules`. Cloud Storage exige actuellement le forfait Blaze avec facturation à l’usage : https://firebase.google.com/docs/storage/web/start .
5. Les téléchargements directs de photos avec le SDK nécessitent une configuration CORS du bucket autorisant les origines du site (et `http://localhost:3000` pour le développement).
6. Avec Firebase CLI installé et connecté au bon compte, les règles peuvent être déployées avec `firebase deploy --only firestore:rules,storage`.

Validation réelle : connexion Google, sauvegarde, restauration dans un autre navigateur, puis vérifier qu’un second compte ne peut pas accéder aux données du premier. Ces opérations nécessitent les services et les règles activés dans la console. La configuration Web publique est incluse ; aucune clé d’administration n’est nécessaire côté navigateur. Analytics n’est pas initialisé.

Les photos sont ajoutées avec des identifiants uniques pour éviter d’écraser la photo d’une sauvegarde encore active. Une politique de nettoyage des anciennes photos reste à prévoir. En cas de modification de la sauvegarde pendant un transfert, la transaction refuse son remplacement.

Pour le développement, le fichier `storage.cors.json` autorise les téléchargements depuis localhost. Avec Google Cloud CLI connecté au projet, appliquer `gcloud storage buckets update gs://cv-builder-214cb.firebasestorage.app --cors-file=storage.cors.json`. Ajouter l’origine exacte du site publié avant de déployer. Voir https://firebase.google.com/docs/storage/web/download-files#cors_configuration .

Le bouton « Importer mon ancien CV local » copie explicitement le CV invité de ce navigateur dans le compte connecté après confirmation. Le stockage invité et le fichier JSON sont conservés. Ce bouton permet de reprendre les données de la version précédente sans les attribuer automatiquement à un autre utilisateur.
