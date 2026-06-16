import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { getDb, saveDb } from "../database/database";

export async function getByClient(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM saving_goals WHERE clientId = ? ORDER BY createdAt");
  stmt.bind([req.params.clientId]);
  const goals: any[] = [];
  while (stmt.step()) goals.push(stmt.getAsObject());
  stmt.free();
  res.json(goals);
}

export async function create(req: Request, res: Response) {
  const db = await getDb();
  const { clientId, accountId, name, targetAmount } = req.body;
  if (!clientId || !accountId || !name || !targetAmount) {
    res.status(400).json({ error: "Champs requis manquants" });
    return;
  }
  const id = uuid();
  db.run(
    "INSERT INTO saving_goals (id, clientId, accountId, name, targetAmount, currentAmount) VALUES (?, ?, ?, ?, ?, ?)",
    [id, clientId, accountId, name, targetAmount, 0]
  );
  saveDb();
  res.json({ success: true, id });
}

export async function updateProgress(req: Request, res: Response) {
  const db = await getDb();
  const { id, amount } = req.body;
  if (!id || !amount) {
    res.status(400).json({ error: "ID et montant requis" });
    return;
  }
  db.run("UPDATE saving_goals SET currentAmount = currentAmount + ? WHERE id = ?", [amount, id]);
  saveDb();
  res.json({ success: true });
}

export async function remove(req: Request, res: Response) {
  const db = await getDb();
  db.run("DELETE FROM saving_goals WHERE id = ?", [req.params.id]);
  saveDb();
  res.json({ success: true });
}
