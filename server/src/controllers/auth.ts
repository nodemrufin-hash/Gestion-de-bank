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
import { createSession, destroySession } from "../auth/sessions";

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

  // Migration : colonnes de vérification du courriel (ajoutées ultérieurement).
  if (!columnExists(db, "clients", "emailVerified")) {
    db.run("ALTER TABLE clients ADD COLUMN emailVerified INTEGER NOT NULL DEFAULT 0");
  }
  if (!columnExists(db, "clients", "verificationCode")) {
    db.run("ALTER TABLE clients ADD COLUMN verificationCode TEXT");
  }
  if (!columnExists(db, "clients", "verificationExpires")) {
    db.run("ALTER TABLE clients ADD COLUMN verificationExpires TEXT");
  }

  // Backfill : mot de passe par défaut pour les clients sans mot de passe.
  const defaultHash = hashPassword(DEFAULT_CLIENT_PASSWORD);
  db.run("UPDATE clients SET password = ? WHERE password IS NULL OR password = ''", [defaultHash]);

  // Backfill : les clients déjà présents (démo/seed, sans code en attente) sont
  // considérés comme vérifiés afin de ne pas bloquer leur connexion.
  db.run(
    "UPDATE clients SET emailVerified = 1 WHERE emailVerified = 0 AND (verificationCode IS NULL OR verificationCode = '')"
  );

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

  // Le courriel doit être vérifié avant de pouvoir se connecter.
  if (Number(client.emailVerified) !== 1) {
    res.status(403).json({
      error: "Veuillez vérifier votre courriel avant de vous connecter.",
      needsVerification: true,
      email: client.email,
    });
    return;
  }

  const token = createSession({ role: "client", clientId: client.id, email: client.email });

  res.json({
    success: true,
    role: "client",
    token,
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

  const token = createSession({ role: "admin", email: admin.email });

  res.json({ success: true, role: "admin", token, email: admin.email });
}

/**
 * Déconnexion : détruit la session associée au jeton `Bearer` présenté.
 * Toujours `{ success: true }` (idempotent, même si le jeton est absent).
 */
export async function logout(req: Request, res: Response) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token) destroySession(token);
  res.json({ success: true });
}

/**
 * Vérifie le couple courriel + mot de passe d'un administrateur existant.
 * Sert à confirmer une action sensible (création/suppression) en redemandant
 * le mot de passe de l'admin courant.
 */
export function verifyAdminCredentials(db: Database, email: unknown, password: unknown): boolean {
  if (!email || !password) return false;
  const stmt = db.prepare("SELECT password FROM admins WHERE email = ?");
  stmt.bind([String(email).trim().toLowerCase()]);
  const found = stmt.step();
  const row = found ? (stmt.getAsObject() as any) : null;
  stmt.free();
  return !!row && comparePassword(String(password), row.password);
}

/**
 * Liste les comptes administrateurs (sans les mots de passe).
 * @param res Tableau JSON `{ id, email, createdAt }`.
 */
export async function listAdmins(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare("SELECT id, email, createdAt FROM admins ORDER BY createdAt");
  stmt.bind([]);
  const admins: any[] = [];
  while (stmt.step()) admins.push(stmt.getAsObject());
  stmt.free();
  res.json(admins);
}

/**
 * Crée un nouveau compte administrateur (mot de passe haché). Exige le mot de
 * passe de l'admin courant pour confirmer l'action.
 * @param req Corps : `{ email, password, currentEmail, currentPassword }`.
 * @param res 201 `{ success, id }` ; 400 (format invalide) ; 401 (confirmation
 *            invalide) ; 409 (courriel déjà utilisé).
 */
export async function createAdmin(req: Request, res: Response) {
  const db = await getDb();
  const { email, password, currentEmail, currentPassword } = req.body ?? {};

  // Confirmation : l'admin courant doit re-saisir son mot de passe.
  if (!verifyAdminCredentials(db, currentEmail, currentPassword)) {
    res.status(401).json({ error: "Mot de passe administrateur incorrect." });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(String(email))) {
    res.status(400).json({ error: "Adresse courriel invalide." });
    return;
  }
  if (!password || String(password).length < 8) {
    res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.exec("SELECT 1 FROM admins WHERE email = ?", [normalizedEmail]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    res.status(409).json({ error: "Un administrateur existe déjà avec ce courriel." });
    return;
  }

  const id = uuid();
  db.run("INSERT INTO admins (id, email, password) VALUES (?, ?, ?)", [
    id,
    normalizedEmail,
    hashPassword(String(password)),
  ]);
  saveDb();
  res.status(201).json({ success: true, id });
}

/**
 * Supprime un compte administrateur. Exige le mot de passe de l'admin courant
 * pour confirmer, et refuse de supprimer le dernier admin restant pour ne pas
 * verrouiller l'accès à l'administration.
 * @param req `params.id` + corps `{ currentEmail, currentPassword }`.
 * @param res `{ success: true }` ; 400 (dernier admin) ; 401 (confirmation invalide).
 */
export async function deleteAdmin(req: Request, res: Response) {
  const db = await getDb();
  const { currentEmail, currentPassword } = req.body ?? {};

  // Confirmation : l'admin courant doit re-saisir son mot de passe.
  if (!verifyAdminCredentials(db, currentEmail, currentPassword)) {
    res.status(401).json({ error: "Mot de passe administrateur incorrect." });
    return;
  }

  const countRes = db.exec("SELECT COUNT(*) FROM admins");
  const count = countRes.length > 0 ? Number(countRes[0].values[0][0]) : 0;
  if (count <= 1) {
    res.status(400).json({ error: "Impossible de supprimer le dernier administrateur." });
    return;
  }
  db.run("DELETE FROM admins WHERE id = ?", [req.params.id as string]);
  saveDb();
  res.json({ success: true });
}
