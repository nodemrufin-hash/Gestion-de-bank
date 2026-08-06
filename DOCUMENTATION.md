# Documentation technique — Gestion d'une banque (Libéo)

Application **web de simulation bancaire** développée dans un cadre académique.
Elle permet de gérer des **profils clients fictifs**, leurs **comptes** et des
**opérations bancaires simulées** (virements, paiements, dépôts, retraits…).
Aucune donnée réelle, aucune connexion à un système bancaire réel : tout est
généré localement.

L'application propose aussi une **connexion sécurisée** (client et
administrateur, mots de passe hachés), une **vérification du courriel** par code
envoyé par email, et un **assistant conversationnel** intégré à l'espace client.

Ce document explique le projet, sa structure, le rôle de **chaque fichier**, le
modèle de données et l'API. Il est conçu pour que n'importe qui puisse
comprendre et reprendre le projet.

---

## 1. Vue d'ensemble

L'application est composée de **deux parties indépendantes** qui tournent
chacune sur leur propre port :

| Partie | Rôle | Techno | Port | Dossier |
|--------|------|--------|------|---------|
| **Frontend** | Interface web (pages, formulaires) | Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 | `3000` | racine + `src/` |
| **Backend** | API REST | Node.js + Express + TypeScript | `3001` | `server/` |
| **Base de données** | Stockage | SQLite (via la librairie `sql.js`) | — | `server/data/banque.db` |

Le frontend ne parle jamais directement à la base de données : il appelle l'API
REST du backend (via `src/lib/api.ts`), et le backend lit/écrit dans SQLite.

```
Navigateur ──▶ Frontend (Next.js, :3000) ──▶ API REST (Express, :3001) ──▶ SQLite (banque.db)
```

### Services externes (optionnels)

Deux fonctionnalités s'appuient sur des services externes, **configurés par
variables d'environnement** (voir section 2). En leur absence, l'application
reste utilisable grâce à un **mode de repli** :

| Fonctionnalité | Service | Sans configuration |
|----------------|---------|--------------------|
| **Assistant** de l'espace client | API Claude d'Anthropic (`@anthropic-ai/sdk`) | Repli sur un assistant **basé sur des règles** (soldes, aide aux opérations), sans clé ni coût. |
| **Vérification du courriel** | Gmail SMTP (`nodemailer`) | Le code de vérification est **affiché dans la console** du serveur (mode démonstration). |

---

## 2. Démarrage du projet

### Prérequis
- Node.js installé (version récente).

### Installation
Il y a **deux** `package.json` (un pour le frontend, un pour le backend) :

```bash
# À la racine du projet (frontend)
npm install

# Dans le dossier server (backend)
cd server
npm install
```

### Configuration (fichier `.env` du backend — optionnel)

Le backend lit un fichier `server/.env` (chargé par `dotenv`). Un modèle est
fourni dans [`server/.env.example`](server/.env.example) — copiez-le en `.env`
et renseignez vos valeurs. **Toutes les variables sont facultatives** : sans
elles, l'application fonctionne en mode de repli (voir section 1).

```bash
# Clé API Claude — active l'assistant IA (sinon assistant basé sur des règles).
ANTHROPIC_API_KEY=sk-ant-...

# Envoi des emails de vérification via Gmail (sinon code affiché en console).
GMAIL_USER=votrecompte@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   # « mot de passe d'application » Gmail (16 car.)
```

> Le fichier `.env` **n'est pas versionné** (voir `.gitignore`). Le
> `GMAIL_APP_PASSWORD` s'obtient dans Google Compte → Sécurité → Mots de passe
> d'application (validation en deux étapes requise).

### Lancer l'application
Il faut **deux terminaux** :

```bash
# Terminal 1 — backend (API sur http://localhost:3001)
cd server
npm run dev

# Terminal 2 — frontend (site sur http://localhost:3000)
npm run dev
```

Ouvrir ensuite **http://localhost:3000**.

