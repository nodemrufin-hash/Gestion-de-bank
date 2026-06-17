"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getClients } from "@/lib/api";

export default function DashboardPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-slate-400">Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: "var(--font-syne)" }}>
        Tableau de bord
      </h1>
      <p className="text-slate-500 mb-8">Sélectionnez un profil client pour accéder à ses comptes et opérations.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/dashboard/client/${client.id}`}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-brand-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-800 text-white flex items-center justify-center text-lg font-bold">
                {client.firstName[0]}{client.lastName[0]}
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
    </div>
  );
}
