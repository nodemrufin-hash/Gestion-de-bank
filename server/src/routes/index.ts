/**
 * Définition des routes de l'API REST (préfixe `/api`).
 *
 * Associe chaque endpoint HTTP à son handler de contrôleur : clients, comptes,
 * transactions/opérations, bénéficiaires, objectifs, alertes, administration et
 * cartes de crédit. `multer` gère l'upload de la photo de chèque en mémoire.
 *
 * **Autorisation** : `authenticate` est branché globalement (il attache
 * `req.auth` si un jeton `Bearer` valide est présent), puis chaque route pose
 * ses gardes (voir `middleware/auth.ts`). Les routes publiques (connexion,
 * inscription, vérification du courriel) n'exigent aucune session.
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
import * as assistant from "../controllers/assistant";
import * as verification from "../controllers/verification";
import {
  authenticate,
  requireAdmin,
  requireClient,
  requireSelfOrAdmin,
  requireOwnsAccount,
  requireOwnsResource,
} from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Attache l'identité de l'appelant (si jeton présent) à toutes les requêtes.
router.use(authenticate);

// Sélecteur d'un identifiant de compte issu du corps de requête (opérations).
const fromBody = (field: string) => (req: any) => req.body?.[field];

// --- Authentification (public) ---
router.post("/auth/login", auth.clientLogin);
router.post("/auth/admin/login", auth.adminLogin);
router.post("/auth/logout", auth.logout);

// --- Vérification du courriel (public) ---
router.post("/auth/verify-email", verification.verifyEmail);
router.post("/auth/resend-verification", verification.resendVerification);

// --- Assistant IA (sur son propre profil ; l'admin peut consulter) ---
router.post("/assistant", requireSelfOrAdmin(fromBody("clientId")), assistant.chat);

// --- Clients ---
router.get("/clients", requireAdmin, clients.getAll); // liste globale : admin
router.post("/clients", clients.create); // inscription : public
router.get("/clients/:id", requireSelfOrAdmin("id"), clients.getById);
router.get("/clients/:id/accounts", requireSelfOrAdmin("id"), clients.getAccounts);
router.get("/clients/:id/balances", requireSelfOrAdmin("id"), clients.getBalancesByCategory);
router.post("/clients/:id/reset", requireSelfOrAdmin("id"), clients.resetClient);
// Suppression définitive d'un client : admin uniquement (le contrôleur exige
// en plus le mot de passe de l'admin courant).
router.delete("/clients/:id", requireAdmin, clients.deleteClient);

// --- Transactions (lecture : le compte doit appartenir à l'appelant) ---
router.get("/accounts/:accountId/transactions", requireOwnsAccount("accountId"), transactions.getByAccount);
router.get("/accounts/:accountId/transactions/future", requireOwnsAccount("accountId"), transactions.getFuture);
router.get("/accounts/:accountId/transactions/recurring", requireOwnsAccount("accountId"), transactions.getRecurring);

// --- Operations (client, sur ses propres comptes) ---
router.post("/transactions/transfer", requireClient, requireOwnsAccount(fromBody("fromAccountId"), fromBody("toAccountId")), transactions.internalTransfer);
router.post("/transactions/interac", requireClient, requireOwnsAccount(fromBody("fromAccountId")), transactions.interacTransfer);
router.post("/transactions/paybill", requireClient, requireOwnsAccount(fromBody("fromAccountId")), transactions.payBill);
router.post("/transactions/deposit", requireClient, requireOwnsAccount(fromBody("accountId")), transactions.deposit);
router.post("/transactions/withdraw", requireClient, requireOwnsAccount(fromBody("accountId")), transactions.withdraw);
router.post(
  "/transactions/deposit-cheque",
  requireClient,
  upload.single("chequeImage"),
  requireOwnsAccount(fromBody("accountId")), // après multer : req.body est peuplé
  transactions.depositCheque
);

// --- Beneficiaries ---
router.get("/clients/:clientId/beneficiaries", requireSelfOrAdmin("clientId"), beneficiaries.getByClient);
router.post("/beneficiaries", requireSelfOrAdmin(fromBody("clientId")), beneficiaries.create);
router.delete("/beneficiaries/:id", requireOwnsResource("beneficiaries", "id"), beneficiaries.remove);

// --- Saving Goals ---
router.get("/clients/:clientId/goals", requireSelfOrAdmin("clientId"), goals.getByClient);
router.post("/goals", requireSelfOrAdmin(fromBody("clientId")), goals.create);
router.put("/goals/progress", requireOwnsResource("saving_goals", fromBody("id")), goals.updateProgress);
router.delete("/goals/:id", requireOwnsResource("saving_goals", "id"), goals.remove);

// --- Alerts ---
router.get("/clients/:clientId/alerts", requireSelfOrAdmin("clientId"), alerts.getByClient);
router.put("/alerts/:id", requireOwnsResource("low_balance_alerts", "id"), alerts.update);

// --- Admin ---
router.get("/admin/parameters", requireAdmin, admin.getParameters);
router.put("/admin/parameters", requireAdmin, admin.updateParameter);
router.post("/admin/reset", requireAdmin, admin.resetAll);
router.get("/admin/admins", requireAdmin, auth.listAdmins);
router.post("/admin/admins", requireAdmin, auth.createAdmin);
router.delete("/admin/admins/:id", requireAdmin, auth.deleteAdmin);

// --- Credit card ---
/**
 * GET /accounts/:accountId — renvoie un compte par son identifiant (404 sinon).
 * Le compte doit appartenir à l'appelant (l'admin passe).
 */
router.get("/accounts/:accountId", requireOwnsAccount("accountId"), async (req, res) => {
  const { getDb } = await import("../database/database");
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  stmt.bind([String(req.params.accountId)]);
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
 *
 * Autorisation : la carte (`:accountId`) et le compte source (`fromAccountId`)
 * doivent appartenir à l'appelant.
 */
router.post(
  "/accounts/:accountId/pay-credit",
  requireClient,
  requireOwnsAccount("accountId", fromBody("fromAccountId")),
  async (req, res) => {
  const { getDb, saveDb } = await import("../database/database");
  const { v4: uuid } = await import("uuid");
  const db = await getDb();
  const { fromAccountId, amount } = req.body;

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    res.status(400).json({ error: "Montant invalide" });
    return;
  }

  const accountId = String(req.params.accountId);
  const creditStmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  creditStmt.bind([accountId]);
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
    [uuid(), accountId, now, "Paiement reçu", actualPayment, "credit", "emprunt", "complete"]
  );
  db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [actualPayment, fromAccountId]);
  db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [actualPayment, accountId]);

  saveDb();
  res.json({ success: true });
});

export default router;
