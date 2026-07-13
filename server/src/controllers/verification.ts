/**
 * Contrôleur de vérification d'adresse courriel.
 *
 * À l'inscription, un code à 6 chiffres est généré, stocké (avec une date
 * d'expiration) sur le client et envoyé par email. Le client saisit ensuite ce
 * code pour confirmer qu'il possède bien l'adresse. Tant qu'il n'est pas
 * vérifié, la connexion est refusée (voir `clientLogin`).
 */
import { Request, Response } from "express";
import type { Database } from "sql.js";
import { getDb, saveDb } from "../database/database";
import { sendVerificationEmail, sendWelcomeEmail } from "../mailer";

/** Durée de validité d'un code de vérification (15 minutes, en millisecondes). */
const CODE_TTL_MS = 15 * 60 * 1000;

/** Génère un code numérique à 6 chiffres (sous forme de chaîne). */
function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Génère un nouveau code pour un client, l'enregistre avec sa date d'expiration
 * et l'envoie par email. Réutilisé à l'inscription et lors d'un renvoi.
 * @returns `{ sent }` — indique si un email a réellement été expédié.
 */
export async function issueVerificationCode(
  db: Database,
  clientId: string,
  email: string,
  firstName: string
): Promise<{ sent: boolean }> {
  const code = generateCode();
  const expires = new Date(Date.now() + CODE_TTL_MS).toISOString();
  db.run(
    "UPDATE clients SET verificationCode = ?, verificationExpires = ?, emailVerified = 0 WHERE id = ?",
    [code, expires, clientId]
  );
  saveDb();
  return sendVerificationEmail(email, firstName, code);
}

/** Retrouve un client par courriel (normalisé). */
function findClientByEmail(db: Database, email: unknown): any | null {
  const stmt = db.prepare("SELECT * FROM clients WHERE email = ?");
  stmt.bind([String(email).trim().toLowerCase()]);
  const client = stmt.step() ? (stmt.getAsObject() as any) : null;
  stmt.free();
  return client;
}

/**
 * Vérifie le code saisi par le client et, s'il est correct et non expiré, marque
 * l'adresse comme vérifiée.
 * @param req Corps : `{ email, code }`.
 * @param res `{ success: true }` ; 400 (code invalide/expiré) ; 404 (client).
 */
export async function verifyEmail(req: Request, res: Response) {
  const db = await getDb();
  const { email, code } = req.body ?? {};

  if (!email || !code) {
    res.status(400).json({ error: "Courriel et code requis." });
    return;
  }

  const client = findClientByEmail(db, email);
  if (!client) {
    res.status(404).json({ error: "Aucun compte pour ce courriel." });
    return;
  }
  if (Number(client.emailVerified) === 1) {
    res.json({ success: true, alreadyVerified: true });
    return;
  }
  if (!client.verificationCode || String(client.verificationCode) !== String(code).trim()) {
    res.status(400).json({ error: "Code incorrect." });
    return;
  }
  if (!client.verificationExpires || new Date(client.verificationExpires) < new Date()) {
    res.status(400).json({ error: "Code expiré. Demandez-en un nouveau." });
    return;
  }

  db.run(
    "UPDATE clients SET emailVerified = 1, verificationCode = NULL, verificationExpires = NULL WHERE id = ?",
    [client.id]
  );
  saveDb();

  // Email de bienvenue (n'empêche pas la réponse en cas d'échec d'envoi).
  await sendWelcomeEmail(client.email, client.firstName);

  res.json({ success: true });
}

/**
 * Renvoie un nouveau code de vérification au client.
 * @param req Corps : `{ email }`.
 * @param res `{ success: true, sent }` ; 404 (client) ; `{ alreadyVerified }`.
 */
export async function resendVerification(req: Request, res: Response) {
  const db = await getDb();
  const { email } = req.body ?? {};

  const client = findClientByEmail(db, email);
  if (!client) {
    res.status(404).json({ error: "Aucun compte pour ce courriel." });
    return;
  }
  if (Number(client.emailVerified) === 1) {
    res.json({ success: true, alreadyVerified: true });
    return;
  }

  const { sent } = await issueVerificationCode(db, client.id, client.email, client.firstName);
  res.json({ success: true, sent });
}
