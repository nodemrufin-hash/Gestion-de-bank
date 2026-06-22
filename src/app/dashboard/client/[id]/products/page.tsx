"use client";

/**
 * Page des produits financiers.
 *
 * Présente la liste des produits offerts (comptes, placements, emprunts) avec
 * leur description ; les taux affichés proviennent des paramètres globaux.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getParameters } from "@/lib/api";

interface Product {
  key: string;
  name: string;
  category: string;
  description: string;
  rateParam?: string;
  rateLabel?: string;
  color: string;
}

const PRODUCTS: Product[] = [
  {
    key: "cheque",
    name: "Compte chèques",
    category: "Dépenses",
    description: "Compte transactionnel pour les opérations courantes : dépôts, retraits, virements et paiements de factures.",
    rateParam: "interest_rate_cheque",
    rateLabel: "Taux d'intérêt",
    color: "#3b82f6",
  },
  {
    key: "epargne",
    name: "Compte épargne",
    category: "Épargne",
    description: "Compte à intérêt simple, idéal pour constituer un fonds d'urgence ou financer des objectifs d'épargne personnalisés.",
    rateParam: "interest_rate_epargne",
    rateLabel: "Taux d'intérêt",
    color: "#10b981",
  },
  {
    key: "celi",
    name: "CELI (placements)",
    category: "Investissement",
    description: "Compte d'épargne libre d'impôt permettant d'investir dans des placements variés. Rendement variable selon les marchés.",
    rateLabel: "Rendement",
    color: "#8b5cf6",
  },
  {
    key: "reer",
    name: "REER",
    category: "Investissement",
    description: "Régime enregistré d'épargne-retraite offrant un report d'impôt sur les cotisations. Idéal pour la planification à long terme.",
    rateLabel: "Rendement",
    color: "#8b5cf6",
  },
  {
    key: "credit",
    name: "Carte de crédit",
    category: "Emprunt",
    description: "Carte de crédit avec limite personnalisée, permettant des paiements différés et le remboursement progressif du solde.",
    rateParam: "interest_rate_credit",
    rateLabel: "Taux d'intérêt annuel",
    color: "#ef4444",
  },
  {
    key: "pret",
    name: "Prêt personnel",
    category: "Emprunt",
    description: "Prêt à versements fixes pour financer un projet. Le taux est déterminé selon le profil de crédit du client.",
    rateLabel: "Taux d'intérêt",
    color: "#ef4444",
  },
];

/** Composant de la page des produits financiers disponibles. */
export default function ProductsPage() {
  const { id } = useParams<{ id: string }>();
  const [parameters, setParameters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getParameters()
      .then(setParameters)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getRate = (paramKey?: string) => {
    if (!paramKey) return null;
    const p = parameters.find((p) => p.key === paramKey);
    return p ? p.value : null;
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Chargement...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link href={`/dashboard/client/${id}`} className="text-sm text-slate-500 hover:text-brand-800 transition-colors">
        ← Retour au profil
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-syne)" }}>
          Produits financiers
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Aperçu des produits financiers disponibles. Les taux affichés proviennent des paramètres globaux de la banque.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {PRODUCTS.map((product) => {
          const rate = getRate(product.rateParam);
          return (
            <div key={product.key} className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: product.color }} />
                <span className="text-xs font-medium text-slate-500">{product.category}</span>
              </div>
              <h2 className="font-semibold text-slate-900 mb-2">{product.name}</h2>
              <p className="text-sm text-slate-500 mb-4">{product.description}</p>
              <div className="flex items-baseline justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-400">{product.rateLabel}</span>
                <span className="text-sm font-bold" style={{ color: product.color }}>
                  {rate !== null ? `${rate}%` : "Variable"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
