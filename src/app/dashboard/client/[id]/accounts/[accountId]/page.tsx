"use client";

/**
 * Page détail d'un compte.
 *
 * Affiche le solde et les informations du compte, son historique de
 * transactions, ses transactions planifiées et récurrentes. Pour une carte de
 * crédit, propose un formulaire de paiement depuis un compte chèques.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getAccount,
  getClientAccounts,
  getTransactions,
  getFutureTransactions,
  getRecurringTransactions,
  payCreditCard,
} from "@/lib/api";
import ConfirmModal from "@/components/common/ConfirmModal";

/** Composant de la page détail d'un compte (solde, historique, paiement de carte). */
export default function AccountDetailPage() {
  const { id, accountId } = useParams<{ id: string; accountId: string }>();
  const [account, setAccount] = useState<any>(null);
  const [clientAccounts, setClientAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [futureTxs, setFutureTxs] = useState<any[]>([]);
  const [recurringTxs, setRecurringTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payFromAccountId, setPayFromAccountId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!accountId) return;
    Promise.all([
      getAccount(accountId),
      getTransactions(accountId),
      getFutureTransactions(accountId),
      getRecurringTransactions(accountId),
    ])
      .then(([acc, txs, ftxs, rtxs]) => {
        setAccount(acc);
        setTransactions(txs);
        setFutureTxs(ftxs);
        setRecurringTxs(rtxs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accountId]);

  useEffect(() => {
    if (!id) return;
    getClientAccounts(id).then((accs) => {
      setClientAccounts(accs);
      const chequeAcc = accs.find((a: any) => a.type === "cheque");
      if (chequeAcc) setPayFromAccountId(chequeAcc.id);
    });
  }, [id]);

  const handlePayCredit = () => {
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0 || !payFromAccountId) return;
    setShowConfirm(true);
  };

  const handleConfirmPayCredit = async () => {
    const amt = parseFloat(payAmount);
    setPaying(true);
    try {
      await payCreditCard(accountId, {
        fromAccountId: payFromAccountId,
        amount: amt,
      });
      setPayMsg(
        `Paiement de ${amt.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} effectué !`,
      );
      setPayAmount("");
      setShowConfirm(false);
      // Refresh
      const [acc, txs] = await Promise.all([
        getAccount(accountId),
        getTransactions(accountId),
      ]);
      setAccount(acc);
      setTransactions(txs);
    } catch (e: any) {
      setPayMsg(`Erreur : ${e.message}`);
      setShowConfirm(false);
    }
    setPaying(false);
  };

  if (loading)
    return (
      <div className="text-center py-20 text-slate-400">Chargement...</div>
    );
  if (!account)
    return (
      <div className="text-center py-20 text-slate-400">Compte introuvable</div>
    );

  const isCredit = account.type === "credit";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        href={`/dashboard/client/${id}/comptes`}
        className="text-sm text-slate-500 hover:text-brand-800 transition-colors"
      >
        ← Retour aux comptes
      </Link>

      {/* En-tête du compte */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 font-display">
              {account.name}
            </h1>
            <p className="text-slate-400 text-sm">
              {account.accountNumber} · {account.type}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Solde
            </p>
            <p className="text-3xl font-extrabold font-display text-slate-900">
              {account.balance.toLocaleString("fr-CA", {
                style: "currency",
                currency: "CAD",
              })}
            </p>
            {account.creditLimit > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Limite :{" "}
                {account.creditLimit.toLocaleString("fr-CA", {
                  style: "currency",
                  currency: "CAD",
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Paiement carte de crédit */}
      {isCredit && (
        <div className="card p-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-brand-steel font-display mb-4">
            Payer la carte de crédit
          </h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-slate-500 mb-1">
                Compte à débiter
              </label>
              <select
                value={payFromAccountId}
                onChange={(e) => setPayFromAccountId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-50 outline-none"
              >
                <option value="">Sélectionner un compte</option>
                {clientAccounts
                  .filter((a) => a.type === "cheque")
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
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-slate-500 mb-1">
                Montant
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-50 outline-none"
              />
            </div>
            <button
              onClick={handlePayCredit}
              disabled={paying}
              className="btn-primary px-6 py-2.5"
            >
              {paying ? "Paiement..." : "Payer"}
            </button>
          </div>
          {payMsg && (
            <p
              className={`text-sm mt-2 ${payMsg.startsWith("Erreur") ? "text-red-500" : "text-emerald-600"}`}
            >
              {payMsg}
            </p>
          )}
        </div>
      )}

      <ConfirmModal
        open={showConfirm}
        title="Confirmer le paiement"
        loading={paying}
        onConfirm={handleConfirmPayCredit}
        onCancel={() => setShowConfirm(false)}
      >
        <p>
          Compte à débiter :{" "}
          <strong>
            {clientAccounts.find((a) => a.id === payFromAccountId)?.name}
          </strong>
        </p>
        <p>
          Carte de crédit : <strong>{account?.name}</strong>
        </p>
        <p>
          Montant :{" "}
          <strong>
            {(parseFloat(payAmount) || 0).toLocaleString("fr-CA", {
              style: "currency",
              currency: "CAD",
            })}
          </strong>
        </p>
      </ConfirmModal>

      {/* Transactions futures */}
      {futureTxs.length > 0 && (
        <section>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-brand-steel font-display mb-4">
            Transactions planifiées
          </h2>
          <div className="card divide-y divide-slate-100">
            {futureTxs.map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-bold font-display text-slate-900">
                    {tx.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    Prévue le {tx.scheduledDate}{" "}
                    {tx.isRecurring ? `· ${tx.frequency}` : ""}
                  </p>
                </div>
                <p className="font-extrabold text-slate-900">
                  {tx.type === "credit" ? "+" : "-"}
                  {tx.amount.toLocaleString("fr-CA", {
                    style: "currency",
                    currency: "CAD",
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transactions récurrentes */}
      {recurringTxs.length > 0 && (
        <section>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-brand-steel font-display mb-4">
            Transactions récurrentes
          </h2>
          <div className="card divide-y divide-slate-100">
            {recurringTxs.map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-bold font-display text-slate-900">
                    {tx.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    Fréquence : {tx.frequency}
                  </p>
                </div>
                <p className="font-extrabold text-slate-900">
                  {tx.type === "credit" ? "+" : "-"}
                  {tx.amount.toLocaleString("fr-CA", {
                    style: "currency",
                    currency: "CAD",
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Historique */}
      <section>
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-brand-steel font-display mb-4">
          Historique des transactions
        </h2>
        {transactions.length === 0 ? (
          <p className="text-slate-400 text-sm">Aucune transaction.</p>
        ) : (
          <div className="card divide-y divide-slate-100">
            {transactions.map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-bold font-display text-slate-900 text-sm">
                    {tx.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    {tx.date} · {tx.category}
                  </p>
                </div>
                <p className="font-extrabold text-slate-900">
                  {tx.type === "credit" ? "+" : "-"}
                  {tx.amount.toLocaleString("fr-CA", {
                    style: "currency",
                    currency: "CAD",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
