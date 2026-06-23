/**
 * Gestion de la session d'authentification côté navigateur.
 *
 * La session (rôle + identité) est conservée dans `localStorage`. Il s'agit
 * d'une simulation : aucun jeton signé n'est utilisé, la protection des routes
 * est faite côté client à partir de ces valeurs. Les pages utilisent
 * `getSession` pour décider d'afficher ou de rediriger vers la connexion.
 */

const STORAGE_KEY = "banque_session";

/** Session d'un client connecté. */
export type ClientSession = {
  role: "client";
  clientId: string;
  name: string;
  email: string;
};

/** Session de l'administrateur connecté. */
export type AdminSession = {
  role: "admin";
  email: string;
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

/** Enregistre la session d'un client connecté. */
export function setClientSession(client: { id: string; firstName: string; lastName: string; email: string }): void {
  const session: ClientSession = {
    role: "client",
    clientId: client.id,
    name: `${client.firstName} ${client.lastName}`,
    email: client.email,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/** Enregistre la session de l'administrateur connecté. */
export function setAdminSession(email: string): void {
  const session: AdminSession = { role: "admin", email };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/** Efface la session courante (déconnexion). */
export function logout(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
