"use client";

/**
 * Layout de l'espace d'un client (`/dashboard/client/<id>/...`).
 *
 * Protège l'accès : seul le client concerné (l'`id` de l'URL doit correspondre à
 * sa session) ou un administrateur peuvent entrer ; sinon redirection. Fournit
 * la barre supérieure, la navigation latérale (repliable) et la déconnexion.
 *
 * L'autorisation réelle est appliquée côté serveur (jeton + vérification de
 * propriété) ; cette garde n'est que le confort de navigation côté client.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useParams } from "next/navigation";
import {
  Home,
  Landmark,
  ArrowLeftRight,
  Receipt,
  Banknote,
  Target,
  Package,
  User,
} from "lucide-react";
import Logo from "@/components/common/Logo";
import { getSession, logout } from "@/lib/auth";
import { logoutApi } from "@/lib/api";

/**
 * Layout de l'espace client.
 * @param children Contenu de la page courante rendu dans la zone principale.
 */
export default function ClientSpaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [clientName, setClientName] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const urlClientId = String(params.id ?? "");

  // Garde d'authentification : exécutée à chaque changement de route.
  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.role === "admin") {
      // Un administrateur peut consulter l'espace de n'importe quel client.
      setIsAdminView(true);
      setClientName("Vue administrateur");
      setAuthorized(true);
      return;
    }
    // Client : il ne peut accéder qu'à son propre espace.
    if (session.clientId !== urlClientId) {
      router.replace(`/dashboard/client/${session.clientId}`);
      return;
    }
    setClientName(session.name);
    setAuthorized(true);
  }, [pathname, urlClientId, router]);

  const handleLogout = async () => {
    const wasAdmin = getSession()?.role === "admin";
    try {
      await logoutApi();
    } catch {
      // Best-effort : on déconnecte localement même si l'appel échoue.
    }
    logout();
    router.replace(wasAdmin ? "/admin/login" : "/login");
  };

  // Tant que la garde n'a pas validé l'accès, on n'affiche pas le contenu.
  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Chargement...
      </div>
    );
  }

  const base = `/dashboard/client/${urlClientId}`;
  const navItems = [
    { label: "Accueil", href: base, icon: Home, exact: true },
    {
      label: "Mes comptes",
      href: `${base}/comptes`,
      icon: Landmark,
      match: ["/comptes", "/accounts/"],
    },
    { label: "Virement", href: `${base}/transfer`, icon: ArrowLeftRight },
    { label: "Factures", href: `${base}/bills`, icon: Receipt },
    { label: "Dépôt / Retrait", href: `${base}/deposit`, icon: Banknote },
    { label: "Objectifs", href: `${base}/goals`, icon: Target },
    { label: "Produits", href: `${base}/products`, icon: Package },
    { label: "Mon profil", href: `${base}/profil`, icon: User },
  ];

  /** Indique si une entrée de navigation correspond à l'URL courante. */
  const isItemActive = (item: (typeof navItems)[number]) => {
    if (item.exact) return pathname === item.href;
    if (item.match) return item.match.some((m) => pathname.includes(m));
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top bar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 shrink-0">
        <button
          className="lg:hidden mr-3 p-2 hover:bg-slate-100 rounded-lg cursor-pointer"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Menu"
        >
          <div className="w-5 h-0.5 bg-slate-700 mb-1" />
          <div className="w-5 h-0.5 bg-slate-700 mb-1" />
          <div className="w-5 h-0.5 bg-slate-700" />
        </button>
        <Logo variant="dark" size="sm" />
        <div className="ml-auto flex items-center gap-4">
          {isAdminView && (
            <Link
              href="/dashboard"
              className="hidden sm:inline text-xs font-semibold text-brand-800 hover:text-brand-950"
            >
              ← Retour aux clients
            </Link>
          )}
          <span className="hidden sm:inline text-sm text-slate-500">
            {clientName}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-slate-500 hover:text-brand-800 transition-colors cursor-pointer"
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
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isItemActive(item)
                      ? "bg-brand-950 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-auto mb-6 mx-4 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 text-left transition-colors cursor-pointer"
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
