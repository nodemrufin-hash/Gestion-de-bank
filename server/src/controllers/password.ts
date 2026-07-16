/**
 * Contrôleur de réinitialisation du mot de passe (« mot de passe oublié »).
 *
 * Le client demande un code depuis la page de connexion ; un code à 6 chiffres
 * lui est envoyé par courriel, puis il le saisit avec son nouveau mot de passe.
 * Recevoir le code prouve qu'il possède l'adresse : une réinitialisation
 * réussie marque donc aussi le courriel comme vérifié.
 *
 * Ces routes sont publiques (le client n'est pas connecté), d'où deux
 * précautions : on ne révèle jamais si une adresse existe (pas d'énumération de
 * comptes) et le code expire au bout de 15 minutes.
 */
import { Request, Response } from "express";
import { getDb, saveDb } from "../database/database";
import { sendPasswordResetEmail } from "../mailer";
import { generateCode } from "./verification";
import { hashPassword } from "./auth";

/** Durée de validité d'un code de réinitialisation (15 minutes). */
const CODE_TTL_MS = 15 * 60 * 1000;

/** Longueur minimale d'un mot de passe (identique à l'inscription). */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Demande de réinitialisation : envoie un code au courriel indiqué.
 * Répond toujours `{ success: true }`, même si l'adresse est inconnue, afin de
 * ne pas permettre de deviner quels comptes existent.
 * @param req Corps : `{ email }`.
 * @param res `{ success: true }` ; 400 si le courriel est absent.
 */
export async function forgotPassword(req: Request, res: Response) {
  const db = await getDb();
  const { email } = req.body ?? {};

  if (!email) {
    res.status(400).json({ error: "Courriel requis." });
    return;
  }

  const stmt = db.prepare("SELECT * FROM clients WHERE email = ?");
  stmt.bind([String(email).trim().toLowerCase()]);
  const client = stmt.step() ? (stmt.getAsObject() as any) : null;
  stmt.free();

  // Adresse inconnue : on répond comme si tout allait bien (anti-énumération).
  if (client) {
    const code = generateCode();
    const expires = new Date(Date.now() + CODE_TTL_MS).toISOString();
    db.run("UPDATE clients SET resetCode = ?, resetExpires = ? WHERE id = ?", [
      code,
      expires,
      client.id,
    ]);
    saveDb();
    await sendPasswordResetEmail(client.email, client.firstName, code);
  }

  res.json({ success: true });
}

/**
 * Réinitialise le mot de passe après vérification du code reçu par courriel.
 * Le code est à usage unique et le courriel est marqué comme vérifié (la
 * réception du code prouve que le client possède l'adresse).
 * @param req Corps : `{ email, code, newPassword }`.
 * @param res `{ success: true }` ; 400 (code invalide/expiré, mot de passe trop court).
 */
export async function resetPassword(req: Request, res: Response) {
  const db = await getDb();
  const { email, code, newPassword } = req.body ?? {};

  if (!email || !code || !newPassword) {
    res.status(400).json({ error: "Courriel, code et nouveau mot de passe requis." });
    return;
  }
  if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({
      error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
    });
    return;
  }

  const stmt = db.prepare("SELECT * FROM clients WHERE email = ?");
  stmt.bind([String(email).trim().toLowerCase()]);
  const client = stmt.step() ? (stmt.getAsObject() as any) : null;
  stmt.free();

  // Message identique dans tous les cas d'échec : ne révèle ni l'existence du
  // compte, ni si c'est le code ou l'adresse qui est en cause.
  const invalid = () =>
    res.status(400).json({ error: "Code invalide ou expiré. Demandez-en un nouveau." });

  if (!client || !client.resetCode) {
    invalid();
    return;
  }
  if (String(client.resetCode) !== String(code).trim()) {
    invalid();
    return;
  }
  if (!client.resetExpires || new Date(client.resetExpires) < new Date()) {
    invalid();
    return;
  }

  // Nouveau mot de passe + code consommé. Le courriel est aussi validé, car le
  // client vient de prouver qu'il y a accès.
  db.run(
    `UPDATE clients
     SET password = ?, resetCode = NULL, resetExpires = NULL, emailVerified = 1
     WHERE id = ?`,
    [hashPassword(String(newPassword)), client.id]
  );
  saveDb();

  res.json({ success: true });
}
