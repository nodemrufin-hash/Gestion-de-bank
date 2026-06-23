"use client";

/**
 * Page de paiement de factures.
 *
 * Permet de payer un fournisseur depuis un compte chèques (avec ajout d'un
 * fournisseur à la volée) et confirme l'opération via une fenêtre modale.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getClientAccounts, getBeneficiaries, payBill, createBeneficiary } from "@/lib/api";
import ConfirmModal from "@/components/common/ConfirmModal";

/** Composant de la page de paiement de factures. */
export default function BillsPage() {
  const { id } = useParams<{ id: string }>();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [fromAccountId, setFromAccountId] = useState("");
  const [fournisseurId, setFournisseurId] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([getClientAccounts(id), getBeneficiaries(id)]).then(([accs, bens]) => {
      setAccounts(accs);
      setFournisseurs(bens.filter((b: any) => b.isFournisseur));
      if (accs.length > 0) setFromAccountId(accs[0].id);
    });
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Montant invalide"); return; }
    if (!fromAccountId) { setError("Compte source requis"); return; }
    if (!fournisseurId) { setError("Fournisseur requis"); return; }

    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    const amt = parseFloat(amount);
    setLoading(true);
    try {
      await payBill({ fromAccountId, fournisseurId, amount: amt });
      setMessage(`Paiement de ${amt.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} effectué !`);
      setAmount("");
      setShowConfirm(false);
    } catch (e: any) {
      setError(e.message);
      setShowConfirm(false);
    }
    setLoading(false);
  };

  const handleCreateFournisseur = async () => {
    if (!newName.trim()) return;
    try {
      await createBeneficiary({ clientId: id, name: newName, isFournisseur: true });
      setNewName("");
      setShowNew(false);
      const bens = await getBeneficiaries(id);
      setFournisseurs(bens.filter((b: any) => b.isFournisseur));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const chequeAccounts = accounts.filter((a) => a.type === "cheque");
  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const fournisseur = fournisseurs.find((f) => f.id === fournisseurId);
  const amt = parseFloat(amount) || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link href={`/dashboard/client/${id}`} className="text-sm text-slate-500 hover:text-brand-800 transition-colors">
        ← Retour à l'accueil
      </Link>

      <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-syne)" }}>Paiement de factures</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Compte à débiter</label>
          <select
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"
          >
            <option value="">Sélectionner un compte</option>
            {chequeAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} — {a.balance.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fournisseur</label>
          <select
            value={fournisseurId}
            onChange={(e) => setFournisseurId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"
          >
            <option value="">Sélectionner un fournisseur</option>
            {fournisseurs.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <button type="button" onClick={() => setShowNew(!showNew)} className="text-xs text-brand-700 mt-2 hover:underline">
            + Ajouter un fournisseur
          </button>
          {showNew && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom du fournisseur"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none"
              />
              <button type="button" onClick={handleCreateFournisseur} className="px-4 py-2 bg-brand-800 text-white rounded-lg text-sm font-semibold hover:bg-brand-900">
                Ajouter
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Montant ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
        {message && <p className="text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">{message}</p>}

        <button
          type="submit"
          className="w-full py-3 bg-brand-800 text-white rounded-xl font-semibold hover:bg-brand-900 transition-colors disabled:opacity-50"
        >
          Payer la facture
        </button>
      </form>

      <ConfirmModal
        open={showConfirm}
        title="Confirmer le paiement"
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      >
        <p>Compte à débiter : <strong>{fromAccount?.name}</strong></p>
        <p>Fournisseur : <strong>{fournisseur?.name}</strong></p>
        <p>Montant : <strong>{amt.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}</strong></p>
      </ConfirmModal>
    </div>
  );
}
