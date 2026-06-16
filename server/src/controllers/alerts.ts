import { Request, Response } from "express";
import { getDb, saveDb } from "../database/database";

export async function getByClient(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM low_balance_alerts WHERE clientId = ?");
  stmt.bind([req.params.clientId]);
  const alerts: any[] = [];
  while (stmt.step()) alerts.push(stmt.getAsObject());
  stmt.free();
  res.json(alerts);
}

export async function update(req: Request, res: Response) {
  const db = await getDb();
  const { threshold, enabled } = req.body;
  db.run(
    "UPDATE low_balance_alerts SET threshold = ?, enabled = ? WHERE id = ?",
    [threshold, enabled ? 1 : 0, req.params.id]
  );
  saveDb();
  res.json({ success: true });
}
