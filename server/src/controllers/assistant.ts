/**
 * Contrôleur de l'assistant de l'espace client.
 *
 * Deux modes, choisis automatiquement :
 *  - Si `ANTHROPIC_API_KEY` est configurée : assistant IA (Claude d'Anthropic).
 *  - Sinon : assistant de repli basé sur des règles, qui répond aux questions
 *    courantes (soldes, comment faire un virement/Interac/payer une facture...)
 *    à partir des comptes du client, sans clé ni coût.
 *
 * Dans les deux cas, l'assistant est purement informatif : il n'effectue aucune
 * opération et oriente vers la bonne section de l'application.
 */
import { Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "../database/database";

/** Modèle Claude utilisé quand une clé API est disponible (le moins cher). */
const MODEL = "claude-haiku-4-5";

/** Formate un montant en dollars canadiens. */
function cad(n: number): string {
  return n.toLocaleString("fr-CA", { style: "currency", currency: "CAD" });
}

/**
 * Met une chaîne en minuscules et retire les accents, pour comparer les
 * mots-clés sans se soucier des accents (« épargne » -> « epargne »).
 * Méthode robuste : décomposition Unicode (NFD) puis suppression des marques
 * combinantes (plage U+0300–U+036F) par code de caractère.
 */
function normalize(s: string): string {
  const decomposed = s.toLowerCase().normalize("NFD");
  let out = "";
  for (const ch of decomposed) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x0300 && code <= 0x036f) continue; // marque d'accent -> ignorée
    out += ch;
  }
  return out;
}

/**
 * Construit le prompt système pour Claude : identité de l'assistant + contexte
 * financier du client (nom, comptes et soldes).
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

/** Retrouve un compte du client à partir de mots-clés présents dans la question. */
function matchAccount(msg: string, accounts: any[]): any | null {
  const has = (...kw: string[]) => kw.some((k) => msg.includes(k));
  if (has("cheque", "courant")) return accounts.find((a) => a.type === "cheque");
  if (has("epargne", "economie")) return accounts.find((a) => a.type === "epargne");
  if (has("credit", "carte")) return accounts.find((a) => a.type === "credit");
  if (has("pret", "emprunt")) return accounts.find((a) => a.type === "pret");
  if (has("celi", "investissement", "placement"))
    return accounts.find((a) => a.type === "investissement");
  return null;
}

/**
 * Assistant de repli sans IA : déduit l'intention de la question et répond à
 * partir des données du client. Retourne toujours une réponse en français.
 */
