/**
 * Tests automatisés de l'API (Vitest + Supertest).
 *
 * Ils exercent la vraie application Express sur une base de test isolée,
 * remplie avec les données de démonstration. Couverture : authentification,
 * autorisation (sécurité), virements, vérification du courriel et suppression
 * de client protégée par mot de passe.
 */
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, initDatabase } from "../app";
import { getDb } from "../database/database";

// Identités et comptes réutilisés par les tests (renseignés dans beforeAll).
let adminToken = "";
let aliceToken = "";
let aliceId = "";
let aliceCheque = "";
let aliceEpargne = "";
let bobEpargne = "";

/** Récupère les comptes d'un client (via un jeton autorisé). */
async function comptesDe(clientId: string, token: string) {
  const res = await request(app)
    .get(`/api/clients/${clientId}/accounts`)
    .set("Authorization", `Bearer ${token}`);
  return res.body as any[];
}

beforeAll(async () => {
  // Prépare la base de test : schéma + 5 clients de démonstration + admin.
  await initDatabase();

  // Connexion administrateur.
  const admin = await request(app)
    .post("/api/auth/admin/login")
    .send({ email: "admin@banque.ca", password: "Admin1234!" });
  adminToken = admin.body.token;

  // Connexion cliente (Alice).
  const alice = await request(app)
    .post("/api/auth/login")
    .send({ email: "alice.tremblay@email.ca", password: "Test1234!" });
  aliceToken = alice.body.token;
  aliceId = alice.body.client.id;

  // Comptes d'Alice.
  const aliceAccs = await comptesDe(aliceId, aliceToken);
  aliceCheque = aliceAccs.find((a) => a.type === "cheque").id;
  aliceEpargne = aliceAccs.find((a) => a.type === "epargne").id;

  // Un compte d'un AUTRE client (Bob), pour les tests d'accès croisé.
  const clients = (
    await request(app).get("/api/clients").set("Authorization", `Bearer ${adminToken}`)
  ).body as any[];
  const bob = clients.find((c) => c.email === "bob.gagnon@email.ca");
  const bobAccs = await comptesDe(bob.id, adminToken);
  bobEpargne = bobAccs.find((a) => a.type === "epargne").id;
});

describe("Authentification", () => {
  it("refuse un mot de passe incorrect", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice.tremblay@email.ca", password: "MAUVAIS" });
    expect(res.status).toBe(401);
  });

  it("connecte un client valide et renvoie un jeton", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice.tremblay@email.ca", password: "Test1234!" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.client.email).toBe("alice.tremblay@email.ca");
  });

  it("connecte l'administrateur", async () => {
    const res = await request(app)
      .post("/api/auth/admin/login")
      .send({ email: "admin@banque.ca", password: "Admin1234!" });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("admin");
  });
});

describe("Autorisation (sécurité)", () => {
  it("refuse la liste des clients sans jeton (401)", async () => {
    const res = await request(app).get("/api/clients");
    expect(res.status).toBe(401);
  });

  it("interdit à un client de lister tous les clients (403)", async () => {
    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${aliceToken}`);
    expect(res.status).toBe(403);
  });

  it("autorise l'admin à lister les clients (200)", async () => {
    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(5);
  });

  it("refuse un virement sans jeton (401)", async () => {
    const res = await request(app)
      .post("/api/transactions/transfer")
      .send({ fromAccountId: aliceEpargne, toAccountId: aliceCheque, amount: 10 });
    expect(res.status).toBe(401);
  });

  it("empêche un client de virer depuis le compte d'un autre (403)", async () => {
    const res = await request(app)
      .post("/api/transactions/transfer")
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ fromAccountId: bobEpargne, toAccountId: aliceCheque, amount: 100 });
    expect(res.status).toBe(403);
  });
});

describe("Virement interne", () => {
  it("débite la source et crédite la destination", async () => {
    const avant = await comptesDe(aliceId, aliceToken);
    const epAvant = avant.find((a) => a.id === aliceEpargne).balance;

    const res = await request(app)
      .post("/api/transactions/transfer")
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ fromAccountId: aliceEpargne, toAccountId: aliceCheque, amount: 50 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const apres = await comptesDe(aliceId, aliceToken);
    const epApres = apres.find((a) => a.id === aliceEpargne).balance;
    expect(Math.round((epAvant - epApres) * 100) / 100).toBe(50);
  });
});

describe("Vérification du courriel", () => {
  const email = "nouveau.client@example.test";
  let clientId = "";

  it("bloque la connexion d'un compte non vérifié (403)", async () => {
    const inscription = await request(app).post("/api/clients").send({
      firstName: "Nouveau",
      lastName: "Client",
      email,
      password: "Test1234!",
      phone: "514-555-7777",
      address: "1 rue Test",
      city: "Montréal",
      province: "QC",
      postalCode: "H1H 1H1",
      dateNaissance: "1995-05-05",
    });
    expect(inscription.status).toBe(201);
    clientId = inscription.body.id;

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "Test1234!" });
    expect(login.status).toBe(403);
    expect(login.body.needsVerification).toBe(true);
  });

  it("autorise la connexion après saisie du bon code", async () => {
    // Le code a été « envoyé » (console en test) ; on le lit dans la base.
    const db = await getDb();
    const stmt = db.prepare("SELECT verificationCode FROM clients WHERE email = ?");
    stmt.bind([email]);
    const code = stmt.step() ? (stmt.getAsObject() as any).verificationCode : null;
    stmt.free();
    expect(code).toBeTruthy();

    const verif = await request(app)
      .post("/api/auth/verify-email")
      .send({ email, code });
    expect(verif.status).toBe(200);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "Test1234!" });
    expect(login.status).toBe(200);
  });

  it("refuse la suppression d'un client sans le mot de passe admin (401)", async () => {
    const res = await request(app)
      .delete(`/api/clients/${clientId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(401);
  });

  it("supprime le client avec le bon mot de passe admin (200)", async () => {
    const res = await request(app)
      .delete(`/api/clients/${clientId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ currentEmail: "admin@banque.ca", currentPassword: "Admin1234!" });
    expect(res.status).toBe(200);
  });
});
