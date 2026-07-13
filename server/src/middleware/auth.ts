/**
 * Middlewares d'autorisation de l'API.
 *
 * `authenticate` s'exécute globalement : il lit le jeton `Bearer`, le résout en
 * identité et l'attache à `req.auth` (sans bloquer). Les autres middlewares
 * sont des gardes à poser route par route :
 *  - `requireAuth`   : exige une session (401 sinon) ;
 *  - `requireAdmin`  : exige le rôle admin (403 sinon) ;
 *  - `requireClient` : exige le rôle client (403 sinon) ;
 *  - `requireSelfOrAdmin` : un client ne peut agir que sur son propre id ;
 *  - `requireOwnsAccount` : les comptes visés doivent lui appartenir ;
 *  - `requireOwnsResource` : une ressource (bénéficiaire, objectif, alerte)
 *    doit lui appartenir.
 *
 * Un **admin contourne** les vérifications de propriété (il gère tous les
 * clients).
 */
import { Request, Response, NextFunction } from "express";
import { getSession, SessionInfo } from "../auth/sessions";
import { getDb } from "../database/database";

// Rend `req.auth` disponible et typé sur les requêtes Express.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: SessionInfo;
    }
  }
}

/** Extrait la valeur d'un champ depuis la requête (params puis body). */
type Selector = string | ((req: Request) => string | undefined);
function resolve(req: Request, selector: Selector): string | undefined {
  if (typeof selector === "function") return selector(req);
  return (req.params[selector] ?? req.body?.[selector]) as string | undefined;
}

/**
 * Attache l'identité à `req.auth` si un jeton `Bearer` valide est présent.
 * Ne bloque jamais : les gardes qui suivent décident de l'accès.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const session = token ? getSession(token) : null;
  if (session) req.auth = session;
  next();
}

/** Exige une session authentifiée. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    res.status(401).json({ error: "Authentification requise." });
    return;
  }
  next();
}

/** Exige le rôle administrateur. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    res.status(401).json({ error: "Authentification requise." });
    return;
  }
  if (req.auth.role !== "admin") {
    res.status(403).json({ error: "Accès réservé à l'administrateur." });
    return;
  }
  next();
}

/** Exige le rôle client. */
export function requireClient(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    res.status(401).json({ error: "Authentification requise." });
    return;
  }
  if (req.auth.role !== "client") {
    res.status(403).json({ error: "Accès réservé aux clients." });
    return;
  }
  next();
}

/**
 * Autorise un client uniquement sur son propre identifiant (l'admin passe).
 * @param selector Nom du paramètre/champ contenant l'id client (défaut `id`).
 */
export function requireSelfOrAdmin(selector: Selector = "id") {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (!auth) {
      res.status(401).json({ error: "Authentification requise." });
      return;
    }
    if (auth.role === "admin") {
      next();
      return;
    }
    if (resolve(req, selector) === auth.clientId) {
      next();
      return;
    }
    res.status(403).json({ error: "Accès non autorisé à ce profil." });
  };
}

/** Retrouve le propriétaire (`clientId`) d'un compte, ou `null`. */
async function accountOwner(accountId: string): Promise<string | null> {
  const db = await getDb();
  const stmt = db.prepare("SELECT clientId FROM accounts WHERE id = ?");
  stmt.bind([accountId]);
  const owner = stmt.step() ? (stmt.getAsObject() as any).clientId : null;
  stmt.free();
  return owner ?? null;
}

/**
 * Exige que tous les comptes désignés appartiennent au client connecté (l'admin
 * passe). Les champs absents sont ignorés (ex. un `toAccountId` optionnel).
 * @param selectors Sélecteurs des identifiants de compte à vérifier.
 */
export function requireOwnsAccount(...selectors: Selector[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (!auth) {
      res.status(401).json({ error: "Authentification requise." });
      return;
    }
    if (auth.role === "admin") {
      next();
      return;
    }
    for (const selector of selectors) {
      const accountId = resolve(req, selector);
      if (!accountId) continue;
      const owner = await accountOwner(String(accountId));
      if (owner !== auth.clientId) {
        res.status(403).json({ error: "Ce compte ne vous appartient pas." });
        return;
      }
    }
    next();
  };
}

/**
 * Exige qu'une ressource liée à un client (bénéficiaire, objectif, alerte)
 * appartienne au client connecté (l'admin passe). La table et la colonne sont
 * fixées dans le code (jamais issues de l'entrée utilisateur).
 * @param table Table SQL (`beneficiaries`, `saving_goals`, `low_balance_alerts`).
 * @param selector Sélecteur de l'identifiant de la ressource (défaut `id`).
 */
export function requireOwnsResource(table: string, selector: Selector = "id") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (!auth) {
      res.status(401).json({ error: "Authentification requise." });
      return;
    }
    if (auth.role === "admin") {
      next();
      return;
    }
    const id = resolve(req, selector);
    if (!id) {
      res.status(400).json({ error: "Identifiant de ressource manquant." });
      return;
    }
    const db = await getDb();
    const stmt = db.prepare(`SELECT clientId FROM ${table} WHERE id = ?`);
    stmt.bind([String(id)]);
    const owner = stmt.step() ? (stmt.getAsObject() as any).clientId : null;
    stmt.free();
    if (owner === auth.clientId) {
      next();
      return;
    }
    res.status(403).json({ error: "Cette ressource ne vous appartient pas." });
  };
}
