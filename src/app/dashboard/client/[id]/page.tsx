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
import {
  Landmark,
  ArrowLeftRight,
  Receipt,
  Banknote,
  Target,
  Package,
  User,
} from "lucide-react";
import { getClient, getClientBalances } from "@/lib/api";

/** Tuiles de navigation de l'espace client (chemins relatifs à la page client). */
const TILES = [
  {
    path: "comptes",
    icon: Landmark,
    label: "Mes comptes",
    desc: "Soldes et détails",
  },
  {
    path: "transfer",
    icon: ArrowLeftRight,
    label: "Virement",
    desc: "Interne ou Interac",
  },
  {
    path: "bills",
    icon: Receipt,
    label: "Factures",
    desc: "Payer un fournisseur",
  },
  {
    path: "deposit",
    icon: Banknote,
    label: "Dépôt / Retrait",
    desc: "Argent et chèques",
  },
  { path: "goals", icon: Target, label: "Objectifs", desc: "Épargne" },
  {
    path: "products",
    icon: Package,
    label: "Produits",
    desc: "Offres financières",
  },
  { path: "profil", icon: User, label: "Mon profil", desc: "Mes informations" },
];

/** Composant de la page d'accueil client (résumé + tuiles de navigation). */
export default function ClientHomePage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [balances, setBalances] = useState<any[]>([]);

  // Charge les infos du client et ses soldes par compte au montage.
  useEffect(() => {
    if (!id) return;
    Promise.all([getClient(id), getClientBalances(id)])
      .then(([c, b]) => {
        setClient(c);
        setBalances(b);
      })
      .catch(console.error);
  }, [id]);

  // Somme des soldes de tous les comptes pour le total affiché en haut.
  const totalBalance = balances.reduce(
    (sum: number, b: any) => sum + b.total,
    0,
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Salutation + solde total */}
      <div className="bg-brand-950 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-brand-300 text-sm">Bienvenue</p>
          <h1 className="text-2xl font-bold text-white font-display">
            Bonjour{client ? `, ${client.firstName}` : ""}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-brand-300">Solde total</p>
          <p className="font-display font-extrabold text-white text-3xl">
            {totalBalance.toLocaleString("fr-CA", {
              style: "currency",
              currency: "CAD",
            })}
          </p>
        </div>
      </div>
      {/* Tuiles de navigation */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Que souhaitez-vous faire ?
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {TILES.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.path}
                href={`/dashboard/client/${id}/${t.path}`}
                className="card card-hover p-6 group"
              >
                <span className="inline-flex w-11 h-11 items-center justify-center rounded-xl bg-brand-800 text-white group-hover:bg-brand-600 transition-colors">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <p className="font-semibold text-slate-900 mt-3 group-hover:text-brand-800 transition-colors">
                  {t.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
