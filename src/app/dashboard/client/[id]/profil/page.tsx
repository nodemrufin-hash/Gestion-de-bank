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

  if (!client)
    return (
      <div className="text-center py-20 text-slate-400">Chargement...</div>
    );

  const groups = [
    {
      label: "Identité",
      fields: [
        { label: "Prénom", value: client.firstName },
        { label: "Nom", value: client.lastName },
        { label: "Date de naissance", value: client.dateNaissance },
      ],
    },
    {
      label: "Contact",
      fields: [
        { label: "Courriel", value: client.email },
        { label: "Téléphone", value: client.phone },
      ],
    },
    {
      label: "Adresse",
      fields: [
        { label: "Adresse", value: client.address },
        { label: "Ville", value: client.city },
        { label: "Province", value: client.province },
        { label: "Code postal", value: client.postalCode },
      ],
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link
        href={`/dashboard/client/${id}`}
        className="text-sm text-brand-steel hover:text-brand-800 transition-colors font-medium"
      >
        ← Retour à l'accueil
      </Link>

      {/* En-tête profil */}
      <div className="card p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-950 text-white flex items-center justify-center text-2xl font-bold font-display shrink-0">
          {client.firstName[0]}
          {client.lastName[0]}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            {client.firstName} {client.lastName}
          </h1>
          <p className="text-slate-500 text-sm">{client.email}</p>
        </div>
      </div>

      {/* Informations détaillées, groupées par section */}
      <div className="space-y-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 font-display">
          Informations personnelles
        </h2>

        {groups.map((group) => (
          <section key={group.label}>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand-steel font-display mb-3">
              {group.label}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {group.fields.map((f) => (
                <div key={f.label} className="card p-4">
                  <p className="text-xs text-slate-400 mb-1">{f.label}</p>
                  <p className="text-sm font-bold text-slate-900">{f.value}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
