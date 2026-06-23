/**
 * Contrôleur d'authentification (clients et administrateur).
 *
 * Gère la connexion par courriel + mot de passe haché (bcrypt). Les clients
 * s'authentifient contre la table `clients`, l'administrateur contre la table
 * `admins`. Expose aussi `ensureAuthSetup` qui prépare la base : ajout de la
 * colonne `password`, attribution d'un mot de passe par défaut aux clients de
 * démonstration et création du compte admin par défaut.
 */
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import type { Database } from "sql.js";
import { getDb, saveDb } from "../database/database";

/** Mot de passe attribué par défaut aux clients de démonstration (seed). */
export const DEFAULT_CLIENT_PASSWORD = "Test1234!";
/** Identifiants du compte administrateur de démonstration. */
export const ADMIN_EMAIL = "admin@banque.ca";
export const ADMIN_PASSWORD = "Admin1234!";

const SALT_ROUNDS = 10;

/** Hache un mot de passe en clair avec bcrypt. */
export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, SALT_ROUNDS);
}

/** Vérifie qu'un mot de passe en clair correspond à un hachage bcrypt. */
export function comparePassword(plain: string, hash: string): boolean {
  if (!hash) return false;
  return bcrypt.compareSync(plain, hash);
}

/** Indique si une colonne existe dans une table (via PRAGMA table_info). */
function columnExists(db: Database, table: string, column: string): boolean {
  const res = db.exec(`PRAGMA table_info(${table})`);
  if (res.length === 0) return false;
  // Colonne `name` = index 1 dans le résultat de PRAGMA table_info.
  return res[0].values.some((row: any[]) => row[1] === column);
}

/**
 * Prépare l'authentification au démarrage :
 *  - ajoute la colonne `password` à `clients` si une ancienne base ne l'a pas ;
 *  - attribue le mot de passe par défaut aux clients qui n'en ont pas ;
 *  - crée le compte administrateur par défaut s'il n'existe pas.
 * Idempotent : peut être appelé à chaque démarrage sans effet de bord.
 */
export async function ensureAuthSetup(db: Database): Promise<void> {
  // Migration : ancienne base sans colonne `password`.
  if (!columnExists(db, "clients", "password")) {
    db.run("ALTER TABLE clients ADD COLUMN password TEXT");
  }

  // Backfill : mot de passe par défaut pour les clients sans mot de passe.
  const defaultHash = hashPassword(DEFAULT_CLIENT_PASSWORD);
  db.run("UPDATE clients SET password = ? WHERE password IS NULL OR password = ''", [defaultHash]);

  // Compte admin par défaut.
  const existing = db.exec("SELECT COUNT(*) as cnt FROM admins WHERE email = ?", [ADMIN_EMAIL]);
  const count = existing.length > 0 ? Number(existing[0].values[0][0]) : 0;
  if (count === 0) {
    db.run("INSERT INTO admins (id, email, password) VALUES (?, ?, ?)", [
      uuid(),
      ADMIN_EMAIL,
      hashPassword(ADMIN_PASSWORD),
    ]);
  }

  saveDb();
}

/**
 * Connexion d'un client par courriel + mot de passe.
 * @param req Corps : `{ email, password }`.
 * @param res `{ success, role: "client", client: {...} }`, ou 400/401.
 */
export async function clientLogin(req: Request, res: Response) {
  const db = await getDb();
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: "Courriel et mot de passe requis." });
    return;
  }

  const stmt = db.prepare("SELECT * FROM clients WHERE email = ?");
  stmt.bind([String(email).trim().toLowerCase()]);
  const found = stmt.step();
  const client = found ? (stmt.getAsObject() as any) : null;
  stmt.free();

  if (!client || !comparePassword(String(password), client.password)) {
    res.status(401).json({ error: "Courriel ou mot de passe incorrect." });
    return;
  }

  res.json({
    success: true,
    role: "client",
    client: {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
    },
  });
}

/**
 * Connexion de l'administrateur par courriel + mot de passe.
 * @param req Corps : `{ email, password }`.
 * @param res `{ success, role: "admin", email }`, ou 400/401.
 */
export async function adminLogin(req: Request, res: Response) {
  const db = await getDb();
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: "Courriel et mot de passe requis." });
    return;
  }

  const stmt = db.prepare("SELECT * FROM admins WHERE email = ?");
  stmt.bind([String(email).trim().toLowerCase()]);
  const found = stmt.step();
  const admin = found ? (stmt.getAsObject() as any) : null;
  stmt.free();

  if (!admin || !comparePassword(String(password), admin.password)) {
    res.status(401).json({ error: "Courriel ou mot de passe incorrect." });
    return;
  }

  res.json({ success: true, role: "admin", email: admin.email });
}
