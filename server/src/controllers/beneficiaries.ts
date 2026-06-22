/**
 * Contrôleur des bénéficiaires et fournisseurs.
 *
 * Un bénéficiaire (`isFournisseur = 0`) sert aux virements Interac ; un
 * fournisseur (`isFournisseur = 1`) sert au paiement de factures. Gère la
 * liste, la création et la suppression.
 */
import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { getDb, saveDb } from "../database/database";

/**
 * Renvoie les bénéficiaires (et fournisseurs) d'un client, triés par nom.
 * @param req `params.clientId` : identifiant du client.
 * @param res Tableau JSON des bénéficiaires.
 */
export async function getByClient(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM beneficiaries WHERE clientId = ? ORDER BY name");
  stmt.bind([req.params.clientId as string]);
  const list: any[] = [];
  while (stmt.step()) list.push(stmt.getAsObject());
  stmt.free();
  res.json(list);
}

/**
 * Crée un bénéficiaire ou un fournisseur pour un client.
 * @param req Corps : `{ clientId, name, email?, phone?, isFournisseur? }`.
 * @param res `{ success, id }`, ou 400 si `name`/`clientId` manquant.
 */
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

/**
 * Supprime un bénéficiaire par son identifiant.
 * @param req `params.id` : identifiant du bénéficiaire.
 * @param res `{ success: true }`.
 */
export async function remove(req: Request, res: Response) {
  const db = await getDb();
  db.run("DELETE FROM beneficiaries WHERE id = ?", [req.params.id as string]);
  saveDb();
  res.json({ success: true });
}
