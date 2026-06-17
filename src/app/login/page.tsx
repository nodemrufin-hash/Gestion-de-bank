"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { getClients } from "@/lib/api";

export default function LoginPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch((e) => setError(e.message || "Impossible de charger les profils."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#EDE8D0" }}>
      <header className="px-6 py-5">
        <Logo variant="dark" size="md" />
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-white/60 p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "var(--font-syne)" }}>
              Connexion
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Sélectionnez votre profil pour accéder à vos comptes.
            </p>
          </div>

          {loading ? (
            <p className="text-center text-slate-400 py-10">Chargement des profils...</p>
          ) : error ? (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
          ) : clients.length === 0 ? (
            <p className="text-center text-slate-400 py-10">Aucun profil disponible.</p>
          ) : (
            <div className="space-y-3">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/dashboard/client/${client.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all group"
                >
                  <div className="w-11 h-11 rounded-full bg-brand-800 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {client.firstName[0]}{client.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 group-hover:text-brand-800 transition-colors truncate">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{client.email}</p>
                  </div>
                  <span className="ml-auto text-slate-300 group-hover:text-brand-800 transition-colors">→</span>
                </Link>
              ))}
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-8">
            Vous n&apos;avez pas encore de profil ?{" "}
            <Link href="/register" className="font-semibold text-brand-800 hover:text-brand-900">
              Ouvrir un compte
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
