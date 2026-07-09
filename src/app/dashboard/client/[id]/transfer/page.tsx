"use client";

/**
 * Page de virement.
 *
 * Deux modes : virement interne entre comptes du client, ou virement Interac
 * vers un bénéficiaire (avec possibilité d'en créer un à la volée). Confirmation
 * via une fenêtre modale avant exécution.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getClientAccounts,
  getBeneficiaries,
  internalTransfer,
  interacTransfer,
  createBeneficiary,
} from "@/lib/api";
import ConfirmModal from "@/components/common/ConfirmModal";

/** Composant de la page de virement (interne / Interac). */
export default function TransferPage() {
  const { id } = useParams<{ id: string }>();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [mode, setMode] = useState<"interne" | "interac">("interne");

  // Form state
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // New beneficiary
  const [showNewBenef, setShowNewBenef] = useState(false);
  const [newBenefName, setNewBenefName] = useState("");
  const [newBenefEmail, setNewBenefEmail] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([getClientAccounts(id), getBeneficiaries(id)]).then(
      ([accs, bens]) => {
        setAccounts(accs);
        setBeneficiaries(bens);
        if (accs.length > 0) setFromAccountId(accs[0].id);
      },
    );
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Montant invalide");
      return;
    }
    if (!fromAccountId) {
      setError("Compte source requis");
      return;
    }
    if (mode === "interne" && !toAccountId) {
      setError("Compte destination requis");
      return;
    }
    if (mode === "interac" && !beneficiaryId) {
      setError("Bénéficiaire requis");
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    const amt = parseFloat(amount);
    setLoading(true);
    try {
      if (mode === "interne") {
        await internalTransfer({
          fromAccountId,
          toAccountId,
          amount: amt,
          description,
        });
        setMessage(
          `Virement de ${amt.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} effectué !`,
        );
      } else {
        await interacTransfer({
          fromAccountId,
          beneficiaryId,
          amount: amt,
          description,
        });
        setMessage(
          `Virement Interac de ${amt.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} effectué !`,
        );
      }
      setAmount("");
      setDescription("");
      setShowConfirm(false);
    } catch (e: any) {
      setError(e.message);
      setShowConfirm(false);
    }
    setLoading(false);
  };

  const handleCreateBeneficiary = async () => {
    if (!newBenefName.trim()) return;
    try {
      await createBeneficiary({
        clientId: id,
        name: newBenefName,
        email: newBenefEmail,
      });
      setNewBenefName("");
      setNewBenefEmail("");
      setShowNewBenef(false);
      const bens = await getBeneficiaries(id);
      setBeneficiaries(bens);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const allAccounts = accounts.filter(
    (a) =>
      a.category === "depenses" ||
      a.category === "epargne" ||
      a.type === "credit",
  );

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);
  const beneficiary = beneficiaries.find((b) => b.id === beneficiaryId);
  const amt = parseFloat(amount) || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link
        href={`/dashboard/client/${id}`}
        className="text-sm text-slate-500 hover:text-brand-800 transition-colors"
      >
        ← Retour à l'accueil
      </Link>

      <h1 className="text-4xl font-extrabold text-slate-900 font-display">
        Virement
      </h1>

      {/* Mode selector */}
      <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
        <button
          onClick={() => setMode("interne")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${mode === "interne" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Interne
        </button>
        <button
          onClick={() => setMode("interac")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${mode === "interac" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Interac
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Compte source */}
        <div>
          <label className="block text-sm font-extrabold font-display text-brand-steel mb-1.5 leading-normal tracking-wide">
            Compte source
          </label>
          <select
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-50 outline-none"
          >
            <option value="">Sélectionner un compte</option>
            {allAccounts
              .filter((a) => a.id !== toAccountId)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} —{" "}
                  {a.balance.toLocaleString("fr-CA", {
                    style: "currency",
                    currency: "CAD",
                  })}
                </option>
              ))}
          </select>
        </div>

        {mode === "interne" ? (
          <>
            <div>
              <label className="block text-sm font-extrabold font-display text-brand-steel mb-1.5 leading-normal tracking-wide">
                Compte destination
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-50 outline-none"
              >
                <option value="">Sélectionner un compte</option>
                {allAccounts
                  .filter((a) => a.id !== fromAccountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} —{" "}
                      {a.balance.toLocaleString("fr-CA", {
                        style: "currency",
                        currency: "CAD",
                      })}
                    </option>
                  ))}
              </select>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-extrabold font-display text-brand-steel mb-1.5 leading-normal tracking-wide">
              Bénéficiaire
            </label>
            <select
              value={beneficiaryId}
              onChange={(e) => setBeneficiaryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-50 outline-none"
            >
              <option value="">Sélectionner un bénéficiaire</option>
              {beneficiaries
                .filter((b) => !b.isFournisseur)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewBenef(!showNewBenef)}
              className="text-xs text-brand-800 mt-2 hover:underline cursor-pointer"
            >
              + Ajouter un bénéficiaire
            </button>
            {showNewBenef && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-3">
                <input
                  type="text"
                  value={newBenefName}
                  onChange={(e) => setNewBenefName(e.target.value)}
                  placeholder="Nom du bénéficiaire"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none"
                />
                <input
                  type="email"
                  value={newBenefEmail}
                  onChange={(e) => setNewBenefEmail(e.target.value)}
                  placeholder="Courriel (optionnel)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateBeneficiary}
                  className="btn-primary text-sm py-2 px-4"
                >
                  Ajouter
                </button>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-extrabold font-display text-brand-steel mb-1.5 leading-normal tracking-wide">
            Montant ($)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-50 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-extrabold font-display text-brand-steel mb-1.5 leading-normal tracking-wide">
            Description (optionnelle)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Paiement loyer"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-50 outline-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
            {message}
          </p>
        )}

        <button type="submit" className="w-full btn-primary py-3">
          {`Effectuer le virement ${mode === "interac" ? "Interac" : "interne"}`}
        </button>
      </form>

      <ConfirmModal
        open={showConfirm}
        title="Confirmer le virement"
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      >
        <p>
          Compte source : <strong>{fromAccount?.name}</strong>
        </p>
        {mode === "interne" ? (
          <p>
            Compte destination : <strong>{toAccount?.name}</strong>
          </p>
        ) : (
          <p>
            Bénéficiaire : <strong>{beneficiary?.name}</strong>
          </p>
        )}
        <p>
          Montant :{" "}
          <strong>
            {amt.toLocaleString("fr-CA", {
              style: "currency",
              currency: "CAD",
            })}
          </strong>
        </p>
        {description && <p>Description : {description}</p>}
      </ConfirmModal>
    </div>
  );
}
