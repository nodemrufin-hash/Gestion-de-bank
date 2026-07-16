/**
 * Layout racine de `/dashboard`.
 *
 * Volontairement neutre : il n'impose aucun rôle, car ce sous-arbre héberge à la
 * fois la liste des clients réservée à l'admin (`/dashboard`, gardée dans sa
 * propre page) et l'espace d'un client (`/dashboard/client/[id]`, gardé par son
 * propre layout). Chaque page/segment applique donc sa garde adaptée.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
