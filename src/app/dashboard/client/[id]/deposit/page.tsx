"use client";

/**
 * Page de dépôt / retrait.
 *
 * Trois modes : dépôt, retrait, ou dépôt de chèque (avec photo). Le compte et le
 * montant sont saisis puis l'opération est confirmée via une fenêtre modale.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getClientAccounts, deposit, withdraw, depositCheque } from "@/lib/api";
import ConfirmModal from "@/components/common/ConfirmModal";

/** Composant de la page dépôt / retrait / dépôt de chèque. */
export default function DepositPage() {
  const { id } = useParams<{ id: string }>();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [mode, setMode] = useState<"depot" | "retrait" | "cheque">("depot");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [chequeFile, setChequeFile] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    getClientAccounts(id).then((accs) => {
      setAccounts(accs);
      if (accs.length > 0) setAccountId(accs[0].id);
    });
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Montant invalide"); return; }
    if (!accountId) { setError("Compte requis"); return; }

    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    const amt = parseFloat(amount);
    setLoading(true);
    try {
      if (mode === "cheque") {
        const formData = new FormData();
        formData.append("accountId", accountId);
        formData.append("amount", String(amt));
        formData.append("description", description || "Dépôt de chèque");
        if (chequeFile) formData.append("chequeImage", chequeFile);
        await depositCheque(formData);
        setMessage(`Chèque de ${amt.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} déposé !`);
      } else if (mode === "depot") {
        await deposit({ accountId, amount: amt, description });
        setMessage(`Dépôt de ${amt.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} effectué !`);
      } else {
        await withdraw({ accountId, amount: amt, description });
        setMessage(`Retrait de ${amt.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} effectué !`);
      }
      setAmount("");
      setDescription("");
      setChequeFile(null);
      setShowConfirm(false);
    } catch (e: any) {
      setError(e.message);
      setShowConfirm(false);
    }
    setLoading(false);
  };

  const isCheque = mode === "cheque";
  const account = accounts.find((a) => a.id === accountId);
  const amt = parseFloat(amount) || 0;
  const operationLabel = mode === "cheque" ? "le dépôt de chèque" : mode === "depot" ? "le dépôt" : "le retrait";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link href={`/dashboard/client/${id}`} className="text-sm text-slate-500 hover:text-brand-800 transition-colors">
        ← Retour à l'accueil
      </Link>

      <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-syne)" }}>Dépôt / Retrait</h1>

      <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
        {(["depot", "retrait", "cheque"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors capitalize ${mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {m === "depot" ? "Dépôt" : m === "retrait" ? "Retrait" : "Chèque"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Compte</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"
          >
            <option value="">Sélectionner un compte</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} — {a.balance.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}</option>
            ))}
          </select>
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description (optionnelle)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isCheque ? "Ex: Chèque #1234" : "Ex: Dépôt en espèces"}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"
          />
        </div>

        {isCheque && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Photo du chèque</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setChequeFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-800 hover:file:bg-brand-100"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
        {message && <p className="text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">{message}</p>}

        <button
          type="submit"
          className="w-full py-3 bg-brand-800 text-white rounded-xl font-semibold hover:bg-brand-900 transition-colors disabled:opacity-50"
        >
          {isCheque ? "Déposer le chèque" : mode === "depot" ? "Effectuer le dépôt" : "Effectuer le retrait"}
        </button>
      </form>

      <ConfirmModal
        open={showConfirm}
        title={`Confirmer ${operationLabel}`}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      >
        <p>Compte : <strong>{account?.name}</strong></p>
        <p>Montant : <strong>{amt.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}</strong></p>
        {isCheque && <p>Photo du chèque : <strong>{chequeFile ? chequeFile.name : "aucune"}</strong></p>}
      </ConfirmModal>
    </div>
  );
}
