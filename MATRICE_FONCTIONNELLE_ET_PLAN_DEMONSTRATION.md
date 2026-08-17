# Libéo — Matrice fonctionnelle et plan de démonstration

## 1. Objectif du document

Ce document prépare la documentation utilisateur, le futur `README.md` et la
vidéo de présentation de Libéo. Il décrit l’état réellement observé dans le
code et évite de présenter comme opérationnelles des fonctions uniquement
illustratives.

Libéo doit être présenté comme une **application web de simulation bancaire
développée dans un cadre académique**. Il ne s’agit pas d’une banque réelle :
aucun argent réel n’est transféré et aucun système bancaire externe n’est
connecté.

## 2. Légende

| État | Signification |
|---|---|
| Prêt | Fonction implémentée et adaptée à une démonstration |
| Prêt avec précaution | Fonction opérationnelle, mais nécessitant une préparation ou une explication |
| Partiel | Une partie du parcours existe, sans automatisation ou effet complet |
| Illustratif | Présentation visuelle sans service correspondant |
| À éviter | Fonction actuellement défectueuse ou trop risquée pour la démonstration |

## 3. Matrice fonctionnelle

### 3.1 Accueil et découverte

| Fonctionnalité | État | Ce qui fonctionne | Consigne pour la démonstration |
|---|---|---|---|
| Page d’accueil publique | Prêt avec précaution | Présentation de Libéo, appels à l’action, sections fonctionnalités, sécurité et tarifs | La montrer brièvement et rappeler qu’il s’agit d’une simulation |
| Navigation publique | Prêt | Accueil, sections marketing, connexion et inscription | Utilisable comme point de départ de la vidéo |
| Tarifs Essentiel, Plus et Affaires | Illustratif | Les trois cartes tarifaires sont affichées | Ne pas affirmer que les forfaits modifient les droits ou déclenchent une facturation |
| Promesses de sécurité | Illustratif | Les arguments sont visibles dans l’interface | Ne pas présenter comme implémentés le chiffrement de bout en bout, la 2FA, la surveillance 24/7 ou l’assurance-dépôts |
| Cartes Visa, change et intégrations | Illustratif | Ces services sont mentionnés sur la page d’accueil | Ne pas les inclure dans la liste des fonctions réelles |

### 3.2 Inscription et authentification

| Fonctionnalité | État | Ce qui fonctionne | Consigne pour la démonstration |
|---|---|---|---|
| Création d’un profil | Prêt | Validation du formulaire, mot de passe haché et création du client | Expliquer qu’un nouveau client reçoit cinq comptes vides |
| Création automatique des comptes | Prêt | Comptes chèques, épargne, crédit, prêt et investissement | Ne pas annoncer de transactions fictives pour un nouveau client |
| Vérification du courriel | Prêt avec précaution | Code à six chiffres valable 15 minutes | Avec Gmail configuré, le code arrive par courriel; sinon il apparaît dans la console du serveur |
| Connexion client | Prêt | Courriel, mot de passe et jeton de session | Utiliser un client de démonstration préparé |
| Connexion administrateur | Prêt | Espace séparé et rôle administrateur | Configurer un mot de passe connu dans l’environnement avant l’enregistrement |
| Mot de passe oublié | Prêt avec précaution | Demande de code et choix d’un nouveau mot de passe | Même dépendance au courriel ou à la console que la vérification |
| Déconnexion | Prêt avec précaution | La session locale est effacée; la page client invalide aussi le jeton serveur | Dans la page d’administration, la déconnexion locale ne détruit pas le jeton côté serveur |
| Expiration automatique de session | Partiel | Les sessions existent en mémoire | Aucun délai d’expiration n’est appliqué; un redémarrage du serveur supprime toutes les sessions |

### 3.3 Espace client