function ruleBasedReply(question: string, client: any, accounts: any[]): string {
  const m = normalize(question);
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const asksAmount = /solde|combien|montant|argent|dispo/.test(m);

  // Salutation seule (message court commençant par une formule de politesse).
  if (/^(bonjour|salut|allo|coucou|hello|bonsoir|hey)\b/.test(m) && m.length < 25) {
    return `Bonjour ${client.firstName} ! Je peux vous renseigner sur vos soldes et vous expliquer comment faire un virement, un paiement de facture, un dépôt, etc. Que souhaitez-vous savoir ?`;
  }

  // Aide / capacités.
  if (/\b(aide|help|que peux|que peut|quoi faire|fonctionnalit|comment ca marche)\b/.test(m)) {
    return `Je peux notamment :
• vous donner votre solde total ou le solde d'un compte précis ;
• lister vos comptes ;
• vous expliquer comment faire un virement interne ou Interac, payer une facture, faire un dépôt/retrait ou créer un objectif d'épargne.
Posez-moi votre question 🙂`;
  }

  // Solde d'un compte précis.
  const acc = matchAccount(m, accounts);
  if (acc && asksAmount) {
    return `Le solde de votre compte « ${acc.name} » est de ${cad(acc.balance)}.`;
  }

  // Solde total.
  if (asksAmount && /total|tout|ensemble|globa/.test(m)) {
    return `Votre solde total, tous comptes confondus, est de ${cad(total)}.`;
  }

  // Liste des comptes.
  if (/\b(mes comptes|liste.*compte|quels comptes|tous mes comptes|voir mes comptes)\b/.test(m)) {
    const lignes = accounts.map((a) => `• ${a.name} : ${cad(a.balance)}`).join("\n");
    return `Voici vos comptes :\n${lignes}\n\nSolde total : ${cad(total)}.`;
  }

  // Demande de solde sans précision -> total.
  if (asksAmount) {
    return `Votre solde total est de ${cad(total)}. Vous pouvez aussi me demander le solde d'un compte précis (Chèques, Épargne, Carte de crédit...).`;
  }

  // Interac (à vérifier avant le virement générique).
  if (/interac/.test(m)) {
    return `Pour un virement Interac : ouvrez la section « Virement », choisissez l'onglet « Interac », sélectionnez le compte source et un bénéficiaire (vous pouvez en ajouter un), saisissez le montant, puis confirmez. Si le bénéficiaire est un client Libéo, l'argent est déposé sur son compte Chèques.`;
  }

  // Virement interne.
  if (/\b(virement|virer|transfer|transferer|transfert)\b/.test(m)) {
    return `Pour un virement entre vos comptes : allez dans « Virement », onglet « Interne », choisissez le compte source et le compte destination (Chèques, Épargne ou Carte de crédit), entrez le montant et confirmez.`;
  }

  // Paiement de facture.
  if (/\b(facture|fournisseur|hydro|bell|payer une facture|paiement)\b/.test(m)) {
    return `Pour payer une facture : ouvrez « Factures », choisissez le compte à débiter (Chèques ou Carte de crédit), sélectionnez le fournisseur (vous pouvez en ajouter un), indiquez le montant et confirmez.`;
  }

  // Dépôt / retrait / chèque.
  if (/\b(depot|deposer|retrait|retirer|deposer un cheque|encaisser)\b/.test(m)) {
    return `Pour déposer ou retirer de l'argent : rendez-vous dans « Dépôt / Retrait ». Vous pouvez aussi y déposer un chèque en joignant sa photo.`;
  }

  // Objectifs d'épargne.
  if (/\b(objectif|epargner|economiser|but d.?epargne|goal)\b/.test(m)) {
    return `Pour créer ou suivre un objectif d'épargne, ouvrez la section « Objectifs » : vous pouvez définir un montant cible et suivre votre progression.`;
  }

  // Remerciement.
  if (/\bmerci\b/.test(m)) {
    return `Avec plaisir ! N'hésitez pas si vous avez d'autres questions. 🙂`;
  }

  // Repli général.
  return `Je ne suis pas sûr d'avoir bien compris. Je peux vous donner votre solde total ou par compte, lister vos comptes, ou vous expliquer comment faire un virement, un Interac, payer une facture ou faire un dépôt. Reformulez votre question et j'essaierai de vous aider 🙂`;
}

/**
 * Point d'entrée de l'assistant : reçoit l'historique de conversation et renvoie
 * une réponse (IA si clé API présente, sinon règles locales).
 * @param req Corps : `{ clientId, messages: [{ role: "user"|"assistant", content }] }`.
 * @param res `{ reply, mode }` ; 400 (entrée invalide) ; 500 (erreur API).
 */
export async function chat(req: Request, res: Response) {
  const { clientId, messages } = req.body ?? {};

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

  // On ne garde que les champs attendus et on borne l'historique.
  const history = messages
    .filter((mm: any) => mm && (mm.role === "user" || mm.role === "assistant") && mm.content)
    .slice(-20)
    .map((mm: any) => ({ role: mm.role, content: String(mm.content) }));

  // --- Mode repli (sans clé API) : règles locales. ---
  if (!process.env.ANTHROPIC_API_KEY) {
    const lastUser = [...history].reverse().find((h) => h.role === "user");
    const reply = ruleBasedReply(lastUser?.content || "", client, accounts);
    res.json({ reply, mode: "rules" });
    return;
  }

  // --- Mode IA (clé API présente) : Claude. ---
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

    res.json({
      reply: reply || "Désolé, je n'ai pas de réponse pour le moment.",
      mode: "ai",
    });
  } catch (e: any) {
    console.error("Erreur assistant (IA), repli sur les règles:", e?.message || e);
    // Repli gracieux : si l'appel IA échoue, on répond quand même via les règles.
    const lastUser = [...history].reverse().find((h) => h.role === "user");
    const reply = ruleBasedReply(lastUser?.content || "", client, accounts);
    res.json({ reply, mode: "rules-fallback" });
  }
}
