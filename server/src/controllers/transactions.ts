/**
 * Contrôleur des transactions et opérations bancaires.
 *
 * Regroupe la consultation des transactions (historique, futures, récurrentes)
 * et les opérations qui modifient les soldes : virement interne, virement
 * Interac, paiement de facture, dépôt, retrait et dépôt de chèque. Chaque
 * opération valide le montant et le solde avant d'écrire en base.
 */
import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { getDb, saveDb } from "../database/database";

/**
 * Renvoie l'historique des transactions complétées d'un compte (100 plus récentes).
 * @param req `params.accountId` : identifiant du compte.
 * @param res Tableau JSON des transactions (hors transactions futures).
 */
export async function getByAccount(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare(
    "SELECT * FROM transactions WHERE accountId = ? AND isFuture = 0 ORDER BY date DESC LIMIT 100"
  );
  stmt.bind([req.params.accountId as string]);
  const txs: any[] = [];
  while (stmt.step()) txs.push(stmt.getAsObject());
  stmt.free();
  res.json(txs);
}

/**
 * Renvoie les transactions futures (planifiées) d'un compte, triées par date prévue.
 * @param req `params.accountId` : identifiant du compte.
 * @param res Tableau JSON des transactions à venir.
 */
export async function getFuture(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare(
    "SELECT * FROM transactions WHERE accountId = ? AND isFuture = 1 ORDER BY scheduledDate ASC"
  );
  stmt.bind([req.params.accountId as string]);
  const txs: any[] = [];
  while (stmt.step()) txs.push(stmt.getAsObject());
  stmt.free();
  res.json(txs);
}

/**
 * Renvoie les transactions récurrentes d'un compte.
 * @param req `params.accountId` : identifiant du compte.
 * @param res Tableau JSON des transactions récurrentes.
 */
export async function getRecurring(req: Request, res: Response) {
  const db = await getDb();
  const accountId = req.params.accountId as string;
  const stmt = db.prepare(
    "SELECT * FROM transactions WHERE accountId = ? AND isRecurring = 1 ORDER BY date DESC"
  );
  stmt.bind([accountId]);
  const txs: any[] = [];
  while (stmt.step()) txs.push(stmt.getAsObject());
  stmt.free();
  res.json(txs);
}

/**
 * Effectue un virement interne entre deux comptes du même client : débite la
 * source, crédite la destination et enregistre les deux transactions liées.
 * @param req Corps : `{ fromAccountId, toAccountId, amount, description? }`.
 * @param res `{ success, transactionId }`, ou 400/404 (montant invalide,
 *            solde insuffisant, compte introuvable).
 */
export async function internalTransfer(req: Request, res: Response) {
  const db = await getDb();
  const { fromAccountId, toAccountId, amount, description } = req.body;

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    res.status(400).json({ error: "Montant invalide" });
    return;
  }

  const fromStmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  fromStmt.bind([fromAccountId]);
  if (!fromStmt.step()) { res.status(404).json({ error: "Compte source non trouvé" }); fromStmt.free(); return; }
  const fromAcc = fromStmt.getAsObject() as any;
  fromStmt.free();

  if (fromAcc.balance < amt) {
    res.status(400).json({ error: "Solde insuffisant" });
    return;
  }

  const toStmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  toStmt.bind([toAccountId]);
  if (!toStmt.step()) { res.status(404).json({ error: "Compte destination non trouvé" }); toStmt.free(); return; }
  const toAcc = toStmt.getAsObject() as any;
  toStmt.free();

  const now = new Date().toISOString().split("T")[0];
  const desc = description || "Virement interne";

  // Debit from source
  const txFrom = uuid();
  db.run(
    "INSERT INTO transactions (id, accountId, date, description, amount, type, category, relatedAccountId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [txFrom, fromAccountId, now, desc, amt, "debit", fromAcc.category, toAccountId, "complete"]
  );

  // Credit to destination
  const txTo = uuid();
  db.run(
    "INSERT INTO transactions (id, accountId, date, description, amount, type, category, relatedAccountId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [txTo, toAccountId, now, desc, amt, "credit", toAcc.category, fromAccountId, "complete"]
  );

  // Update balances
  db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amt, fromAccountId]);
  db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amt, toAccountId]);

  saveDb();
  res.json({ success: true, transactionId: txFrom });
}

/**
 * Effectue un virement Interac vers un bénéficiaire : débite le compte source
 * et enregistre la transaction sortante.
 * @param req Corps : `{ fromAccountId, beneficiaryId, amount, description? }`.
 * @param res `{ success, transactionId }`, ou 400/404 (montant invalide,
 *            solde insuffisant, bénéficiaire introuvable).
 */
export async function interacTransfer(req: Request, res: Response) {
  const db = await getDb();
  const { fromAccountId, beneficiaryId, amount, description } = req.body;

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    res.status(400).json({ error: "Montant invalide" });
    return;
  }

  const fromStmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  fromStmt.bind([fromAccountId]);
  if (!fromStmt.step()) { res.status(404).json({ error: "Compte source non trouvé" }); fromStmt.free(); return; }
  const fromAcc = fromStmt.getAsObject() as any;
  fromStmt.free();

  if (fromAcc.balance < amt) {
    res.status(400).json({ error: "Solde insuffisant" });
    return;
  }

  const benStmt = db.prepare("SELECT * FROM beneficiaries WHERE id = ?");
  benStmt.bind([beneficiaryId]);
  if (!benStmt.step()) { res.status(404).json({ error: "Bénéficiaire non trouvé" }); benStmt.free(); return; }
  const ben = benStmt.getAsObject() as any;
  benStmt.free();

  const now = new Date().toISOString().split("T")[0];
  const desc = description || `Virement Interac à ${ben.name}`;

  const txId = uuid();
  db.run(
    "INSERT INTO transactions (id, accountId, date, description, amount, type, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [txId, fromAccountId, now, desc, amt, "debit", fromAcc.category, "complete"]
  );
  db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amt, fromAccountId]);

  saveDb();
  res.json({ success: true, transactionId: txId });
}