> Au premier démarrage du backend, la base de données est **automatiquement
> créée et remplie** avec 5 profils clients d'exemple et leurs transactions. Le
> démarrage prépare aussi l'authentification (`ensureAuthSetup`) : mots de passe
> par défaut des clients de démonstration et compte administrateur par défaut
> (voir section 5).

### Identifiants de démonstration

| Rôle | Courriel | Mot de passe |
|------|----------|--------------|
| Client (profils du seed) | le courriel du client (page de connexion) | `Test1234!` |
| Administrateur | `admin@banque.ca` | `Admin1234!` |

### Scripts utiles

| Commande | Emplacement | Effet |
|----------|-------------|-------|
| `npm run dev` | racine | Démarre le frontend (Next.js) |
| `npm run build` | racine | Compile le frontend pour la production |
| `npm run dev` | `server/` | Démarre le backend en mode rechargement automatique |
| `npm run seed` | `server/` | (Re)remplit la base de données avec les données d'exemple |
| `npm run build` | `server/` | Compile le backend TypeScript |
| `npm run start` | `server/` | Démarre le backend compilé (sert aussi le frontend en production) |

---

## 3. Structure des dossiers

```
Gestion-de-banque/
├── DOCUMENTATION.md          ← ce fichier
├── package.json              ← dépendances + scripts du FRONTEND
├── next.config.ts            ← configuration Next.js
├── tsconfig.json             ← configuration TypeScript du frontend
├── postcss.config.mjs        ← configuration PostCSS (pour Tailwind)
├── eslint.config.mjs         ← règles de qualité de code (lint)
│
├── src/                      ← TOUT LE CODE DU FRONTEND
│   ├── app/                  ← les PAGES (routage par fichiers de Next.js)
│   ├── components/           ← composants réutilisables (UI)
│   └── lib/                  ← utilitaires (appels à l'API, session)
│
└── server/                   ← TOUT LE CODE DU BACKEND
    ├── package.json          ← dépendances + scripts du BACKEND
    ├── .env.example          ← modèle de configuration (clé API, Gmail)
    ├── data/banque.db        ← fichier de base de données SQLite (non versionné)
    └── src/
        ├── index.ts          ← point d'entrée du serveur
        ├── mailer.ts         ← envoi des emails (vérification, bienvenue)
        ├── routes/           ← définition des routes de l'API
        ├── controllers/      ← logique métier de chaque route
        └── database/         ← connexion, schéma et données initiales
```

> **Note :** Le **routage** du frontend utilise l'**App Router** de Next.js :
> chaque dossier contenant un fichier `page.tsx` devient une URL. Par exemple
> `src/app/login/page.tsx` correspond à l'adresse `/login`. Les segments entre
> crochets comme `[id]` sont des **paramètres dynamiques** (ex. l'identifiant
> d'un client dans l'URL).

---

## 4. Le modèle de données (base SQLite)

Le schéma est défini dans [`server/src/database/schema.ts`](server/src/database/schema.ts).
Huit tables, reliées entre elles par des clés étrangères :

| Table | Contenu | Liens |
|-------|---------|-------|
| `clients` | Profils clients (nom, courriel, **mot de passe haché**, adresse, téléphone, date de naissance, **état de vérification du courriel**…) | — |
| `admins` | Comptes administrateurs (courriel unique, mot de passe haché) | — |
| `accounts` | Comptes bancaires (type, catégorie, solde, n° de compte, limite de crédit, taux) | appartient à un `client` |
| `transactions` | Opérations (date, description, montant, débit/crédit, récurrence, futur…) | appartient à un `account` |
| `beneficiaries` | Bénéficiaires et fournisseurs pour virements / factures | appartient à un `client` |
| `saving_goals` | Objectifs d'épargne (montant cible, progression) | lié à un `client` et un `account` |
| `low_balance_alerts` | Alertes de solde faible (seuil, activée ou non) | lié à un `client` et un `account` |
| `parameters` | Paramètres globaux de l'application (seuils, taux, devise…) | — |

