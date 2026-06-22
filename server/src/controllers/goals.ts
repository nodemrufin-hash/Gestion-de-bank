/**
 * Contrôleur des objectifs d'épargne.
 *
 * Permet à un client de définir des objectifs (montant cible) rattachés à un
 * compte d'épargne et d'en suivre la progression (montant courant).
 */
import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { getDb, saveDb } from "../database/database";

/**
 * Renvoie les objectifs d'épargne d'un client, du plus ancien au plus récent.
 * @param req `params.clientId` : identifiant du client.
 * @param res Tableau JSON des objectifs.
 */
export async function getByClient(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM saving_goals WHERE clientId = ? ORDER BY createdAt");
  stmt.bind([req.params.clientId as string]);
  const goals: any[] = [];
  while (stmt.step()) goals.push(stmt.getAsObject());
  stmt.free();
  res.json(goals);
}

/**
 * Crée un objectif d'épargne (montant courant initialisé à 0).
 * @param req Corps : `{ clientId, accountId, name, targetAmount }`.
 * @param res `{ success, id }`, ou 400 si un champ requis manque.
 */
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

/**
 * Ajoute un montant à la progression d'un objectif d'épargne.
 * @param req Corps : `{ id, amount }` (montant à ajouter au montant courant).
 * @param res `{ success: true }`, ou 400 si `id`/`amount` manquant.
 */
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

/**
 * Supprime un objectif d'épargne par son identifiant.
 * @param req `params.id` : identifiant de l'objectif.
 * @param res `{ success: true }`.
 */
export async function remove(req: Request, res: Response) {
  const db = await getDb();
  db.run("DELETE FROM saving_goals WHERE id = ?", [req.params.id as string]);
  saveDb();
  res.json({ success: true });
}
