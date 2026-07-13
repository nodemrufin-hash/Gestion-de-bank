# Gestion d'une banque — Libéo

Application **web de simulation bancaire** développée dans un cadre académique
(projet intégrateur). Elle permet de gérer des **profils clients fictifs**,
leurs **comptes** et des **opérations bancaires simulées** (virements, paiements,
dépôts, retraits…).

> Aucune donnée réelle, aucune connexion à un système bancaire réel : tout est
> généré et stocké localement.

## Fonctionnalités

- **Profils clients** : ouverture de compte, tableau de bord, fiche client, réinitialisation.
- **Comptes** : comptes multiples (chèques, épargne, crédit, prêt, investissement), soldes par catégorie, détail et historique.
- **Opérations** : virements internes et Interac, paiement de factures, dépôts / retraits, dépôt de chèque (avec photo), paiement de carte de crédit.
- **Épargne** : objectifs d'épargne et alertes de solde faible.
- **Connexion sécurisée** : clients et administrateur, mots de passe hachés (bcrypt).
- **Vérification du courriel** : code à 6 chiffres envoyé par email (Gmail SMTP).
- **Assistant** de l'espace client : IA (Claude) si une clé API est configurée, sinon repli basé sur des règles — sans clé ni coût.
- **Administration** : paramètres globaux, réinitialisation des données, gestion des comptes admin.

## Architecture

```
Navigateur ──▶ Frontend (Next.js, :3000) ──▶ API REST (Express, :3001) ──▶ SQLite (banque.db)
```

| Partie | Techno | Port | Dossier |
|--------|--------|------|---------|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 | `3000` | racine + `src/` |
| Backend | Node.js · Express · TypeScript | `3001` | `server/` |
| Base de données | SQLite (via `sql.js`) | — | `server/data/banque.db` |

Le frontend ne parle jamais directement à la base : il passe par l'API REST du
backend (`src/lib/api.ts`).

## Démarrage rapide

Prérequis : **Node.js** (version récente).

### 1. Installer les dépendances

Il y a deux `package.json` (frontend à la racine, backend dans `server/`) :

```bash
npm install                # frontend (à la racine)
cd server && npm install   # backend
```

### 2. Configuration (optionnelle)

Copiez `server/.env.example` en `server/.env` pour activer les services
externes. **Tout est facultatif** — sans configuration, l'application reste
utilisable en mode de repli :

| Variable | Rôle | Sans configuration |
|----------|------|--------------------|
| `ANTHROPIC_API_KEY` | Assistant IA (Claude) | Assistant basé sur des règles |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Envoi des emails de vérification | Code affiché dans la console du serveur |

### 3. Lancer l'application (deux terminaux)

```bash
# Terminal 1 — backend (API sur http://localhost:3001)
cd server && npm run dev

# Terminal 2 — frontend (site sur http://localhost:3000)
npm run dev
```

Ouvrez ensuite **http://localhost:3000**.

> Au premier démarrage, la base de données est **créée et remplie
> automatiquement** avec 5 profils clients de démonstration et leurs
> transactions.

### Identifiants de démonstration

| Rôle | Courriel | Mot de passe |
|------|----------|--------------|
| Client (profils du seed) | le courriel affiché sur la page de connexion | `Test1234!` |
| Administrateur | `admin@banque.ca` | `Admin1234!` |

## Scripts

| Commande | Emplacement | Effet |
|----------|-------------|-------|
| `npm run dev` | racine | Démarre le frontend (Next.js) |
| `npm run build` | racine | Compile le frontend pour la production |
| `npm run dev` | `server/` | Démarre le backend (rechargement automatique) |
| `npm run seed` | `server/` | (Re)remplit la base avec les données d'exemple |
| `npm run build` | `server/` | Compile le backend TypeScript |
| `npm run start` | `server/` | Démarre le backend compilé |

## Structure du projet

```
Gestion-de-banque/
├── src/                  ← frontend (Next.js)
│   ├── app/              ← pages (routage par fichiers)
│   ├── components/       ← composants UI réutilisables
│   └── lib/              ← appels API + session
└── server/              ← backend (Express + SQLite)
    └── src/
        ├── index.ts      ← point d'entrée du serveur
        ├── mailer.ts     ← envoi d'emails
        ├── routes/       ← routes de l'API
        ├── controllers/  ← logique métier
        └── database/     ← connexion, schéma, données initiales
```

## Documentation

La documentation technique détaillée (modèle de données, rôle de chaque fichier,
référence complète de l'API, correspondance avec le cahier des charges) se
trouve dans **[`DOCUMENTATION.md`](DOCUMENTATION.md)**.
