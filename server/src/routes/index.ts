/**
 * Définition des routes de l'API REST (préfixe `/api`).
 *
 * Associe chaque endpoint HTTP à son handler de contrôleur : clients, comptes,
 * transactions/opérations, bénéficiaires, objectifs, alertes, administration et
 * cartes de crédit. `multer` gère l'upload de la photo de chèque en mémoire.
 */
import { Router } from "express";
import multer from "multer";
import * as clients from "../controllers/clients";
import * as transactions from "../controllers/transactions";
import * as beneficiaries from "../controllers/beneficiaries";
import * as goals from "../controllers/goals";
import * as alerts from "../controllers/alerts";
import * as admin from "../controllers/admin";
import * as auth from "../controllers/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Authentification ---
router.post("/auth/login", auth.clientLogin);
router.post("/auth/admin/login", auth.adminLogin);

// --- Clients ---
router.get("/clients", clients.getAll);
router.post("/clients", clients.create);
router.get("/clients/:id", clients.getById);
router.get("/clients/:id/accounts", clients.getAccounts);
router.get("/clients/:id/balances", clients.getBalancesByCategory);
router.post("/clients/:id/reset", clients.resetClient);

// --- Transactions ---
router.get("/accounts/:accountId/transactions", transactions.getByAccount);
router.get("/accounts/:accountId/transactions/future", transactions.getFuture);
router.get("/accounts/:accountId/transactions/recurring", transactions.getRecurring);

// --- Operations ---
router.post("/transactions/transfer", transactions.internalTransfer);
router.post("/transactions/interac", transactions.interacTransfer);
router.post("/transactions/paybill", transactions.payBill);
router.post("/transactions/deposit", transactions.deposit);
router.post("/transactions/withdraw", transactions.withdraw);
router.post("/transactions/deposit-cheque", upload.single("chequeImage"), transactions.depositCheque);

// --- Beneficiaries ---
router.get("/clients/:clientId/beneficiaries", beneficiaries.getByClient);
router.post("/beneficiaries", beneficiaries.create);
router.delete("/beneficiaries/:id", beneficiaries.remove);

// --- Saving Goals ---
router.get("/clients/:clientId/goals", goals.getByClient);
router.post("/goals", goals.create);
router.put("/goals/progress", goals.updateProgress);
router.delete("/goals/:id", goals.remove);

// --- Alerts ---
router.get("/clients/:clientId/alerts", alerts.getByClient);
router.put("/alerts/:id", alerts.update);

// --- Admin ---
router.get("/admin/parameters", admin.getParameters);
router.put("/admin/parameters", admin.updateParameter);
router.post("/admin/reset", admin.resetAll);

// --- Credit card ---
/** GET /accounts/:accountId — renvoie un compte par son identifiant (404 sinon). */
router.get("/accounts/:accountId", async (req, res) => {
  const { getDb } = await import("../database/database");
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  stmt.bind([req.params.accountId]);
  if (stmt.step()) {
    res.json(stmt.getAsObject());
  } else {
    res.status(404).json({ error: "Compte non trouvé" });
  }
  stmt.free();
});

/**
 * POST /accounts/:accountId/pay-credit — paie (partiellement) une carte de
 * crédit depuis un compte chèques : débite la source, réduit la dette de la
 * carte et enregistre les deux transactions. 400/404 en cas d'erreur.
 */
router.post("/accounts/:accountId/pay-credit", async (req, res) => {
  const { getDb, saveDb } = await import("../database/database");
  const { v4: uuid } = await import("uuid");
  const db = await getDb();
  const { fromAccountId, amount } = req.body;

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    res.status(400).json({ error: "Montant invalide" });
    return;
  }

  const creditStmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  creditStmt.bind([req.params.accountId]);
  if (!creditStmt.step()) { res.status(404).json({ error: "Compte crédit non trouvé" }); creditStmt.free(); return; }
  const creditAcc = creditStmt.getAsObject() as any;
  creditStmt.free();

  const fromStmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  fromStmt.bind([fromAccountId]);
  if (!fromStmt.step()) { res.status(404).json({ error: "Compte source non trouvé" }); fromStmt.free(); return; }
  const fromAcc = fromStmt.getAsObject() as any;
  fromStmt.free();

  if (fromAcc.balance < amt) {
    res.status(400).json({ error: "Solde insuffisant" });
    return;
  }

  // Reduce debt (credit balance is negative)
  const newCreditBalance = Math.min(0, creditAcc.balance + amt);
  const actualPayment = creditAcc.balance + amt > 0 ? Math.abs(creditAcc.balance) : amt;

  const now = new Date().toISOString().split("T")[0];
  db.run("INSERT INTO transactions (id, accountId, date, description, amount, type, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [uuid(), fromAccountId, now, "Paiement carte de crédit", actualPayment, "debit", "depenses", "complete"]
  );
  db.run("INSERT INTO transactions (id, accountId, date, description, amount, type, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [uuid(), req.params.accountId, now, "Paiement reçu", actualPayment, "credit", "emprunt", "complete"]
  );
  db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [actualPayment, fromAccountId]);
  db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [actualPayment, req.params.accountId]);

  saveDb();
  res.json({ success: true });
});

export default router;