**Colonnes d'authentification / vérification de `clients`** : `password` (haché
bcrypt), `emailVerified` (0/1), `verificationCode` (code à 6 chiffres en
attente), `verificationExpires` (date limite du code). Ces colonnes sont
ajoutées automatiquement aux anciennes bases par une **migration idempotente**
au démarrage (`ensureAuthSetup`, voir section 5).

**Catégories de comptes** (pour le regroupement des soldes) : `depenses`,
`epargne`, `emprunt`, `investissement`.
**Types de comptes** : `cheque`, `epargne`, `credit`, `pret`, `investissement`.

---

## 5. Le backend (dossier `server/`) — fichier par fichier

### `server/src/index.ts`
Point d'entrée du serveur Express. Il :
- charge les variables d'environnement via `dotenv/config` (en tout premier),
- active CORS et le parsing JSON / urlencoded,
- branche toutes les routes sous le préfixe `/api`,
- en production (`NODE_ENV=production`), sert le build statique du frontend,
- initialise la base de données **et prépare l'authentification**
  (`ensureAuthSetup`) au démarrage,
- écoute sur le port `3001`.

### `server/src/mailer.ts`
Envoi des emails via **Gmail SMTP** (`nodemailer`) :
- `sendVerificationEmail()` : envoie le code de vérification à 6 chiffres,
- `sendWelcomeEmail()` : envoie un email de bienvenue une fois le courriel
  vérifié,
- `mailerConfigured()` : indique si `GMAIL_USER` / `GMAIL_APP_PASSWORD` sont
  présents. **Sans ces variables**, aucun email n'est envoyé : le code est
  affiché dans la console du serveur (mode démonstration). Un échec d'envoi ne
  bloque jamais le flux d'inscription.

### `server/src/routes/index.ts`
Le **catalogue de toutes les routes de l'API**. Chaque ligne associe une URL
(ex. `POST /clients`) à une fonction de contrôleur. C'est ici qu'on voit d'un
coup d'œil tout ce que l'API sait faire. Contient aussi en direct les routes de
détail de compte et de paiement de carte de crédit. `multer` y gère l'upload de
la photo de chèque en mémoire.

### `server/src/database/database.ts`
Gère la **connexion à SQLite** via `sql.js` :
- `getDb()` : ouvre (ou crée) la base et la garde en mémoire,
- `saveDb()` : écrit la base en mémoire dans le fichier `banque.db`,
- `closeDb()` / `resetDb()` : ferme ou supprime la base.

### `server/src/database/schema.ts`
Contient le **script SQL de création des tables** (voir section 4). Exécuté à
chaque ouverture de la base (les tables ne sont créées que si elles n'existent
pas).

### `server/src/database/seed.ts`
**Génère les données d'exemple.** Deux éléments importants :
- `seed()` : crée les 5 clients de démonstration + les paramètres globaux (n'agit
  que si la base est vide).
- `generateClientFinancials(db, clientId)` : pour un client donné, génère ses 5
  comptes, ~15 à 25 transactions par compte, des transactions futures/récurrentes,
  des bénéficiaires, des objectifs d'épargne et une alerte de solde faible. Cette
  fonction est **réutilisée** lors de la création d'un nouveau client (voir
  `clients.create`), ce qui implémente la *génération initiale* (F-19).

### `server/src/controllers/` — la logique de chaque opération
Un contrôleur = un ensemble de fonctions qui reçoivent une requête HTTP,
lisent/modifient la base et renvoient une réponse JSON.

