/**
 * Gestion de la session d'authentification côté navigateur.
 *
 * La session (rôle + identité + jeton) est conservée dans `localStorage`. Le
 * `token` est émis par le backend à la connexion et renvoyé dans l'en-tête
 * `Authorization: Bearer …` à chaque appel API (voir `src/lib/api.ts`), ce qui
 * permet au serveur d'autoriser l'appelant. La protection visuelle des routes
 * reste faite côté client à partir de ces valeurs ; l'autorisation réelle est
 * appliquée côté serveur.
 */

const STORAGE_KEY = "banque_session";

/** Session d'un client connecté. */
export type ClientSession = {
  role: "client";
  clientId: string;
  name: string;
  email: string;
  token: string;
};

/** Session de l'administrateur connecté. */
export type AdminSession = {
  role: "admin";
  email: string;
  token: string;
};

export type Session = ClientSession | AdminSession;

/** Lit la session courante depuis le stockage local, ou `null` si absente/invalide. */
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/** Enregistre la session d'un client connecté (avec son jeton). */
export function setClientSession(
  client: { id: string; firstName: string; lastName: string; email: string },
  token: string
): void {
  const session: ClientSession = {
    role: "client",
    clientId: client.id,
    name: `${client.firstName} ${client.lastName}`,
    email: client.email,
    token,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/** Enregistre la session de l'administrateur connecté (avec son jeton). */
export function setAdminSession(email: string, token: string): void {
  const session: AdminSession = { role: "admin", email, token };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/** Renvoie le jeton de la session courante, ou `null` si non connecté. */
export function getToken(): string | null {
  return getSession()?.token ?? null;
}

/** Efface la session courante (déconnexion). */
export function logout(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
