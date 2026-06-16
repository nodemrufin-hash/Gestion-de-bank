import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { getDb, saveDb } from "../database/database";

export async function getByAccount(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare(
    "SELECT * FROM transactions WHERE accountId = ? AND isFuture = 0 ORDER BY date DESC LIMIT 100"
  );
  stmt.bind([req.params.accountId]);
  const txs: any[] = [];
  while (stmt.step()) txs.push(stmt.getAsObject());
  stmt.free();
  res.json(txs);
}

export async function getFuture(req: Request, res: Response) {
  const db = await getDb();
  const stmt = db.prepare(
    "SELECT * FROM transactions WHERE accountId = ? AND isFuture = 1 ORDER BY scheduledDate ASC"
  );
  stmt.bind([req.params.accountId]);
  const txs: any[] = [];
  while (stmt.step()) txs.push(stmt.getAsObject());
  stmt.free();
  res.json(txs);
}

export async function getRecurring(req: Request, res: Response) {
  const db = await getDb();
  const accountId = req.params.accountId;
  const stmt = db.prepare(
    "SELECT * FROM transactions WHERE accountId = ? AND isRecurring = 1 ORDER BY date DESC"
  );
  stmt.bind([accountId]);
  const txs: any[] = [];
  while (stmt.step()) txs.push(stmt.getAsObject());
  stmt.free();
  res.json(txs);
}

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