| Fichier | Responsabilité |
|---------|----------------|
| `clients.ts` | Lister/consulter les clients, leurs comptes, leurs soldes par catégorie, **créer un client** (`create`, avec mot de passe haché + envoi du code de vérification) et réinitialiser un profil. |
| `transactions.ts` | Toutes les opérations d'argent : virement interne, virement Interac, paiement de facture, dépôt, retrait, dépôt de chèque, et consultation de l'historique / futures / récurrentes. |
| `beneficiaries.ts` | Lister, créer et supprimer des bénéficiaires et fournisseurs. |
| `goals.ts` | Lister, créer, mettre à jour la progression et supprimer des objectifs d'épargne. |
| `alerts.ts` | Lister et configurer les alertes de solde faible (seuil + activation). |
| `admin.ts` | Lire/modifier les paramètres globaux, et réinitialiser **toutes** les données. |
| `auth.ts` | **Authentification** : connexion client et admin (mots de passe hachés bcrypt), gestion des comptes admin (liste/création/suppression, avec re-confirmation du mot de passe de l'admin courant). Expose `ensureAuthSetup` (migrations + comptes par défaut, voir ci-dessous). |
| `verification.ts` | **Vérification du courriel** : génération d'un code à 6 chiffres (valable 15 min), vérification du code saisi, et renvoi d'un nouveau code. |
| `assistant.ts` | **Assistant** de l'espace client : mode IA (Claude) si une clé API est présente, sinon mode **repli basé sur des règles**. Purement informatif : il n'effectue aucune opération. |

**`ensureAuthSetup` (dans `auth.ts`)** est appelée au démarrage et est
**idempotente** : elle ajoute les colonnes d'authentification/vérification aux
anciennes bases, attribue le mot de passe par défaut (`npm run dev`) aux clients
de démonstration, considère les clients existants comme déjà vérifiés (pour ne
pas bloquer leur connexion) et crée le compte admin par défaut
(`admin@banque.ca` / `Admin1234!`) s'il n'existe pas.

> **Sécurité / cohérence :** chaque opération valide les entrées côté serveur
> (montants positifs, solde suffisant, champs requis, format de courriel) et
> utilise des **requêtes paramétrées** (protection contre l'injection SQL). Un
> virement débite et crédite du même montant (la somme reste nulle). Les mots de
> passe ne sont **jamais stockés en clair** (hachage bcrypt) ni renvoyés par
> l'API. Un client doit avoir **vérifié son courriel** pour pouvoir se connecter.

---

## 6. Le frontend (dossier `src/`) — fichier par fichier

### Les pages (`src/app/`)

| Fichier | URL | Rôle |
|---------|-----|------|
| `layout.tsx` | (global) | Gabarit racine : polices (Inter + Syne), métadonnées, `<body>`. |
| `globals.css` | — | Styles globaux : importe Tailwind et définit la palette de couleurs `brand` (bleu marine) et la barre de défilement. |
| `page.tsx` | `/` | Page d'accueil publique (assemble en-tête + sections marketing + pied de page). |
| `login/page.tsx` | `/login` | **Connexion client** : courriel + mot de passe. En cas de succès, enregistre la session et redirige vers le profil. Lien vers la connexion admin. |
| `register/page.tsx` | `/register` | **Ouvrir un compte** : formulaire de création d'un profil client (avec mot de passe et validation en temps réel, date de naissance bornée à 18–120 ans). Redirige ensuite vers la vérification du courriel. |
| `verify/page.tsx` | `/verify` | **Vérification du courriel** : saisie du code à 6 chiffres reçu par email, avec possibilité de renvoyer un code. |
| `admin/login/page.tsx` | `/admin/login` | **Connexion administrateur** (espace séparé de la connexion client). |
| `dashboard/layout.tsx` | (dashboard) | Gabarit de l'espace connecté : barre du haut + menu latéral (avec lien actif). |
| `dashboard/page.tsx` | `/dashboard` | Tableau de bord : liste des profils clients à sélectionner. |
| `dashboard/client/[id]/page.tsx` | `/dashboard/client/<id>` | Accueil du client : vue d'ensemble, accès rapides et **assistant** (`AssistantChat`). |
| `dashboard/client/[id]/profil/page.tsx` | …/profil | **Mon profil** : informations personnelles du client. |
| `dashboard/client/[id]/comptes/page.tsx` | …/comptes | **Mes comptes** : soldes par catégorie, liste des comptes et gestion des alertes de solde faible. |
| `dashboard/client/[id]/accounts/[accountId]/page.tsx` | …/accounts/<id> | Détail d'un compte : solde, historique, transactions futures/récurrentes, paiement de carte de crédit. |
| `dashboard/client/[id]/transfer/page.tsx` | …/transfer | Virements internes et Interac (avec confirmation et ajout de bénéficiaire). |
| `dashboard/client/[id]/bills/page.tsx` | …/bills | Paiement de factures à un fournisseur (avec confirmation). |
| `dashboard/client/[id]/deposit/page.tsx` | …/deposit | Dépôt, retrait et dépôt de chèque (avec photo). |
| `dashboard/client/[id]/goals/page.tsx` | …/goals | Objectifs d'épargne : création et suivi de progression. |
| `dashboard/client/[id]/products/page.tsx` | …/products | Catalogue des produits financiers (CELI, REER, prêt…). |
| `admin/page.tsx` | `/admin` | Panneau d'administration : paramètres globaux, réinitialisation des profils et **gestion des comptes administrateurs**. |

### Les composants réutilisables (`src/components/`)

| Fichier | Rôle |
|---------|------|
| `common/Button.tsx` | Bouton standard. S'il reçoit un `href`, il devient un lien (`Link`) ; sinon un `<button>`. Gère les variantes de style et les tailles. |
| `common/Logo.tsx` | Logo « Libéo » cliquable (renvoie à l'accueil). |
| `common/ConfirmModal.tsx` | Fenêtre de **confirmation** affichée avant toute opération financière (virement, paiement, dépôt…). |
| `dashboard/AssistantChat.tsx` | **Assistant conversationnel** de l'espace client : panneau de discussion repliable/dépliable (chevron) qui interroge l'API `askAssistant` en conservant l'historique de la conversation. |
| `header/index.tsx` | En-tête du site public (enveloppe la barre de navigation). |
| `header/navbar.tsx` | Barre de navigation publique (liens + boutons « Connexion » et « Ouvrir un compte », menu mobile). |
| `footer/index.tsx` | Pied de page du site public. |
| `home/index.tsx` | Assemble les sections de la page d'accueil. |
| `home/hero.tsx` | Section d'accroche (titre principal, boutons d'action, statistiques). |
| `home/features.tsx` | Section présentant les fonctionnalités. |
| `home/about.tsx` | Section « À propos » (présentation de la banque). |
| `home/security.tsx` | Section sur la sécurité. |
| `home/pricing.tsx` | Section des offres / tarifs. |
| `home/cta.tsx` | Section d'appel à l'action en bas de page. |

### Les utilitaires (`src/lib/`)

| Fichier | Rôle |
|---------|------|
| `api.ts` | **Pont entre le frontend et le backend.** Centralise tous les appels HTTP vers l'API (`loginClient`, `loginAdmin`, `verifyEmail`, `createClient`, `internalTransfer`, `payBill`, `deposit`, `askAssistant`…). Une seule fonction `request()` gère l'URL de base, les en-têtes et les erreurs. |
| `auth.ts` | **Gestion de la session côté navigateur.** Conserve le rôle et l'identité (client ou admin) dans `localStorage` (`getSession`, `setClientSession`, `setAdminSession`, `logout`). Il s'agit d'une **simulation** : pas de jeton signé, la protection des routes est faite côté client. |

---

## 7. Les routes de l'API (référence rapide)

Base : `http://localhost:3001/api`

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/auth/login` | Connexion client (courriel + mot de passe) |
| POST | `/auth/admin/login` | Connexion administrateur |
| POST | `/auth/verify-email` | Vérifier le code du courriel |
| POST | `/auth/resend-verification` | Renvoyer un code de vérification |
| POST | `/assistant` | Poser une question à l'assistant (IA ou règles) |
| GET | `/clients` | Liste des clients |
| POST | `/clients` | **Créer un client** (+ génération initiale + envoi du code de vérification) |
| GET | `/clients/:id` | Détail d'un client |
| GET | `/clients/:id/accounts` | Comptes d'un client |
| GET | `/clients/:id/balances` | Soldes regroupés par catégorie |
| POST | `/clients/:id/reset` | Réinitialiser un profil |
| GET | `/accounts/:accountId` | Détail d'un compte |
| GET | `/accounts/:accountId/transactions` | Historique des transactions |
| GET | `/accounts/:accountId/transactions/future` | Transactions futures |
| GET | `/accounts/:accountId/transactions/recurring` | Transactions récurrentes |
| POST | `/accounts/:accountId/pay-credit` | Payer une carte de crédit |
| POST | `/transactions/transfer` | Virement interne |
| POST | `/transactions/interac` | Virement Interac |
| POST | `/transactions/paybill` | Paiement de facture |
| POST | `/transactions/deposit` | Dépôt |
| POST | `/transactions/withdraw` | Retrait |
| POST | `/transactions/deposit-cheque` | Dépôt de chèque (avec photo) |
| GET / POST / DELETE | `/clients/:clientId/beneficiaries`, `/beneficiaries`, `/beneficiaries/:id` | Gestion des bénéficiaires |
| GET / POST / PUT / DELETE | `/clients/:clientId/goals`, `/goals`, `/goals/progress`, `/goals/:id` | Gestion des objectifs |
| GET / PUT | `/clients/:clientId/alerts`, `/alerts/:id` | Gestion des alertes |
| GET / PUT | `/admin/parameters` | Paramètres globaux |
| POST | `/admin/reset` | Réinitialiser toutes les données |
| GET / POST / DELETE | `/admin/admins`, `/admin/admins/:id` | Gestion des comptes administrateurs |

---

## 8. Correspondance avec les fonctionnalités du cahier des charges

| ID | Fonctionnalité | Où c'est implémenté |
|----|----------------|---------------------|
| F-01 | Création de profils clients | `register/page.tsx` + `POST /clients` |
| F-02 | Tableau de bord clients | `dashboard/page.tsx` |
| F-03 | Fiche client | `dashboard/client/[id]/page.tsx` (+ `profil`, `comptes`) |
| F-04 | Réinitialisation de profil | `admin/page.tsx` + `clients.resetClient` |
| F-05 | Comptes multiples | `accounts` (schéma) + génération dans `seed.ts` |
| F-06 | Soldes par catégorie | `clients.getBalancesByCategory` + page « Mes comptes » |
| F-07 | Détail de compte | `accounts/[accountId]/page.tsx` |
| F-08 | Carte de crédit | paiement carte dans le détail de compte |
| F-09 | Produits financiers | `products/page.tsx` |
| F-10 | Virements internes | `transfer/page.tsx` + `transactions.internalTransfer` |
| F-11 | Virements Interac | `transfer/page.tsx` + `transactions.interacTransfer` |
| F-12 | Paiement de factures | `bills/page.tsx` + `transactions.payBill` |
| F-13 | Dépôts et retraits | `deposit/page.tsx` |
| F-14 | Dépôt de chèques | `deposit/page.tsx` (mode chèque) |
| F-15 | Création de bénéficiaires | `transfer/page.tsx`, `bills/page.tsx` |
| F-16 | Historique des transactions | détail de compte |
| F-17 | Transactions futures | détail de compte |
| F-18 | Transactions récurrentes | détail de compte + génération `seed.ts` |
| F-19 | Génération initiale | `generateClientFinancials()` dans `seed.ts` |
| F-20 | Objectifs d'épargne | `goals/page.tsx` |
| F-21 | Notification de solde faible | alertes sur la page « Mes comptes » |
| F-22 | Paramètres administrateur | `admin/page.tsx` |

### Fonctionnalités supplémentaires (au-delà du cahier initial)

| Fonctionnalité | Où c'est implémenté |
|----------------|---------------------|
| Connexion client / administrateur (mots de passe hachés) | `auth.ts` + `login`, `admin/login`, `lib/auth.ts` |
| Vérification du courriel par code (email) | `verification.ts` + `mailer.ts` + `verify/page.tsx` |
| Email de bienvenue après vérification | `mailer.sendWelcomeEmail` |
| Gestion des comptes administrateurs | `auth.ts` (`listAdmins`/`createAdmin`/`deleteAdmin`) + `admin/page.tsx` |
| Assistant de l'espace client (IA + repli par règles) | `assistant.ts` + `dashboard/AssistantChat.tsx` |

---

## 9. Journal des modifications récentes

**Authentification, vérification du courriel et assistant** (branches `test`,
`ajout-de-la-vérification-par-gmail`, `assistant-sans-une-vraie-clé-API`,
`amelioration-de-l'assistant-libeo`) :

1. **Connexion sécurisée** — connexion client et administrateur par courriel +
   mot de passe haché (bcrypt) ; espace admin séparé ; gestion des comptes
   administrateurs avec re-confirmation du mot de passe de l'admin courant ;
   migrations idempotentes au démarrage (`ensureAuthSetup`).

2. **Vérification du courriel** — code à 6 chiffres (valable 15 min) envoyé par
   Gmail SMTP à l'inscription, page `/verify`, renvoi de code et email de
   bienvenue. Sans configuration Gmail, le code s'affiche dans la console (mode
   démonstration). La date de naissance de l'inscription est bornée (18–120 ans).

3. **Assistant de l'espace client** — panneau conversationnel repliable. Utilise
   l'API Claude quand `ANTHROPIC_API_KEY` est définie, sinon un assistant basé
   sur des règles (soldes, aide aux virements/factures/dépôts) sans clé ni coût.
   Variables d'environnement chargées via `dotenv`.

**Travaux antérieurs** (branche `premier-arrangement-du-projet`) :

1. **Correction des erreurs TypeScript du backend** — le serveur compile
   désormais sans erreur (types `sql.js`, typage explicite, conversion des
   paramètres d'URL, correction d'une comparaison numérique dans le seed).

2. **Ajout des pages « Connexion » et « Ouvrir un compte »** — auparavant, les
   boutons de la page d'accueil pointaient vers `/login` et `/register`
   inexistants (404). Ajout de l'endpoint `POST /api/clients` et des pages
   correspondantes.

3. **Nettoyage du dépôt Git** — `node_modules`, les dossiers `.next` et la base
   locale `banque.db` ne sont plus suivis (`.gitignore` complété).

---

## 10. Conventions à retenir

- **Argent / dates** : les montants sont affichés en dollars canadiens via
  `toLocaleString("fr-CA", { style: "currency", currency: "CAD" })` ; les dates
  sont au format `AAAA-MM-JJ`.
- **Couleurs des catégories** : dépenses = bleu, épargne = vert, emprunt =
  rouge, investissement = violet.
- **Confirmation obligatoire** : toute opération financière passe par le
  composant `ConfirmModal` avant d'être exécutée.
- **Un seul point d'accès à l'API** : tout passe par `src/lib/api.ts` côté
  frontend ; ne pas appeler `fetch` directement dans les pages.
- **Session côté client** : la session (client ou admin) est lue/écrite via
  `src/lib/auth.ts` (`localStorage`) — simulation, sans jeton signé.
- **Validation en double** : on valide côté frontend (confort) **et** côté
  backend (sécurité).
- **Mots de passe** : toujours hachés (bcrypt), jamais stockés en clair ni
  renvoyés par l'API. Le courriel doit être vérifié avant la connexion.
- **Secrets** : les clés (API Claude, Gmail) vivent dans `server/.env`
  (non versionné) ; l'application fonctionne en mode de repli sans elles.
```