| Fonctionnalité | État | Ce qui fonctionne | Consigne pour la démonstration |
|---|---|---|---|
| Accueil du client | Prêt | Message d’accueil, soldes par catégorie et accès rapides | Bon point d’entrée après la connexion |
| Consultation du profil | Prêt | Identité, coordonnées, adresse et date de naissance | Utiliser uniquement des données fictives |
| Liste des comptes | Prêt | Regroupement par catégorie et cartes de comptes | Montrer la variété des cinq types de comptes |
| Soldes par catégorie | Prêt | Dépenses, épargne, emprunts et investissements | Expliquer qu’un solde de crédit ou de prêt peut être négatif |
| Détail d’un compte | Prêt | Solde, numéro, taux, limite et transactions | Masquer ou rappeler que les numéros sont fictifs |
| Historique | Prêt | Jusqu’à 100 transactions complétées | Les données proviennent du seed ou des opérations de la démonstration |
| Transactions futures | Partiel | Les transactions futures générées par le seed sont affichées | Aucun planificateur ne les exécute automatiquement |
| Transactions récurrentes | Partiel | Les transactions récurrentes du seed sont affichées | Aucun écran ne permet d’en créer et aucun moteur ne les exécute |

### 3.4 Opérations financières simulées

| Fonctionnalité | État | Ce qui fonctionne | Consigne pour la démonstration |
|---|---|---|---|
| Virement interne | Prêt | Débit de la source, crédit de la destination et deux écritures liées | Utiliser deux comptes du même client et un petit montant |
| Virement Interac externe | Prêt | Débit et création de la transaction sortante | Préciser qu’aucun réseau Interac réel n’est contacté |
| Virement Interac vers un client Libéo | Prêt avec précaution | Le compte chèques du destinataire est crédité si son courriel correspond à un client | Créer d’abord un bénéficiaire avec le courriel d’un autre client de démonstration |
| Paiement de facture | Prêt | Débit d’un compte chèques ou crédit et transaction fournisseur | Utiliser un fournisseur fictif déjà présent |
| Dépôt simulé | Prêt | Crédit du compte et ajout à l’historique | Dire explicitement qu’il s’agit d’une simulation |
| Retrait simulé | Prêt | Vérification du solde, débit et historique | Choisir un compte ayant un solde suffisant |
| Dépôt de chèque | Prêt avec précaution | Téléversement d’une image, stockage et crédit du compte | Utiliser une image marquée « SPÉCIMEN — DÉMO »; le fichier n’est pas validé ni limité côté serveur |
| Paiement de carte de crédit | Prêt | Débit du compte chèques et réduction de la dette de carte | Le montant réel est limité au solde dû |
| Limite maximale et limite quotidienne | Partiel | Les valeurs sont modifiables dans les paramètres | Elles ne sont pas appliquées par les contrôleurs de transactions |
| Atomicité des opérations | Partiel | Les écritures normales produisent les résultats attendus | Les opérations à plusieurs écritures ne sont pas enveloppées dans une transaction SQL |

### 3.5 Bénéficiaires, objectifs et alertes

| Fonctionnalité | État | Ce qui fonctionne | Consigne pour la démonstration |
|---|---|---|---|
| Ajout d’un bénéficiaire | Prêt | Nom, courriel et téléphone facultatifs | Préparer Bob comme bénéficiaire d’Alice pour l’Interac interne |
| Ajout d’un fournisseur | Prêt | Création depuis la page des factures | Utiliser un nom fictif |
| Suppression d’un bénéficiaire | Partiel | L’API existe | Aucun bouton correspondant dans l’interface |
| Création d’un objectif d’épargne | Prêt | Nom, montant cible et rattachement au compte épargne | Créer un objectif simple et visuel |
| Ajout à la progression | Prêt avec précaution | Le montant courant augmente et la barre progresse | Cela ne déplace pas réellement d’argent vers le compte épargne |
| Suppression d’un objectif | Partiel | L’API existe | Aucun bouton correspondant dans l’interface |
| Configuration d’une alerte | Partiel | Seuil et activation peuvent être modifiés | Aucune notification n’est envoyée lorsque le seuil est franchi |
| Alertes pour un nouveau client | Partiel | L’API sait lire et modifier une alerte existante | L’inscription ne crée pas automatiquement d’alerte |

### 3.6 Produits et assistant

