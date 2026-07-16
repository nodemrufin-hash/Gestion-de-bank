"use client";

/**
 * Liste des clients — **réservée à l'administrateur**.
 *
 * Affiche tous les profils sous forme de cartes ; cliquer sur une carte ouvre
 * l'espace du client (l'admin peut consulter n'importe quel client). Un client
 * connecté est renvoyé vers son propre espace ; un visiteur non connecté vers la
 * connexion admin. La liste elle-même (`GET /clients`) est protégée côté serveur
 * (`requireAdmin`).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/common/Logo";
import { getClients, logoutApi } from "@/lib/api";
import { getSession, logout } from "@/lib/auth";

/** Composant de la liste des clients (outil d'administration). */
export default function DashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/admin/login");
      return;
    }
    if (session.role === "client") {
      // Un client n'a rien à faire ici : on le ramène sur son espace.
      router.replace(`/dashboard/client/${session.clientId}`);
      return;
    }
    setAuthorized(true);
    getClients()
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      /* best-effort */
    }
    logout();
    router.replace("/admin/login");
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6">
        <Logo variant="dark" size="sm" />
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/admin"
            className="text-xs font-semibold text-brand-800 hover:text-brand-950"
          >
            Administration
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-slate-500 hover:text-brand-800 transition-colors cursor-pointer"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 font-display">
          Clients
        </h1>
        <p className="text-slate-500 mb-8">
          Sélectionnez un profil client pour consulter ses comptes et opérations.
        </p>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Chargement...</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/dashboard/client/${client.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-brand-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-brand-800 text-white flex items-center justify-center text-lg font-bold">
                    {client.firstName[0]}
                    {client.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-brand-800 transition-colors">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{client.email}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  {client.city}, {client.province}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
