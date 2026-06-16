import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { getDb, saveDb } from "../database/database";
import { generateClientFinancials } from "../database/seed";

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

  const { firstName, lastName, email, phone, address, city, province, postalCode, dateNaissance } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email))) {
    res.status(400).json({ error: "Adresse courriel invalide." });
    return;
  }

  const id = uuid();
  db.run(
    `INSERT INTO clients (id, firstName, lastName, email, phone, address, city, province, postalCode, dateNaissance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, firstName, lastName, email, phone, address, city, province, postalCode, dateNaissance]
  );

  // Generation initiale des comptes et transactions (F-19)
  generateClientFinancials(db, id);

  saveDb();
  res.status(201).json({ success: true, id });
}

export async function getAll(req: Request, res: Response) {
  const db = await getDb();
  const clients = db.exec("SELECT * FROM clients ORDER BY lastName, firstName");
  const rows = clients.length > 0 ? clients[0].values.map((v: any[]) => ({
    id: v[0], firstName: v[1], lastName: v[2], email: v[3], phone: v[4],
    address: v[5], city: v[6], province: v[7], postalCode: v[8], dateNaissance: v[9],
  })) : [];
  res.json(rows);
}

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

export async function getAccounts(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM accounts WHERE clientId = ? ORDER BY type");
  stmt.bind([req.params.id as string]);
  const accounts: any[] = [];
  while (stmt.step()) accounts.push(stmt.getAsObject());
  stmt.free();
  res.json(accounts);
}

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
