# Documentation technique — Gestion d'une banque (Zeph)

Application **web de simulation bancaire** développée dans un cadre académique.
Elle permet de gérer des **profils clients fictifs**, leurs **comptes** et des
**opérations bancaires simulées** (virements, paiements, dépôts, retraits…).
Aucune donnée réelle, aucune connexion à un système bancaire réel : tout est
généré localement.

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
> créée et remplie** avec 5 profils clients d'exemple et leurs transactions.

### Scripts utiles

| Commande | Emplacement | Effet |
|----------|-------------|-------|
| `npm run dev` | racine | Démarre le frontend (Next.js) |
| `npm run build` | racine | Compile le frontend pour la production |
| `npm run dev` | `server/` | Démarre le backend en mode rechargement automatique |
| `npm run seed` | `server/` | (Re)remplit la base de données avec les données d'exemple |
| `npm run build` | `server/` | Compile le backend TypeScript |

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
│   └── lib/                  ← utilitaires (appels à l'API)
│
└── server/                   ← TOUT LE CODE DU BACKEND
    ├── package.json          ← dépendances + scripts du BACKEND
    ├── data/banque.db        ← fichier de base de données SQLite (non versionné)
    └── src/
        ├── index.ts          ← point d'entrée du serveur
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
Sept tables, reliées entre elles par des clés étrangères :

| Table | Contenu | Liens |
|-------|---------|-------|
| `clients` | Profils clients (nom, courriel, adresse, téléphone, date de naissance…) | — |
| `accounts` | Comptes bancaires (type, catégorie, solde, n° de compte, limite de crédit, taux) | appartient à un `client` |
| `transactions` | Opérations (date, description, montant, débit/crédit, récurrence, futur…) | appartient à un `account` |
| `beneficiaries` | Bénéficiaires et fournisseurs pour virements / factures | appartient à un `client` |
| `saving_goals` | Objectifs d'épargne (montant cible, progression) | lié à un `client` et un `account` |
| `low_balance_alerts` | Alertes de solde faible (seuil, activée ou non) | lié à un `client` et un `account` |
| `parameters` | Paramètres globaux de l'application (seuils, taux, devise…) | — |

**Catégories de comptes** (pour le regroupement des soldes) : `depenses`,
`epargne`, `emprunt`, `investissement`.
**Types de comptes** : `cheque`, `epargne`, `credit`, `pret`, `investissement`.

---

## 5. Le backend (dossier `server/`) — fichier par fichier

### `server/src/index.ts`
Point d'entrée du serveur Express. Il :
- active CORS et le parsing JSON,
- branche toutes les routes sous le préfixe `/api`,
- initialise la base de données au démarrage,
- écoute sur le port `3001`.

### `server/src/routes/index.ts`
Le **catalogue de toutes les routes de l'API**. Chaque ligne associe une URL
(ex. `POST /clients`) à une fonction de contrôleur. C'est ici qu'on voit d'un
coup d'œil tout ce que l'API sait faire. Contient aussi en direct les routes de
détail de compte et de paiement de carte de crédit.

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
| `clients.ts` | Lister/consulter les clients, leurs comptes, leurs soldes par catégorie, **créer un client** (`create`) et réinitialiser un profil. |
| `transactions.ts` | Toutes les opérations d'argent : virement interne, virement Interac, paiement de facture, dépôt, retrait, dépôt de chèque, et consultation de l'historique / futures / récurrentes. |
| `beneficiaries.ts` | Lister, créer et supprimer des bénéficiaires et fournisseurs. |
| `goals.ts` | Lister, créer, mettre à jour la progression et supprimer des objectifs d'épargne. |
| `alerts.ts` | Lister et configurer les alertes de solde faible (seuil + activation). |
| `admin.ts` | Lire/modifier les paramètres globaux, et réinitialiser **toutes** les données. |

> **Sécurité / cohérence :** chaque opération valide les entrées côté serveur
> (montants positifs, solde suffisant, champs requis, format de courriel) et
> utilise des **requêtes paramétrées** (protection contre l'injection SQL). Un
> virement débite et crédite du même montant (la somme reste nulle).

---

## 6. Le frontend (dossier `src/`) — fichier par fichier

### Les pages (`src/app/`)

| Fichier | URL | Rôle |
|---------|-----|------|
| `layout.tsx` | (global) | Gabarit racine : polices (Inter + Syne), métadonnées, `<body>`. |
| `globals.css` | — | Styles globaux : importe Tailwind et définit la palette de couleurs `brand` (bleu marine) et la barre de défilement. |
| `page.tsx` | `/` | Page d'accueil publique (assemble en-tête + sections marketing + pied de page). |
| `login/page.tsx` | `/login` | **Connexion** : sélection d'un profil client existant pour entrer dans l'application. |
| `register/page.tsx` | `/register` | **Ouvrir un compte** : formulaire de création d'un profil client, avec validation en temps réel. |
| `dashboard/layout.tsx` | (dashboard) | Gabarit de l'espace connecté : barre du haut + menu latéral (avec lien actif). |
| `dashboard/page.tsx` | `/dashboard` | Tableau de bord : liste des profils clients à sélectionner. |
| `dashboard/client/[id]/page.tsx` | `/dashboard/client/<id>` | Fiche d'un client : infos, soldes par catégorie, comptes, objectifs, alertes, accès rapides. |
| `dashboard/client/[id]/accounts/[accountId]/page.tsx` | …/accounts/<id> | Détail d'un compte : solde, historique, transactions futures/récurrentes, paiement de carte de crédit. |
| `dashboard/client/[id]/transfer/page.tsx` | …/transfer | Virements internes et Interac (avec confirmation et ajout de bénéficiaire). |
| `dashboard/client/[id]/bills/page.tsx` | …/bills | Paiement de factures à un fournisseur (avec confirmation). |
| `dashboard/client/[id]/deposit/page.tsx` | …/deposit | Dépôt, retrait et dépôt de chèque (avec photo). |
| `dashboard/client/[id]/goals/page.tsx` | …/goals | Objectifs d'épargne : création et suivi de progression. |
| `dashboard/client/[id]/products/page.tsx` | …/products | Catalogue des produits financiers (CELI, REER, prêt…). |
| `admin/page.tsx` | `/admin` | Panneau d'administration : paramètres globaux et réinitialisation des profils. |

### Les composants réutilisables (`src/components/`)

| Fichier | Rôle |
|---------|------|
| `common/Button.tsx` | Bouton standard. S'il reçoit un `href`, il devient un lien (`Link`) ; sinon un `<button>`. Gère les variantes de style et les tailles. |
| `common/Logo.tsx` | Logo « Zeph » cliquable (renvoie à l'accueil). |
| `common/ConfirmModal.tsx` | Fenêtre de **confirmation** affichée avant toute opération financière (virement, paiement, dépôt…). |
| `header/index.tsx` | En-tête du site public (enveloppe la barre de navigation). |
| `header/navbar.tsx` | Barre de navigation publique (liens + boutons « Connexion » et « Ouvrir un compte », menu mobile). |
| `footer/index.tsx` | Pied de page du site public. |
| `home/index.tsx` | Assemble les sections de la page d'accueil. |
| `home/hero.tsx` | Section d'accroche (titre principal, boutons d'action, statistiques). |
| `home/features.tsx` | Section présentant les fonctionnalités. |
| `home/security.tsx` | Section sur la sécurité. |
| `home/cta.tsx` | Section d'appel à l'action en bas de page. |

### Les utilitaires (`src/lib/`)

| Fichier | Rôle |
|---------|------|
| `api.ts` | **Pont entre le frontend et le backend.** Centralise tous les appels HTTP vers l'API (`getClients`, `createClient`, `internalTransfer`, `payBill`, `deposit`…). Une seule fonction `request()` gère l'URL de base, les en-têtes et les erreurs. |

---

## 7. Les routes de l'API (référence rapide)

Base : `http://localhost:3001/api`

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/clients` | Liste des clients |
| POST | `/clients` | **Créer un client** (+ génération initiale) |
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

---

## 8. Correspondance avec les fonctionnalités du cahier des charges

| ID | Fonctionnalité | Où c'est implémenté |
|----|----------------|---------------------|
| F-01 | Création de profils clients | `register/page.tsx` + `POST /clients` |
| F-02 | Tableau de bord clients | `dashboard/page.tsx` |
| F-03 | Fiche client | `dashboard/client/[id]/page.tsx` |
| F-04 | Réinitialisation de profil | `admin/page.tsx` + `clients.resetClient` |
| F-05 | Comptes multiples | `accounts` (schéma) + génération dans `seed.ts` |
| F-06 | Soldes par catégorie | `clients.getBalancesByCategory` + fiche client |
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
| F-21 | Notification de solde faible | alertes sur la fiche client |
| F-22 | Paramètres administrateur | `admin/page.tsx` |

---

## 9. Journal des modifications récentes

Travaux réalisés sur la branche `premier-arrangement-du-projet` :

1. **Correction des erreurs TypeScript du backend** — le serveur compile
   désormais sans erreur :
   - ajout des définitions de types pour la librairie `sql.js`,
   - typage explicite des paramètres,
   - conversion des paramètres d'URL en chaîne avant les requêtes SQL,
   - correction d'une comparaison numérique dans le seed.

2. **Ajout des pages « Connexion » et « Ouvrir un compte »** (le problème
   principal) — auparavant, les boutons de la page d'accueil pointaient vers
   `/login` et `/register` qui **n'existaient pas** (erreur 404). Ajouts :
   - backend : nouvel endpoint `POST /api/clients` avec validation des champs
     et génération automatique des comptes/transactions du nouveau client,
   - frontend : page `/register` (formulaire d'ouverture de compte) et page
     `/login` (connexion par sélection d'un profil existant).

3. **Nettoyage du dépôt Git** :
   - les dossiers `node_modules` et le fichier de base de données local
     `banque.db` ne sont plus suivis par Git (ils restent sur le disque mais
     sortent du dépôt),
   - le `.gitignore` a été complété en conséquence.

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
- **Validation en double** : on valide côté frontend (confort) **et** côté
  backend (sécurité).
```
