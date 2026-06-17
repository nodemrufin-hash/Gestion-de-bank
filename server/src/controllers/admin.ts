import { Request, Response } from "express";
import { getDb, saveDb } from "../database/database";
import { resetDb } from "../database/database";
import { seed } from "../database/seed";

export async function getParameters(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM parameters ORDER BY key");
  stmt.bind([]);
  const params: any[] = [];
  while (stmt.step()) params.push(stmt.getAsObject());
  stmt.free();
  res.json(params);
}

export async function updateParameter(req: Request, res: Response) {
  const db = await getDb();
  const { key, value } = req.body;
  if (!key || value === undefined) {
    res.status(400).json({ error: "key et value requis" });
    return;
  }
  db.run(
    "INSERT INTO parameters (key, value, updatedAt) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = datetime('now')",
    [key, String(value)]
  );
  saveDb();
  res.json({ success: true });
}

export async function resetAll(req: Request, res: Response) {
  resetDb();
  await seed();
  res.json({ success: true, message: "Toutes les données ont été réinitialisées." });
}
