/**
 * Schéma SQL de la base de données.
 *
 * Définit les tables (clients, comptes, transactions, bénéficiaires, objectifs
 * d'épargne, paramètres, alertes de solde faible), leurs contraintes
 * (clés primaires/étrangères, CHECK sur les types) et les index. Exécuté au
 * démarrage via `getDb` ; les `IF NOT EXISTS` rendent l'opération idempotente.
 */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postalCode TEXT NOT NULL,
  dateNaissance TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('cheque','epargne','credit','pret','investissement')),
  category TEXT NOT NULL CHECK(category IN ('depenses','epargne','emprunt','investissement')),
  name TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  accountNumber TEXT NOT NULL UNIQUE,
  creditLimit REAL DEFAULT 0,
  interestRate REAL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('credit','debit')),
  category TEXT,
  relatedAccountId TEXT,
  isRecurring INTEGER NOT NULL DEFAULT 0,
  frequency TEXT CHECK(frequency IN ('hebdomadaire','mensuel','annuel',NULL)),
  isFuture INTEGER NOT NULL DEFAULT 0,
  scheduledDate TEXT,
  chequeImage BLOB,
  status TEXT NOT NULL DEFAULT 'complete' CHECK(status IN ('complete','pending','failed')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (relatedAccountId) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  isFournisseur INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saving_goals (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  accountId TEXT NOT NULL,
  name TEXT NOT NULL,
  targetAmount REAL NOT NULL,
  currentAmount REAL NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parameters (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS low_balance_alerts (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  accountId TEXT NOT NULL,
  threshold REAL NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_accounts_client ON accounts(clientId);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(accountId);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_client ON beneficiaries(clientId);
CREATE INDEX IF NOT EXISTS idx_saving_goals_client ON saving_goals(clientId);
CREATE INDEX IF NOT EXISTS idx_alerts_client ON low_balance_alerts(clientId);
`;