/**
 * Paie une facture auprès d'un fournisseur : débite le compte source et
 * enregistre la transaction (catégorie « dépenses »).
 * @param req Corps : `{ fromAccountId, fournisseurId, amount }`.
 * @param res `{ success, transactionId }`, ou 400/404 (montant invalide,
 *            solde insuffisant, fournisseur introuvable).
 */
export async function payBill(req: Request, res: Response) {
  const db = await getDb();
  const { fromAccountId, fournisseurId, amount } = req.body;

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    res.status(400).json({ error: "Montant invalide" });
    return;
  }

  const fromStmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  fromStmt.bind([fromAccountId]);
  if (!fromStmt.step()) { res.status(404).json({ error: "Compte non trouvé" }); fromStmt.free(); return; }
  const fromAcc = fromStmt.getAsObject() as any;
  fromStmt.free();

  if (fromAcc.balance < amt) {
    res.status(400).json({ error: "Solde insuffisant" });
    return;
  }

  const fourStmt = db.prepare("SELECT * FROM beneficiaries WHERE id = ? AND isFournisseur = 1");
  fourStmt.bind([fournisseurId]);
  if (!fourStmt.step()) { res.status(404).json({ error: "Fournisseur non trouvé" }); fourStmt.free(); return; }
  const four = fourStmt.getAsObject() as any;
  fourStmt.free();

  const now = new Date().toISOString().split("T")[0];
  const desc = `Paiement facture — ${four.name}`;

  const txId = uuid();
  db.run(
    "INSERT INTO transactions (id, accountId, date, description, amount, type, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [txId, fromAccountId, now, desc, amt, "debit", "depenses", "complete"]
  );
  db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amt, fromAccountId]);

  saveDb();
  res.json({ success: true, transactionId: txId });
}

/**
 * Effectue un dépôt sur un compte : crédite le solde et enregistre la transaction.
 * @param req Corps : `{ accountId, amount, description? }`.
 * @param res `{ success, transactionId }`, ou 400/404 (montant invalide, compte introuvable).
 */
export async function deposit(req: Request, res: Response) {
  const db = await getDb();
  const { accountId, amount, description } = req.body;

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    res.status(400).json({ error: "Montant invalide" });
    return;
  }

  const accStmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  accStmt.bind([accountId]);
  if (!accStmt.step()) { res.status(404).json({ error: "Compte non trouvé" }); accStmt.free(); return; }
  const acc = accStmt.getAsObject() as any;
  accStmt.free();

  const now = new Date().toISOString().split("T")[0];
  const desc = description || "Dépôt";

  const txId = uuid();
  db.run(
    "INSERT INTO transactions (id, accountId, date, description, amount, type, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [txId, accountId, now, desc, amt, "credit", acc.category, "complete"]
  );
  db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amt, accountId]);

  saveDb();
  res.json({ success: true, transactionId: txId });
}

/**
 * Effectue un retrait sur un compte : débite le solde après vérification des fonds.
 * @param req Corps : `{ accountId, amount, description? }`.
 * @param res `{ success, transactionId }`, ou 400/404 (montant invalide,
 *            solde insuffisant, compte introuvable).
 */
export async function withdraw(req: Request, res: Response) {
  const db = await getDb();
  const { accountId, amount, description } = req.body;

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    res.status(400).json({ error: "Montant invalide" });
    return;
  }

  const accStmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  accStmt.bind([accountId]);
  if (!accStmt.step()) { res.status(404).json({ error: "Compte non trouvé" }); accStmt.free(); return; }
  const acc = accStmt.getAsObject() as any;
  accStmt.free();

  if (acc.balance < amt) {
    res.status(400).json({ error: "Solde insuffisant" });
    return;
  }

  const now = new Date().toISOString().split("T")[0];
  const desc = description || "Retrait";

  const txId = uuid();
  db.run(
    "INSERT INTO transactions (id, accountId, date, description, amount, type, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [txId, accountId, now, desc, amt, "debit", acc.category, "complete"]
  );
  db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amt, accountId]);

  saveDb();
  res.json({ success: true, transactionId: txId });
}

/**
 * Effectue un dépôt de chèque avec photo (envoyée en multipart, stockée en BLOB).
 * Crédite le compte et enregistre la transaction.
 * @param req Corps : `{ accountId, amount, description? }` + fichier `chequeImage`.
 * @param res `{ success, transactionId }`, ou 400/404 (montant invalide, compte introuvable).
 */
export async function depositCheque(req: Request, res: Response) {
  const db = await getDb();
  const { accountId, amount, description } = req.body;
  const chequeImage = (req as any).file?.buffer || null;

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    res.status(400).json({ error: "Montant invalide" });
    return;
  }

  const accStmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  accStmt.bind([accountId]);
  if (!accStmt.step()) { res.status(404).json({ error: "Compte non trouvé" }); accStmt.free(); return; }
  const acc = accStmt.getAsObject() as any;
  accStmt.free();

  const now = new Date().toISOString().split("T")[0];
  const desc = description || "Dépôt de chèque";

  const txId = uuid();
  db.run(
    "INSERT INTO transactions (id, accountId, date, description, amount, type, category, chequeImage, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [txId, accountId, now, desc, amt, "credit", acc.category, chequeImage, "complete"]
  );
  db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amt, accountId]);

  saveDb();
  res.json({ success: true, transactionId: txId });
}
