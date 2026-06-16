"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getGoals, createGoal, updateGoalProgress, getClientAccounts } from "@/lib/api";

export default function GoalsPage() {
  const { id } = useParams<{ id: string }>();
  const [goals, setGoals] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  // New goal form
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [accountId, setAccountId] = useState("");

  // Progress
  const [progressAmount, setProgressAmount] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadGoals = () => {
    Promise.all([getGoals(id), getClientAccounts(id)]).then(([gs, accs]) => {
      setGoals(gs);
      setAccounts(accs);
      const epargneAcc = accs.find((a: any) => a.type === "epargne");
      if (epargneAcc) setAccountId(epargneAcc.id);
    });
  };

  useEffect(() => { if (id) loadGoals(); }, [id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (!name || isNaN(target) || target <= 0) return;
    setSaving(true);
    try {
      await createGoal({ clientId: id, accountId, name, targetAmount: target });
      setShowNew(false);
      setName("");
      setTargetAmount("");
      loadGoals();
    } catch (e: any) {
      setMessage(`Erreur : ${e.message}`);
    }
    setSaving(false);
  };

  const handleProgress = async (goalId: string) => {
    const amt = parseFloat(progressAmount[goalId] || "0");
    if (isNaN(amt) || amt <= 0) return;
    try {
      await updateGoalProgress({ id: goalId, amount: amt });
      loadGoals();
      setProgressAmount((prev) => ({ ...prev, [goalId]: "" }));
    } catch (e: any) {
      setMessage(`Erreur : ${e.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link href={`/dashboard/client/${id}`} className="text-sm text-slate-500 hover:text-brand-800 transition-colors">
        ← Retour au profil
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-syne)" }}>Objectifs d'épargne</h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="px-5 py-2.5 bg-brand-800 text-white rounded-xl font-semibold hover:bg-brand-900 transition-colors text-sm"
        >
          + Nouvel objectif
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Voyage au Japon"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Montant cible ($)</label>
            <input type="number" min="0" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="5000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none" />
          </div>
          {message && <p className="text-sm text-red-500">{message}</p>}
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-brand-800 text-white rounded-xl font-semibold hover:bg-brand-900 disabled:opacity-50">
            {saving ? "Création..." : "Créer l'objectif"}
          </button>
        </form>
      )}

      {goals.length === 0 ? (
        <p className="text-slate-400 text-center py-12">Aucun objectif d'épargne.</p>
      ) : (
        <div className="space-y-4">
          {goals.map((g: any) => {
            const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            return (
              <div key={g.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">{g.name}</h3>
                  <span className="text-sm font-bold text-emerald-600">{pct}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-sm text-slate-500 mb-4">
                  <span>{g.currentAmount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}</span>
                  <span>{g.targetAmount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={progressAmount[g.id] || ""}
                    onChange={(e) => setProgressAmount((prev) => ({ ...prev, [g.id]: e.target.value }))}
                    placeholder="Montant à ajouter"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none"
                  />
                  <button
                    onClick={() => handleProgress(g.id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
