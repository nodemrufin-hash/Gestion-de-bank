/**
 * Contrôleur des alertes de solde faible.
 *
 * Chaque alerte associe un compte à un seuil ; le client peut l'activer et en
 * ajuster la valeur. (Le déclenchement effectif de la notification n'est pas
 * encore implémenté.)
 */
import { Request, Response } from "express";
import { getDb, saveDb } from "../database/database";

/**
 * Renvoie les alertes de solde faible d'un client.
 * @param req `params.clientId` : identifiant du client.
 * @param res Tableau JSON des alertes.
 */
export async function getByClient(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM low_balance_alerts WHERE clientId = ?");
  stmt.bind([req.params.clientId as string]);
  const alerts: any[] = [];
  while (stmt.step()) alerts.push(stmt.getAsObject());
  stmt.free();
  res.json(alerts);
}

/**
 * Met à jour le seuil et l'état (activé/désactivé) d'une alerte de solde faible.
 * @param req `params.id` + corps `{ threshold, enabled }`.
 * @param res `{ success: true }`.
 */
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
