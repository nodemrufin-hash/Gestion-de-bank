"use client";

/**
 * Page « Mon profil » de l'espace client.
 *
 * Affiche uniquement les informations personnelles du client (nom, courriel,
 * téléphone, adresse, date de naissance), séparément des comptes et opérations.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getClient } from "@/lib/api";

/** Composant de la page profil client (informations personnelles). */
export default function ProfilPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    getClient(id).then(setClient).catch(console.error);
  }, [id]);

  if (!client) return <div className="text-center py-20 text-slate-400">Chargement...</div>;

  const fields = [
    { label: "Prénom", value: client.firstName },
    { label: "Nom", value: client.lastName },
    { label: "Courriel", value: client.email },
    { label: "Téléphone", value: client.phone },
    { label: "Adresse", value: client.address },
    { label: "Ville", value: client.city },
    { label: "Province", value: client.province },
    { label: "Code postal", value: client.postalCode },
    { label: "Date de naissance", value: client.dateNaissance },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link href={`/dashboard/client/${id}`} className="text-sm text-slate-500 hover:text-brand-800 transition-colors">
        ← Retour à l'accueil
      </Link>

      {/* En-tête profil */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-800 text-white flex items-center justify-center text-2xl font-bold shrink-0">
          {client.firstName[0]}{client.lastName[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            {client.firstName} {client.lastName}
          </h1>
          <p className="text-slate-500 text-sm">{client.email}</p>
        </div>
      </div>

      {/* Informations détaillées */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Informations personnelles</h2>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {fields.map((f) => (
            <div key={f.label} className="p-4 flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500">{f.label}</span>
              <span className="text-sm font-medium text-slate-900 text-right">{f.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
