import { v4 as uuid } from "uuid";
import type { Database } from "sql.js";
import { getDb, saveDb } from "./database";

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDate(startMonthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - Math.floor(Math.random() * startMonthsAgo));
  d.setDate(Math.floor(Math.random() * 28) + 1);
  return d.toISOString().split("T")[0];
}

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
}

const PROVIDERS = [
  "Hydro-Québec",
  "Bell Canada",
  "Vidéotron",
  "Telus",
  "Rogers",
  "Desjardins Assurances",
  "Intact Assurances",
  "Sun Life",
  "Ville de Montréal",
  "Revenu Québec",
  "Agence Revenu Canada",
  "Spotify",
  "Netflix",
  "Apple iCloud",
];

/**
 * Génère les comptes, transactions, bénéficiaires, objectifs et l'alerte de
 * solde faible pour un client existant. Utilisé à la fois par le seed initial
 * et lors de la création d'un nouveau profil client (F-01 / F-19).
 */
export function generateClientFinancials(db: Database, clientId: string): void {
  // --- ACCOUNTS ---
  const accountDefs = [
    { type: "cheque", category: "depenses", name: "Chèques", balance: randomAmount(500, 3000), creditLimit: 0 },
    { type: "epargne", category: "epargne", name: "Épargne", balance: randomAmount(1000, 15000), creditLimit: 0 },
    { type: "credit", category: "emprunt", name: "Carte de crédit", balance: -randomAmount(200, 4000), creditLimit: 5000 },
    { type: "pret", category: "emprunt", name: "Prêt personnel", balance: -randomAmount(5000, 30000), creditLimit: 0, interestRate: 6.5 },
    { type: "investissement", category: "investissement", name: "CELI", balance: randomAmount(2000, 50000), creditLimit: 0 },
  ];

  const accountIds: string[] = [];
  for (const acc of accountDefs) {
    const accId = uuid();
    const accNum = `ZEPH-${String(Math.floor(10000 + Math.random() * 90000))}-${String(Math.floor(100 + Math.random() * 900))}`;
    db.run(
      `INSERT INTO accounts (id, clientId, type, category, name, balance, accountNumber, creditLimit, interestRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [accId, clientId, acc.type, acc.category, acc.name, acc.balance, accNum, acc.creditLimit, acc.interestRate || 0]
    );
    accountIds.push(accId);

    // --- TRANSACTIONS (last 90 days, ~15-25 per account) ---
    const txCount = 15 + Math.floor(Math.random() * 10);
    for (let i = 0; i < txCount; i++) {
      const txId = uuid();
      const date = randomDate(3);
      const isDebit = Math.random() > 0.45;
      const isLarge = Math.random() > 0.85;
      const descriptions = isDebit
        ? ["Épicerie", "Restaurant", "Stationnement", "Pharmacie", "Amazon.ca", "Tim Hortons", "SAQ", "Métro", "Essence", "Uber"]
        : ["Dépôt direct", "Virement reçu", "Remboursement", "Intérêt", "Transfert"];
      const desc = descriptions.sort(() => Math.random() - 0.5)[0];
      const amount = isLarge ? randomAmount(200, 1500) : randomAmount(5, 200);

      db.run(
        `INSERT INTO transactions (id, accountId, date, description, amount, type, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [txId, accId, date, desc, Math.round(amount * 100) / 100, isDebit ? "debit" : "credit", acc.category, "complete"]
      );
    }
  }

  // --- FUTURE TRANSACTIONS (scheduled payments) ---
  for (let i = 0; i < 3; i++) {
    const txId = uuid();
    const accSrc = accountIds[0]; // cheque
    const provider = PROVIDERS.sort(() => Math.random() - 0.5)[0];
    const date = futureDate(5 + i * 10);
    db.run(
      `INSERT INTO transactions (id, accountId, date, description, amount, type, category, isRecurring, frequency, isFuture, scheduledDate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [txId, accSrc, date, provider, randomAmount(50, 300), "debit", "depenses", 1, "mensuel", 1, date, "pending"]
    );
  }

  // --- BENEFICIARIES ---
  const beneficiaries = [
    { name: "Marc Lefebvre", email: "marc.lefebvre@email.ca", phone: "438-555-1001", isFournisseur: 0 },
    { name: "Sophie Bouchard", email: "sophie.bouchard@email.ca", phone: "514-555-1002", isFournisseur: 0 },
    { name: "Hydro-Québec", email: "factures@hydroquebec.ca", phone: null, isFournisseur: 1 },
    { name: "Vidéotron", email: "factures@videotron.ca", phone: null, isFournisseur: 1 },
    { name: "Bell", email: "factures@bell.ca", phone: null, isFournisseur: 1 },
  ];
  for (const b of beneficiaries) {
    db.run(
      `INSERT INTO beneficiaries (id, clientId, name, email, phone, isFournisseur) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid(), clientId, b.name, b.email, b.phone, b.isFournisseur ? 1 : 0]
    );
  }

  // --- SAVING GOALS ---
  const goals = [
    { name: "Voyage au Japon", target: 5000, current: 1250 },
    { name: "Fonds d'urgence", target: 10000, current: 3400 },
    { name: "Nouvel ordinateur", target: 2500, current: 1800 },
  ];
  for (const g of goals) {
    db.run(
      `INSERT INTO saving_goals (id, clientId, accountId, name, targetAmount, currentAmount) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid(), clientId, accountIds[1], g.name, g.target, g.current]
    );
  }

  // --- LOW BALANCE ALERT ---
  db.run(
    `INSERT INTO low_balance_alerts (id, clientId, accountId, threshold, enabled) VALUES (?, ?, ?, ?, ?)`,
    [uuid(), clientId, accountIds[0], 100, 1]
  );
}

export async function seed(): Promise<void> {
  const db = await getDb();

  // Check if already seeded
  const existing = db.exec("SELECT COUNT(*) as cnt FROM clients");
  if (existing.length > 0 && Number(existing[0].values[0][0]) > 0) {
    console.log("Base de données déjà initialisée.");
    return;
  }

  // --- CLIENTS ---
  const clients = [
    { firstName: "Alice", lastName: "Tremblay", email: "alice.tremblay@email.ca", phone: "514-555-0101", address: "123 Rue Saint-Jacques", city: "Montréal", province: "QC", postalCode: "H2Y 1L9", dateNaissance: "1990-04-15" },
    { firstName: "Bob", lastName: "Gagnon", email: "bob.gagnon@email.ca", phone: "418-555-0202", address: "456 Avenue des Laurentides", city: "Québec", province: "QC", postalCode: "G1R 2P4", dateNaissance: "1985-08-22" },
    { firstName: "Clara", lastName: "Lavoie", email: "clara.lavoie@email.ca", phone: "450-555-0303", address: "789 Boulevard Des Sources", city: "Laval", province: "QC", postalCode: "H7N 2A8", dateNaissance: "1995-11-03" },
    { firstName: "David", lastName: "Côté", email: "david.cote@email.ca", phone: "819-555-0404", address: "321 Rue Principale", city: "Sherbrooke", province: "QC", postalCode: "J1H 1M5", dateNaissance: "1978-02-10" },
    { firstName: "Émilie", lastName: "Roy", email: "emilie.roy@email.ca", phone: "514-555-0505", address: "654 Chemin de la Côte-des-Neiges", city: "Montréal", province: "QC", postalCode: "H3S 2A5", dateNaissance: "2000-07-28" },
  ];

  for (const c of clients) {
    const id = uuid();
    db.run(
      `INSERT INTO clients (id, firstName, lastName, email, phone, address, city, province, postalCode, dateNaissance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, c.firstName, c.lastName, c.email, c.phone, c.address, c.city, c.province, c.postalCode, c.dateNaissance]
    );
    generateClientFinancials(db, id);
  }

  // --- PARAMETERS ---
  const params: Record<string, string> = {
    "default_low_balance_threshold": "100",
    "max_transfer_amount": "10000",
    "daily_transfer_limit": "3000",
    "interest_rate_cheque": "0.01",
    "interest_rate_epargne": "2.5",
    "interest_rate_credit": "19.99",
    "currency": "CAD",
    "locale": "fr_CA",
  };
  for (const [key, value] of Object.entries(params)) {
    db.run(`INSERT INTO parameters (key, value) VALUES (?, ?)`, [key, value]);
  }

  saveDb();
  console.log(`${clients.length} clients créés avec leurs comptes et transactions.`);
}

seed().catch(console.error);
