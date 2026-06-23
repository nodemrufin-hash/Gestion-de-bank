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
import { generateClientFinancials } from "../database/seed";
import { hashPassword } from "./auth";

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
 * Crée un nouveau client (avec mot de passe haché) puis génère ses comptes,
 * transactions, bénéficiaires, objectifs et alerte de solde faible (F-01 / F-19).
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

  // Generation initiale des comptes et transactions (F-19)
  generateClientFinancials(db, id);

  saveDb();
  res.status(201).json({ success: true, id });
}

/**
 * Renvoie la liste de tous les clients, triés par nom puis prénom.
 * @param res Tableau JSON de clients (objet aplati par colonne).
 */
export async function getAll(req: Request, res: Response) {
  const db = await getDb();
  const clients = db.exec("SELECT * FROM clients ORDER BY lastName, firstName");
  const rows = clients.length > 0 ? clients[0].values.map((v: any[]) => ({
    id: v[0], firstName: v[1], lastName: v[2], email: v[3], phone: v[4],
    address: v[5], city: v[6], province: v[7], postalCode: v[8], dateNaissance: v[9],
  })) : [];
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
