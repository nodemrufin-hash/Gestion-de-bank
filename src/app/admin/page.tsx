"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getParameters, updateParameter, resetAllData, getClients, resetClient } from "@/lib/api";

export default function AdminPage() {
  const router = useRouter();
  const [parameters, setParameters] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    Promise.all([getParameters(), getClients()]).then(([params, cls]) => {
      setParameters(params);
      setClients(cls);
      const vals: Record<string, string> = {};
      params.forEach((p) => { vals[p.key] = p.value; });
      setEditValues(vals);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (key: string) => {
    try {
      await updateParameter(key, editValues[key]);
      setMessage(`Paramètre "${key}" mis à jour.`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm("Voulez-vous vraiment réinitialiser TOUTES les données ? Cette action est irréversible.")) return;
    try {
      await resetAllData();
      setMessage("Toutes les données ont été réinitialisées.");
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleResetClient = async (clientId: string) => {
    if (!window.confirm("Réinitialiser ce profil client ?")) return;
    try {
      await resetClient(clientId);
      setMessage("Profil client réinitialisé.");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const paramLabels: Record<string, string> = {
    default_low_balance_threshold: "Seuil de solde faible par défaut ($)",
    max_transfer_amount: "Montant max de virement ($)",
    daily_transfer_limit: "Limite quotidienne de virement ($)",
    interest_rate_cheque: "Taux d'intérêt compte chèques (%)",
    interest_rate_epargne: "Taux d'intérêt compte épargne (%)",
    interest_rate_credit: "Taux d'intérêt carte de crédit (%)",
    currency: "Devise",
    locale: "Langue",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-syne)" }}>Administration</h1>
          <p className="text-sm text-slate-500">Paramètres globaux de l'application</p>
        </div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-brand-800 transition-colors">
          ← Tableau de bord
        </Link>
      </div>

      {message && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700">{message}</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>}

      {/* Paramètres */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Paramètres</h2>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {parameters.map((p) => (
            <div key={p.key} className="p-4 flex items-center gap-4">
              <label className="text-sm text-slate-700 flex-1">{paramLabels[p.key] || p.key}</label>
              <input
                type="text"
                value={editValues[p.key] || ""}
                onChange={(e) => setEditValues((prev) => ({ ...prev, [p.key]: e.target.value }))}
                className="w-40 px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-400"
              />
              <button
                onClick={() => handleSave(p.key)}
                className="px-4 py-1.5 bg-brand-800 text-white rounded-lg text-xs font-semibold hover:bg-brand-900 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Clients - réinitialisation */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Profils clients</h2>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {clients.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 text-sm">{c.firstName} {c.lastName}</p>
                <p className="text-xs text-slate-400">{c.email}</p>
              </div>
              <button
                onClick={() => handleResetClient(c.id)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Réinitialisation globale */}
      <section className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Réinitialisation globale</h2>
        <p className="text-sm text-red-600 mb-4">Efface toutes les données et régénère les profils avec leurs transactions initiales.</p>
        <button
          onClick={handleResetAll}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
        >
          Réinitialiser toutes les données
        </button>
      </section>
    </div>
  );
}