| Fonctionnalité | État | Ce qui fonctionne | Consigne pour la démonstration |
|---|---|---|---|
| Catalogue de produits | Partiel | Présentation des comptes, CELI, REER, carte et prêt avec taux | Le catalogue est informatif; aucune souscription n’est possible |
| Assistant local | Prêt | Réponses sur les soldes et explication des parcours courants | Mode recommandé pour une démonstration stable et sans coût |
| Assistant Claude | Prêt avec précaution | Utilise le contexte des comptes si une clé Anthropic est configurée | Dépend d’un service externe, d’une clé et de la connexion Internet |
| Exécution d’opérations par l’assistant | Illustratif | L’assistant peut expliquer où aller | Il n’effectue jamais de transaction |

### 3.7 Administration

| Fonctionnalité | État | Ce qui fonctionne | Consigne pour la démonstration |
|---|---|---|---|
| Liste des clients | Prêt | Consultation et ouverture de l’espace de chaque client | Montrer la séparation des rôles client et administrateur |
| Consultation d’un client par l’admin | Prêt | L’administrateur peut consulter comptes et historique | Éviter d’exécuter des opérations financières depuis cette vue, car les routes d’opération exigent le rôle client |
| Modification des paramètres | Partiel | Les valeurs sont enregistrées | Plusieurs valeurs sont seulement informatives et ne changent pas les règles métier |
| Création d’un administrateur | Prêt | Mot de passe haché et confirmation du mot de passe courant | Utiliser uniquement si nécessaire dans la vidéo |
| Suppression d’un administrateur | Prêt avec précaution | Confirmation requise et dernier administrateur protégé | Éviter toute suppression pendant la démonstration principale |
| Réinitialisation d’un client | Prêt avec précaution | Efface comptes, transactions, bénéficiaires, objectifs et alertes tout en conservant le profil | Le client se retrouve sans compte; réserver à une démonstration séparée |
| Suppression d’un client | Prêt avec précaution | Suppression complète avec confirmation du mot de passe admin | Ne pas utiliser pendant la prise principale |
| Réinitialisation globale | À éviter | La base est recréée avec les données du seed | Après l’action, les mots de passe et le compte admin ne sont pas recréés; toutes les connexions échouent |

## 4. Positionnement recommandé

### Formulation principale

> Libéo est un simulateur bancaire web qui permet d’explorer les principaux
> parcours d’une banque numérique dans un environnement fictif : consultation
> de comptes, virements, factures, dépôts, objectifs d’épargne et
> administration.

### Raisons honnêtes de l’utiliser

- Découvrir le fonctionnement d’une interface bancaire numérique.
- Démontrer une architecture web complète : Next.js, API Express et SQLite.
- Tester des parcours financiers sans argent réel et sans risque financier.
- Servir de support pédagogique pour les opérations bancaires courantes.
- Présenter l’authentification, l’autorisation par rôle et la gestion de données
  relationnelles dans un projet intégrateur.

### Affirmations à ne pas employer

- « Banque réelle », « institution financière » ou « compte bancaire officiel ».
- « Virements Interac réels » ou « argent envoyé au Canada ».
- « Carte Visa fournie » ou « cartes virtuelles illimitées ».
- « Dépôts assurés jusqu’à 100 000 $ ».
- « Authentification à deux facteurs ».
- « Chiffrement de bout en bout ».
- « Surveillance antifraude 24/7 ».
- « Change sans frais dans 150 pays ».
- « Transactions futures exécutées automatiquement ».

## 5. Parcours recommandé pour la vidéo principale

Durée visée : **10 à 12 minutes**.

