"use client";

/**
 * Page « Mes comptes » de l'espace client.
 *
 * Regroupe tout ce qui touche aux comptes : soldes par catégorie, liste des
 * comptes (cliquables vers le détail) et gestion des alertes de solde faible.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getClientAccounts, getClientBalances, getAlerts, updateAlert } from "@/lib/api";

const categoryConfig: Record<string, { label: string; color: string }> = {
  depenses: { label: "Dépenses", color: "#3b82f6" },
  epargne: { label: "Épargne", color: "#10b981" },
  emprunt: { label: "Emprunt", color: "#ef4444" },
  investissement: { label: "Investissement", color: "#8b5cf6" },
};

/** Composant de la page « Mes comptes » (soldes, comptes, alertes). */
export default function ComptesPage() {
  const { id } = useParams<{ id: string }>();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertEdits, setAlertEdits] = useState<Record<string, { threshold: string; enabled: boolean }>>({});
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([getClientAccounts(id), getClientBalances(id), getAlerts(id)])
      .then(([accs, bals, als]) => {
        setAccounts(accs);
        setBalances(bals);
        setAlerts(als);
        const edits: Record<string, { threshold: string; enabled: boolean }> = {};
        als.forEach((a: any) => { edits[a.id] = { threshold: String(a.threshold), enabled: !!a.enabled }; });
        setAlertEdits(edits);
      })
      .catch(console.error);
  }, [id]);

  const handleSaveAlert = async (alertId: string) => {
    const edit = alertEdits[alertId];
    const threshold = parseFloat(edit.threshold);
    if (isNaN(threshold) || threshold < 0) return;
    try {
      await updateAlert(alertId, { threshold, enabled: edit.enabled });
      setAlertMessage("Seuil d'alerte mis à jour.");
      const als = await getAlerts(id);
      setAlerts(als);
    } catch (e: any) {
      setAlertMessage(`Erreur : ${e.message}`);
    }
  };

  const totalBalance = balances.reduce((sum: number, b: any) => sum + b.total, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link href={`/dashboard/client/${id}`} className="text-sm text-slate-500 hover:text-brand-800 transition-colors">
        ← Retour à l'accueil
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-syne)" }}>Mes comptes</h1>
        <div className="text-right">
          <p className="text-sm text-slate-400">Solde total</p>
          <p className="text-xl font-bold text-slate-900">
            {totalBalance.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
          </p>
        </div>
      </div>

      {/* Soldes par catégorie */}
      {balances.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Soldes par catégorie</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {balances.map((b: any) => {
              const cfg = categoryConfig[b.category] || { label: b.category, color: "#6b7280" };
              return (
                <div key={b.category} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="text-xs font-medium text-slate-500">{cfg.label}</span>
                  </div>
                  <p className="text-lg font-bold" style={{ color: cfg.color }}>
                    {b.total.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Comptes */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Comptes</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.map((acc: any) => {
            const isDebt = acc.category === "emprunt" && acc.balance < 0;
            return (
              <Link
                key={acc.id}
                href={`/dashboard/client/${id}/accounts/${acc.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-brand-800 transition-colors">{acc.name}</p>
                    <p className="text-xs text-slate-400">{acc.accountNumber} · {acc.type}</p>
                  </div>
                  <div
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      acc.type === "cheque" ? "bg-blue-50 text-blue-700" :
                      acc.type === "epargne" ? "bg-green-50 text-green-700" :
                      acc.type === "credit" ? "bg-red-50 text-red-700" :
                      acc.type === "pret" ? "bg-orange-50 text-orange-700" :
                      "bg-purple-50 text-purple-700"
                    }`}
                  >
                    {acc.type}
                  </div>
                </div>
                <p className={`text-xl font-bold ${isDebt ? "text-red-500" : "text-slate-900"}`}>
                  {acc.balance.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                </p>
                {acc.creditLimit > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    Limite : {acc.creditLimit.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                    {acc.balance < 0 && (
                      <span className="ml-2">
                        Disponible : {(acc.creditLimit + acc.balance).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                      </span>
                    )}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Alertes */}
      {alerts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Alertes de solde faible</h2>
          {alertMessage && <p className="text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg mb-3">{alertMessage}</p>}
          <div className="space-y-3">
            {alerts.map((a: any) => {
              const acc = accounts.find((ac: any) => ac.id === a.accountId);
              const edit = alertEdits[a.id] || { threshold: String(a.threshold), enabled: !!a.enabled };
              return (
                <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-sm font-medium text-slate-900">{acc?.name || "Compte"}</p>
                    <p className="text-xs text-slate-400">Notifie si le solde descend sous ce seuil</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Seuil ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={edit.threshold}
                      onChange={(e) => setAlertEdits((prev) => ({ ...prev, [a.id]: { ...edit, threshold: e.target.value } }))}
                      className="w-32 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-400"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={edit.enabled}
                      onChange={(e) => setAlertEdits((prev) => ({ ...prev, [a.id]: { ...edit, enabled: e.target.checked } }))}
                      className="w-4 h-4"
                    />
                    Activée
                  </label>
                  <button
                    onClick={() => handleSaveAlert(a.id)}
                    className="px-4 py-2 bg-brand-800 text-white rounded-lg text-xs font-semibold hover:bg-brand-900 transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
