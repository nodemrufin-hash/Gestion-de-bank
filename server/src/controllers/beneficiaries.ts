import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { getDb, saveDb } from "../database/database";

export async function getByClient(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM beneficiaries WHERE clientId = ? ORDER BY name");
  stmt.bind([req.params.clientId]);
  const list: any[] = [];
  while (stmt.step()) list.push(stmt.getAsObject());
  stmt.free();
  res.json(list);
}

export async function create(req: Request, res: Response) {
  const db = await getDb();
  const { clientId, name, email, phone, isFournisseur } = req.body;
  if (!name || !clientId) {
    res.status(400).json({ error: "Nom et clientId requis" });
    return;
  }
  const id = uuid();
  db.run(
    "INSERT INTO beneficiaries (id, clientId, name, email, phone, isFournisseur) VALUES (?, ?, ?, ?, ?, ?)",
    [id, clientId, name, email || null, phone || null, isFournisseur ? 1 : 0]
  );
  saveDb();
  res.json({ success: true, id });
}

export async function remove(req: Request, res: Response) {
  const db = await getDb();
  db.run("DELETE FROM beneficiaries WHERE id = ?", [req.params.id]);
  saveDb();
  res.json({ success: true });
}
