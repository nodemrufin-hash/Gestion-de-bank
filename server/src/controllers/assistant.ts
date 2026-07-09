/**
 * Contrôleur de l'assistant IA (Claude d'Anthropic).
 *
 * Répond aux questions du client sur ses comptes (soldes, virements, factures,
 * etc.). L'assistant reçoit en contexte les comptes du client et un rappel des
 * sections de l'application ; il est purement informatif (il n'effectue aucune
 * opération). Nécessite la variable d'environnement `ANTHROPIC_API_KEY`.
 */
import { Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "../database/database";

/**
 * Modèle Claude utilisé par l'assistant. Haiku 4.5 est le plus économique
 * (idéal pour ce projet). Remplaçable par "claude-opus-4-8" pour de meilleures
 * réponses au prix d'un coût plus élevé.
 */
const MODEL = "claude-haiku-4-5";

/** Formate un montant en dollars canadiens. */
function cad(n: number): string {
  return n.toLocaleString("fr-CA", { style: "currency", currency: "CAD" });
}

/**
 * Construit le prompt système : identité de l'assistant + contexte financier du
 * client (nom, comptes et soldes). Ce contexte permet des réponses concrètes.
 */
function buildSystemPrompt(client: any, accounts: any[]): string {
  const comptes = accounts
    .map((a) => `- ${a.name} (${a.type}) : ${cad(a.balance)}`)
    .join("\n");
  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return `Tu es l'assistant virtuel de la banque numérique « Libéo ». Tu aides le client connecté à comprendre et gérer ses finances.

Client : ${client.firstName} ${client.lastName}
Comptes du client :
${comptes || "(aucun compte)"}
Solde total : ${cad(total)}

Consignes :
- Réponds toujours en français, de façon claire, courtoise et concise.
- Appuie-toi sur les données ci-dessus pour répondre (soldes, comptes...).
- Tu es purement informatif : tu n'effectues aucune opération. Pour agir, oriente le client vers la bonne section : « Virement » (interne ou Interac), « Factures », « Dépôt / Retrait », « Objectifs », « Mes comptes », « Produits » ou « Mon profil ».
- Ne divulgue jamais d'informations d'un autre client. Ne parle que des données fournies.
- Si une question sort du cadre bancaire de ce client, invite poliment à reformuler.`;
}

/**
 * Point d'entrée de l'assistant : reçoit l'historique de conversation et renvoie
 * la réponse de Claude.
 * @param req Corps : `{ clientId, messages: [{ role: "user"|"assistant", content }] }`.
 * @param res `{ reply }` ; 400 (entrée invalide) ; 500 (clé API manquante ou erreur API).
 */
export async function chat(req: Request, res: Response) {
  const { clientId, messages } = req.body ?? {};

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({
      error:
        "Assistant indisponible : la clé ANTHROPIC_API_KEY n'est pas configurée sur le serveur.",
    });
    return;
  }
  if (!clientId || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Requête invalide." });
    return;
  }

  // Contexte : le client et ses comptes.
  const db = await getDb();
  const cliStmt = db.prepare("SELECT * FROM clients WHERE id = ?");
  cliStmt.bind([String(clientId)]);
  const client = cliStmt.step() ? (cliStmt.getAsObject() as any) : null;
  cliStmt.free();
  if (!client) {
    res.status(400).json({ error: "Client introuvable." });
    return;
  }

  const accStmt = db.prepare(
    "SELECT name, type, balance FROM accounts WHERE clientId = ?"
  );
  accStmt.bind([String(clientId)]);
  const accounts: any[] = [];
  while (accStmt.step()) accounts.push(accStmt.getAsObject());
  accStmt.free();

  // On ne garde que les champs attendus par l'API et on borne l'historique.
  const history = messages
    .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && m.content)
    .slice(-20)
    .map((m: any) => ({ role: m.role, content: String(m.content) }));

  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(client, accounts),
      messages: history,
    });

    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();

    res.json({ reply: reply || "Désolé, je n'ai pas de réponse pour le moment." });
  } catch (e: any) {
    console.error("Erreur assistant:", e?.message || e);
    res.status(500).json({ error: "L'assistant est momentanément indisponible." });
  }
}