| Temps | Séquence | Contenu à montrer | Message principal |
|---|---|---|---|
| 00:00–00:30 | Introduction | Logo et aperçu de l’accueil | Libéo est une simulation bancaire académique complète |
| 00:30–01:10 | Proposition de valeur | Navigation rapide sur l’accueil | Gérer et comprendre des opérations fictives dans une interface centralisée |
| 01:10–01:50 | Connexion | Connexion avec Alice | Accès sécurisé par rôle et mot de passe |
| 01:50–02:50 | Vue d’ensemble | Soldes par catégorie et accès rapides | Lecture immédiate de la situation financière simulée |
| 02:50–03:50 | Comptes | Liste, détail, historique, futures et récurrentes | Centralisation des comptes et des mouvements |
| 03:50–04:50 | Virement interne | Épargne vers chèques, par exemple 25 $ | Mise à jour cohérente des deux comptes |
| 04:50–05:50 | Interac Libéo | Ajouter Bob comme bénéficiaire puis envoyer 15 $ | Simulation d’un transfert entre deux clients |
| 05:50–06:40 | Facture | Payer 42,50 $ à un fournisseur fictif | Paiement simple avec confirmation |
| 06:40–07:30 | Dépôt et retrait | Dépôt de 100 $, puis retrait de 20 $ | Historisation immédiate des opérations |
| 07:30–08:10 | Chèque | Téléverser une image « SPÉCIMEN — DÉMO » | Illustration du dépôt mobile |
| 08:10–08:50 | Objectif et alerte | Créer un objectif et ajuster un seuil | Outils de planification et de configuration |
| 08:50–09:40 | Assistant | Demander le solde total et comment faire un Interac | Aide contextuelle, sans exécution automatique |
| 09:40–10:40 | Administration | Clients, paramètres et comptes admin | Gestion centralisée avec séparation des rôles |
| 10:40–11:20 | Conclusion | Retour sur les principales pages | Projet pédagogique couvrant l’ensemble d’un parcours bancaire simulé |

## 6. Données et opérations proposées pour l’enregistrement

### Client principal

- Alice Tremblay.
- Mot de passe défini avec `DEMO_CLIENT_PASSWORD`.
- Compte source principal : Chèques.
- Compte secondaire : Épargne.

### Destinataire Interac

- Bob Gagnon.
- Ajouter Bob aux bénéficiaires d’Alice avec
  `bob.gagnon@email.ca`.
- Montant conseillé : 15 $.

### Autres opérations

- Virement interne : 25 $ d’Épargne vers Chèques.
- Facture : 42,50 $ à un fournisseur fictif.
- Dépôt : 100 $.
- Retrait : 20 $.
- Objectif : « Voyage au Japon », cible de 5 000 $, progression de 50 $.
- Assistant :
  - « Quel est mon solde total? »
  - « Comment faire un virement Interac? »

## 7. Préparation obligatoire avant l’enregistrement

1. Partir d’une base fraîche contenant les cinq clients du seed.
2. Définir `ADMIN_PASSWORD` et `DEMO_CLIENT_PASSWORD` dans l’environnement.
3. Vérifier la connexion d’Alice et de l’administrateur avant de filmer.
4. Choisir le mode local de l’assistant pour éviter une dépendance réseau.
5. Préparer une image de chèque fictive portant clairement la mention
   « SPÉCIMEN — DÉMO ».
6. Ne jamais saisir de véritables coordonnées personnelles ou bancaires.
7. Ne pas utiliser « Réinitialiser toutes les données ».
8. Éviter les suppressions pendant la prise principale.
9. Tester une fois chaque opération avec les mêmes montants avant
   l’enregistrement.
10. Repartir d’une nouvelle base après la répétition afin que les soldes montrés
    dans la vidéo soient prévisibles.

## 8. Priorités avant la documentation finale et la vidéo

### Bloquants de publication

1. Corriger ou désactiver la réinitialisation globale.
2. Réconcilier les affirmations de la page d’accueil avec les fonctions réelles.
3. Synchroniser `package-lock.json` afin que `npm ci` fonctionne.
4. Corriger les identifiants de démonstration dans le README : les mots de passe
   dépendent maintenant de l’environnement.

### Améliorations fortement recommandées

1. Exclure `server/dist/**` et `server/html/**` du lint racine.
2. Réduire les erreurs de lint du frontend.
3. Ajouter des tests pour Interac, factures, dépôts, retraits, objectifs,
   alertes, assistant et réinitialisation globale.
4. Valider la taille et le type des images de chèques.
5. Ajouter une expiration et une révocation cohérente des sessions.
6. Vérifier la propriété du bénéficiaire, du fournisseur et du compte associé à
   un objectif.
7. Utiliser des transactions SQL pour les opérations à plusieurs écritures.

## 9. Décision de démonstration

La vidéo principale peut être produite avec les fonctions classées « Prêt » et
« Prêt avec précaution ». Les fonctions « Partielles » doivent être présentées
comme des aperçus ou des configurations, et non comme des automatisations
complètes. Les fonctions « Illustratives » ne doivent pas être utilisées comme
arguments techniques. La réinitialisation globale doit rester exclue jusqu’à
sa correction.
