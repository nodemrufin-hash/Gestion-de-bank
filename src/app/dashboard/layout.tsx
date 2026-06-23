"use client";

/**
 * Layout commun à toutes les pages du tableau de bord (espace client).
 *
 * Protège l'accès : seul un client connecté peut entrer, et uniquement sur son
 * propre espace (l'identifiant de l'URL doit correspondre à la session, sinon
 * redirection vers son profil). Fournit la barre supérieure, la navigation
 * latérale (repliable) et le bouton de déconnexion.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Logo from "@/components/common/Logo";
import { getSession, logout } from "@/lib/auth";

/**
 * Layout de l'espace client.
 * @param children Contenu de la page courante rendu dans la zone principale.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  // Garde d'authentification : exécutée à chaque changement de route.
  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "client") {
      router.replace("/login");
      return;
    }
    // L'URL d'un client suit le motif /dashboard/client/<id>/...
    const match = pathname.match(/^\/dashboard\/client\/([^/]+)/);
    const urlClientId = match ? match[1] : null;
    if (urlClientId !== session.clientId) {
      // Pas d'id, ou id d'un autre client : on ramène le client sur son profil.
      router.replace(`/dashboard/client/${session.clientId}`);
      return;
    }
    setClientId(session.clientId);
    setClientName(session.name);
    setAuthorized(true);
  }, [pathname, router]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // Tant que la garde n'a pas validé l'accès, on n'affiche pas le contenu.
  if (!authorized) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Chargement...</div>;
  }

  const isActive = pathname === `/dashboard/client/${clientId}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top bar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 shrink-0">
        <button
          className="lg:hidden mr-3 p-2 hover:bg-slate-100 rounded-lg"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Menu"
        >
          <div className="w-5 h-0.5 bg-slate-700 mb-1" />
          <div className="w-5 h-0.5 bg-slate-700 mb-1" />
          <div className="w-5 h-0.5 bg-slate-700" />
        </button>
        <Logo variant="dark" size="sm" />
        <div className="ml-auto flex items-center gap-4">
          <span className="hidden sm:inline text-sm text-slate-500">{clientName}</span>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-slate-500 hover:text-brand-800 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 pt-6 transition-transform duration-300 flex flex-col`}
        >
          <nav className="flex flex-col gap-1 px-4">
            <Link
              href={`/dashboard/client/${clientId}`}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="text-lg">□</span>
              Mon profil
            </Link>
          </nav>

          <button
            onClick={handleLogout}
            className="mt-auto mb-6 mx-4 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 text-left transition-colors"
          >
            Déconnexion
          </button>
        </aside>

        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
