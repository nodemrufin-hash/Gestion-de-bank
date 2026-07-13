/**
 * Store de sessions en mémoire.
 *
 * À la connexion, on émet un jeton opaque (uuid) associé à l'identité de
 * l'appelant (rôle + identifiant). Le jeton est renvoyé au frontend, qui le
 * présente ensuite dans l'en-tête `Authorization: Bearer <token>` à chaque
 * appel. Le middleware d'authentification résout le jeton via `getSession`.
 *
 * Note (simulation) : les sessions vivent uniquement en mémoire — elles sont
 * donc perdues au redémarrage du serveur (il faut alors se reconnecter). C'est
 * volontairement simple ; une table SQLite serait nécessaire pour la
 * persistance.
 */
import { v4 as uuid } from "uuid";

/** Identité associée à un jeton de session. */
export type SessionInfo = {
  role: "client" | "admin";
  /** Présent uniquement pour un client. */
  clientId?: string;
  email: string;
};

/** Table jeton → identité, en mémoire pour la durée de vie du processus. */
const sessions = new Map<string, SessionInfo>();

/** Crée une session et renvoie son jeton opaque. */
export function createSession(info: SessionInfo): string {
  const token = uuid();
  sessions.set(token, info);
  return token;
}

/** Résout un jeton en identité, ou `null` s'il est inconnu/expiré. */
export function getSession(token: string): SessionInfo | null {
  return sessions.get(token) ?? null;
}

/** Détruit une session (déconnexion). Sans effet si le jeton est inconnu. */
export function destroySession(token: string): void {
  sessions.delete(token);
}
