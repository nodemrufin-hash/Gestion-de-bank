"use client";

/**
 * Page d'administration.
 *
 * Permet de modifier les paramètres globaux de la banque, de réinitialiser un
 * profil client individuel, et de réinitialiser l'ensemble des données.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getParameters,
  updateParameter,
  resetAllData,
  getClients,
  resetClient,
  deleteClient,
  getAdmins,
  createAdmin,
  deleteAdmin,
} from "@/lib/api";
import { getSession, logout } from "@/lib/auth";
import ConfirmModal from "@/components/common/ConfirmModal";

/** Composant de la page d'administration (paramètres globaux et réinitialisations). */
export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [parameters, setParameters] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fenêtre modale de confirmation (remplace window.confirm / window.prompt).
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    needsPassword: boolean;
    onConfirm: (password: string) => Promise<void>;
  } | null>(null);
  const [modalPwd, setModalPwd] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const closeModal = () => {
    setConfirmState(null);
    setModalPwd("");
    setModalError("");
    setModalLoading(false);
  };

  const runModalConfirm = async () => {
    if (!confirmState) return;
    if (confirmState.needsPassword && !modalPwd) {
      setModalError("Veuillez saisir votre mot de passe administrateur.");
      return;
    }
    setModalLoading(true);
    setModalError("");
    try {
      await confirmState.onConfirm(modalPwd);
      closeModal();
    } catch (e: any) {
      setModalError(e.message || "Une erreur est survenue.");
      setModalLoading(false);
    }
  };

  const load = () => {
    Promise.all([getParameters(), getClients(), getAdmins()]).then(
      ([params, cls, adm]) => {
        setParameters(params);
        setClients(cls);
        setAdmins(adm);
        const vals: Record<string, string> = {};
        params.forEach((p) => {
          vals[p.key] = p.value;
        });
        setEditValues(vals);
      },
    );
  };

  // Garde d'authentification : réservé à l'administrateur connecté.
  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "admin") {
      router.replace("/admin/login");
      return;
    }
    setCurrentEmail(session.email);
    setAuthorized(true);
    load();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  if (!authorized) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-500">
        Chargement...
      </main>
    );
  }

  const handleSave = async (key: string) => {
    try {
      await updateParameter(key, editValues[key]);
      setMessage(`Paramètre "${key}" mis à jour.`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleResetAll = () => {
    setMessage("");
    setError("");
    setConfirmState({
      title: "Réinitialiser toutes les données",
      message:
        "Efface toutes les données et régénère les profils avec leurs transactions initiales. Cette action est irréversible.",
      confirmLabel: "Tout réinitialiser",
      needsPassword: false,
      onConfirm: async () => {
        await resetAllData();
        setMessage("Toutes les données ont été réinitialisées.");
        load();
      },
    });
  };

  const handleResetClient = (clientId: string, name: string) => {
    setMessage("");
    setError("");
    setConfirmState({
      title: "Réinitialiser le profil",
      message: `Réinitialiser le profil de « ${name} » ? Ses données (comptes, transactions...) seront effacées, mais le profil est conservé.`,
      confirmLabel: "Réinitialiser",
      needsPassword: false,
      onConfirm: async () => {
        await resetClient(clientId);
        setMessage("Profil client réinitialisé.");
      },
    });
  };

  const handleDeleteClient = (clientId: string, name: string) => {
    setMessage("");
    setError("");
    setConfirmState({
      title: "Supprimer le client",
      message: `Supprimer définitivement « ${name} » et toutes ses données ? Cette action est irréversible. Saisissez votre mot de passe administrateur pour confirmer.`,
      confirmLabel: "Supprimer",
      needsPassword: true,
      onConfirm: async (password) => {
        await deleteClient(clientId, {
          currentEmail,
          currentPassword: password,
        });
        setMessage(`Client « ${name} » supprimé.`);
        const cls = await getClients();
        setClients(cls);
      },
    });
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!confirmPassword) {
      setError("Veuillez confirmer avec votre mot de passe administrateur.");
      return;
    }
    try {
      await createAdmin({
        email: newAdminEmail.trim(),
        password: newAdminPassword,
        currentEmail,
        currentPassword: confirmPassword,
      });
      setMessage(`Administrateur « ${newAdminEmail.trim()} » créé.`);
      setNewAdminEmail("");
      setNewAdminPassword("");
      setConfirmPassword("");
      const adm = await getAdmins();
      setAdmins(adm);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteAdmin = (id: string, email: string) => {
    setMessage("");
    setError("");
    setConfirmState({
      title: "Supprimer l'administrateur",
      message: `Supprimer l'administrateur « ${email} » ? Saisissez votre mot de passe administrateur pour confirmer.`,
      confirmLabel: "Supprimer",
      needsPassword: true,
      onConfirm: async (password) => {
        await deleteAdmin(id, { currentEmail, currentPassword: password });
        setMessage("Administrateur supprimé.");
        const adm = await getAdmins();
        setAdmins(adm);
      },
    });
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
    // <main> : repère principal de la page, attendu par les lecteurs d'écran.
    <main className="max-w-4xl mx-auto space-y-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 font-display">
            Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Paramètres globaux de l'application
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-semibold text-slate-500 hover:text-brand-800 transition-colors cursor-pointer"
        >
          Déconnexion
        </button>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Paramètres */}
      <section>
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-brand-steel font-display mb-4">
          Paramètres
        </h2>
        <div className="card divide-y divide-slate-100">
          {parameters.map((p) => (
            <div key={p.key} className="p-4 flex items-center gap-4">
              <label
                htmlFor={`param-${p.key}`}
                className="text-sm font-bold font-display text-slate-900 flex-1"
              >
                {paramLabels[p.key] || p.key}
              </label>
              <input
                id={`param-${p.key}`}
                type="text"
                value={editValues[p.key] || ""}
                onChange={(e) =>
                  setEditValues((prev) => ({
                    ...prev,
                    [p.key]: e.target.value,
                  }))
                }
                className="w-40 px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-600"
              />
              <button
                onClick={() => handleSave(p.key)}
                className="btn-primary text-xs py-1.5 px-4"
              >
                Sauvegarder
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Administrateurs */}
      <section>
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-brand-steel font-display mb-4">
          Administrateurs
        </h2>

        {/* Liste des admins */}
        <div className="card divide-y divide-slate-100 mb-4">
          {admins.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Aucun administrateur.</p>
          ) : (
            admins.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold font-display text-slate-900 text-sm">
                    {a.email}
                  </p>
                  <p className="text-xs text-slate-500">Administrateur</p>
                </div>
                <button
                  onClick={() => handleDeleteAdmin(a.id, a.email)}
                  disabled={admins.length <= 1}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title={
                    admins.length <= 1
                      ? "Impossible de supprimer le dernier administrateur"
                      : "Supprimer"
                  }
                >
                  Supprimer
                </button>
              </div>
            ))
          )}
        </div>

        {/* Ajout d'un admin */}
        <form onSubmit={handleCreateAdmin} className="card p-5">
          <p className="text-sm font-bold font-display text-slate-900 mb-3">
            Ajouter un administrateur
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="newAdminEmail"
                className="block text-sm font-extrabold font-display text-brand-steel mb-1 leading-relaxed tracking-wide"
              >
                Courriel
              </label>
              <input
                id="newAdminEmail"
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin2@banque.ca"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-600"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label
                htmlFor="newAdminPassword"
                className="block text-sm font-extrabold font-display text-brand-steel mb-1 leading-relaxed tracking-wide"
              >
                Mot de passe (min 8)
              </label>
              <input
                id="newAdminPassword"
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-600"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-end mt-3 pt-3 border-t border-slate-100">
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-extrabold font-display text-brand-steel mb-1 leading-relaxed tracking-wide"
              >
                Votre mot de passe (confirmation)
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Mot de passe de l'admin connecté"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-600"
              />
            </div>
            <button type="submit" className="btn-primary text-sm py-2 px-5">
              Ajouter
            </button>
          </div>
        </form>
      </section>

      {/* Clients - réinitialisation */}
      <section>
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-brand-steel font-display mb-4">
          Profils clients
        </h2>
        <div className="card divide-y divide-slate-100">
          {clients.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold font-display text-slate-900 text-sm">
                  {c.firstName} {c.lastName}
                </p>
                <p className="text-xs text-slate-500">{c.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleResetClient(c.id, `${c.firstName} ${c.lastName}`)
                  }
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() =>
                    handleDeleteClient(c.id, `${c.firstName} ${c.lastName}`)
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Réinitialisation globale */}
      <section className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <h2 className="text-xl font-extrabold font-display text-red-800 mb-2">
          Réinitialisation globale
        </h2>
        <p className="text-sm text-red-600 mb-4">
          Efface toutes les données et régénère les profils avec leurs
          transactions initiales.
        </p>
        <button
          onClick={handleResetAll}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors cursor-pointer"
        >
          Réinitialiser toutes les données
        </button>
      </section>

      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title || ""}
        confirmLabel={confirmState?.confirmLabel || "Confirmer"}
        loading={modalLoading}
        onConfirm={runModalConfirm}
        onCancel={closeModal}
      >
        <p>{confirmState?.message}</p>
        {confirmState?.needsPassword && (
          <input
            // aria-label : le champ n'a pas de libellé visible, le texte de la
            // modale au-dessus tenant lieu d'explication.
            aria-label="Votre mot de passe administrateur"
            type="password"
            value={modalPwd}
            onChange={(e) => setModalPwd(e.target.value)}
            placeholder="Votre mot de passe administrateur"
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-600"
          />
        )}
        {modalError && <p className="text-sm text-red-500">{modalError}</p>}
      </ConfirmModal>
    </main>
  );
}
