"use client";

/**
 * Page d'accueil de l'espace client.
 *
 * Point de départ après connexion : salutation, solde total, et tuiles de
 * navigation vers les différentes sections (comptes, virement, factures,
 * dépôt, objectifs, produits, profil). Le client choisit où aller.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getClient, getClientBalances } from "@/lib/api";

/** Tuiles de navigation de l'espace client (chemins relatifs à la page client). */
const TILES = [
  { path: "comptes", icon: "🏦", label: "Mes comptes", desc: "Soldes et détails" },
  { path: "transfer", icon: "↗", label: "Virement", desc: "Interne ou Interac" },
  { path: "bills", icon: "📄", label: "Factures", desc: "Payer un fournisseur" },
  { path: "deposit", icon: "💳", label: "Dépôt / Retrait", desc: "Argent et chèques" },
  { path: "goals", icon: "🎯", label: "Objectifs", desc: "Épargne" },
  { path: "products", icon: "📦", label: "Produits", desc: "Offres financières" },
  { path: "profil", icon: "👤", label: "Mon profil", desc: "Mes informations" },
];

/** Composant de la page d'accueil client (résumé + tuiles de navigation). */
export default function ClientHomePage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [balances, setBalances] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([getClient(id), getClientBalances(id)])
      .then(([c, b]) => {
        setClient(c);
        setBalances(b);
      })
      .catch(console.error);
  }, [id]);

  const totalBalance = balances.reduce((sum: number, b: any) => sum + b.total, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Salutation + solde total */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm">Bienvenue</p>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-syne)" }}>
            Bonjour{client ? `, ${client.firstName}` : ""} 👋
          </h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Solde total</p>
          <p className="text-3xl font-bold text-slate-900">
            {totalBalance.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
          </p>
        </div>
      </div>

      {/* Tuiles de navigation */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Que souhaitez-vous faire ?</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {TILES.map((t) => (
            <Link
              key={t.path}
              href={`/dashboard/client/${id}/${t.path}`}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-brand-300 hover:shadow-md transition-all group"
            >
              <span className="text-3xl">{t.icon}</span>
              <p className="font-semibold text-slate-900 mt-3 group-hover:text-brand-800 transition-colors">{t.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
