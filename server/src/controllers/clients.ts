/**
 * Contrôleur des clients.
 *
 * Gère les profils clients : création (avec génération automatique des comptes
 * et transactions initiales), consultation, liste, soldes par catégorie et
 * réinitialisation. Chaque handler reçoit/renvoie du JSON via Express.
 */
import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { getDb, saveDb } from "../database/database";
import { generateEmptyAccounts } from "../database/seed";
import { hashPassword, verifyAdminCredentials } from "./auth";
import { issueVerificationCode } from "./verification";

const REQUIRED_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "address",
  "city",
  "province",
  "postalCode",
  "dateNaissance",
] as const;

/**
 * Crée un nouveau client (avec mot de passe haché) puis lui ouvre des comptes
 * vierges (solde 0, sans transactions), comme à l'ouverture réelle d'un compte.
 * @param req Corps : champs de REQUIRED_FIELDS + `password` (min 8 caractères).
 * @param res 201 `{ success, id }` ; 400 (champ/format invalide) ; 409 (courriel déjà utilisé).
 */
export async function create(req: Request, res: Response) {
  const db = await getDb();

  // Validation cote serveur (cahier des charges 3.2 / 5.1)
  for (const field of REQUIRED_FIELDS) {
    const value = req.body?.[field];
    if (value === undefined || value === null || String(value).trim() === "") {
      res.status(400).json({ error: `Le champ « ${field} » est requis.` });
      return;
    }
  }

  const { firstName, lastName, email, phone, address, city, province, postalCode, dateNaissance, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email))) {
    res.status(400).json({ error: "Adresse courriel invalide." });
    return;
  }

  if (!password || String(password).length < 8) {
    res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // Le courriel sert d'identifiant de connexion : il doit être unique.
  const existing = db.exec("SELECT 1 FROM clients WHERE email = ?", [normalizedEmail]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    res.status(409).json({ error: "Un compte existe déjà avec ce courriel." });
    return;
  }

  const id = uuid();
  db.run(
    `INSERT INTO clients (id, firstName, lastName, email, password, phone, address, city, province, postalCode, dateNaissance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, firstName, lastName, normalizedEmail, hashPassword(String(password)), phone, address, city, province, postalCode, dateNaissance]
  );

  // Ouverture de comptes vierges (solde 0, sans transactions).
  generateEmptyAccounts(db, id);

  saveDb();

  // Vérification du courriel : génère et envoie un code. Le compte reste
  // « non vérifié » tant que le client n'a pas confirmé (connexion bloquée).
  const { sent } = await issueVerificationCode(db, id, normalizedEmail, firstName);

  res.status(201).json({ success: true, id, emailVerificationRequired: true, emailSent: sent });
}

/**
 * Renvoie la liste de tous les clients, triés par nom puis prénom.
 *
 * Les colonnes sont sélectionnées explicitement et lues par nom : le mot de
 * passe n'est jamais exposé, et le résultat ne dépend pas de l'ordre des
 * colonnes en base (celui-ci diffère entre une base créée par le schéma et une
 * base migrée par `ALTER TABLE`, qui ajoute les colonnes en fin de table).
 * @param res Tableau JSON de clients (sans données sensibles).
 */
export async function getAll(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare(
    `SELECT id, firstName, lastName, email, phone, address, city, province,
            postalCode, dateNaissance, emailVerified
     FROM clients ORDER BY lastName, firstName`
  );
  const rows: any[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  res.json(rows);
}

/**
 * Renvoie un client par son identifiant.
 * @param req `params.id` : identifiant du client.
 * @param res Le client en JSON, ou 404 s'il n'existe pas.
 */
export async function getById(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM clients WHERE id = ?");
  stmt.bind([req.params.id as string]);
  if (stmt.step()) {
    const v = stmt.getAsObject();
    res.json(v);
  } else {
    res.status(404).json({ error: "Client non trouvé" });
  }
  stmt.free();
}

/**
 * Renvoie tous les comptes d'un client, triés par type.
 * @param req `params.id` : identifiant du client.
 * @param res Tableau JSON des comptes.
 */
export async function getAccounts(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM accounts WHERE clientId = ? ORDER BY type");
  stmt.bind([req.params.id as string]);
  const accounts: any[] = [];
  while (stmt.step()) accounts.push(stmt.getAsObject());
  stmt.free();
  res.json(accounts);
}

/**
 * Calcule le solde total d'un client regroupé par catégorie de compte
 * (dépenses, épargne, emprunt, investissement) et associe une couleur à chacune.
 * @param req `params.id` : identifiant du client.
 * @param res Tableau JSON `{ category, total, color }`.
 */
export async function getBalancesByCategory(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare(
    "SELECT category, SUM(balance) as total FROM accounts WHERE clientId = ? GROUP BY category"
  );
  stmt.bind([req.params.id as string]);
  const categories: any[] = [];
  while (stmt.step()) categories.push(stmt.getAsObject());
  stmt.free();

  const colorMap: Record<string, string> = {
    depenses: "#3b82f6",
    epargne: "#10b981",
    emprunt: "#ef4444",
    investissement: "#8b5cf6",
  };

  res.json(
    categories.map((c) => ({
      category: c.category,
      total: c.total,
      color: colorMap[c.category as string] || "#6b7280",
    }))
  );
}

/**
 * Réinitialise un profil client en supprimant ses comptes, transactions,
 * objectifs, alertes et bénéficiaires. (Ne régénère pas de nouvelles données.)
 * @param req `params.id` : identifiant du client.
 * @param res `{ success: true }`.
 */
export async function resetClient(req: Request, res: Response) {
  const db = await getDb();
  const clientId = req.params.id as string;

  // Delete transactions
  const accStmt = db.prepare("SELECT id FROM accounts WHERE clientId = ?");
  accStmt.bind([clientId]);
  while (accStmt.step()) {
    const acc = accStmt.getAsObject() as any;
    db.run("DELETE FROM transactions WHERE accountId = ?", [acc.id]);
  }
  accStmt.free();

  // Delete goals, alerts, beneficiaries
  db.run("DELETE FROM saving_goals WHERE clientId = ?", [clientId]);
  db.run("DELETE FROM low_balance_alerts WHERE clientId = ?", [clientId]);
  db.run("DELETE FROM beneficiaries WHERE clientId = ?", [clientId]);
  db.run("DELETE FROM accounts WHERE clientId = ?", [clientId]);

  saveDb();
  res.json({ success: true });
}

/**
 * Supprime définitivement un client : efface d'abord toutes ses données
 * (transactions, comptes, objectifs, alertes, bénéficiaires) puis le profil
 * lui-même. Action irréversible, réservée à l'administrateur : exige le mot de
 * passe de l'admin courant pour confirmer.
 * @param req `params.id` + corps `{ currentEmail, currentPassword }`.
 * @param res `{ success: true }` ; 401 (confirmation invalide) ; 404 (client absent).
 */
export async function deleteClient(req: Request, res: Response) {
  const db = await getDb();
  const clientId = req.params.id as string;
  const { currentEmail, currentPassword } = req.body ?? {};

  // Confirmation : l'admin courant doit re-saisir son mot de passe.
  if (!verifyAdminCredentials(db, currentEmail, currentPassword)) {
    res.status(401).json({ error: "Mot de passe administrateur incorrect." });
    return;
  }

  // Vérifie l'existence du client.
  const exists = db.exec("SELECT 1 FROM clients WHERE id = ?", [clientId]);
  if (exists.length === 0 || exists[0].values.length === 0) {
    res.status(404).json({ error: "Client non trouvé" });
    return;
  }

  // Supprime les données liées (les clés étrangères en cascade ne sont pas
  // activées par défaut sous sql.js, on nettoie donc explicitement).
  const accStmt = db.prepare("SELECT id FROM accounts WHERE clientId = ?");
  accStmt.bind([clientId]);
  while (accStmt.step()) {
    const acc = accStmt.getAsObject() as any;
    db.run("DELETE FROM transactions WHERE accountId = ?", [acc.id]);
  }
  accStmt.free();

  db.run("DELETE FROM saving_goals WHERE clientId = ?", [clientId]);
  db.run("DELETE FROM low_balance_alerts WHERE clientId = ?", [clientId]);
  db.run("DELETE FROM beneficiaries WHERE clientId = ?", [clientId]);
  db.run("DELETE FROM accounts WHERE clientId = ?", [clientId]);
  db.run("DELETE FROM clients WHERE id = ?", [clientId]);

  saveDb();
  res.json({ success: true });
}
