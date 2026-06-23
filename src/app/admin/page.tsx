"use client";

/**
 * Page d'administration.
 *
 * Permet de modifier les paramètres globaux de la banque, de réinitialiser un
 * profil client individuel, et de réinitialiser l'ensemble des données.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getParameters, updateParameter, resetAllData, getClients, resetClient, getAdmins, createAdmin, deleteAdmin } from "@/lib/api";
import { getSession, logout } from "@/lib/auth";

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

  const load = () => {
    Promise.all([getParameters(), getClients(), getAdmins()]).then(([params, cls, adm]) => {
      setParameters(params);
      setClients(cls);
      setAdmins(adm);
      const vals: Record<string, string> = {};
      params.forEach((p) => { vals[p.key] = p.value; });
      setEditValues(vals);
    });
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
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Chargement...</div>;
  }

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

  const handleDeleteAdmin = async (id: string, email: string) => {
    const pwd = window.prompt(`Pour supprimer l'administrateur « ${email} », saisissez VOTRE mot de passe administrateur :`);
    if (!pwd) return;
    try {
      await deleteAdmin(id, { currentEmail, currentPassword: pwd });
      setMessage("Administrateur supprimé.");
      const adm = await getAdmins();
      setAdmins(adm);
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
        <button
          onClick={handleLogout}
          className="text-sm font-semibold text-slate-500 hover:text-brand-800 transition-colors"
        >
          Déconnexion
        </button>
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

      {/* Administrateurs */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Administrateurs</h2>

        {/* Liste des admins */}
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 mb-4">
          {admins.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">Aucun administrateur.</p>
          ) : (
            admins.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 text-sm">{a.email}</p>
                  <p className="text-xs text-slate-400">Administrateur</p>
                </div>
                <button
                  onClick={() => handleDeleteAdmin(a.id, a.email)}
                  disabled={admins.length <= 1}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={admins.length <= 1 ? "Impossible de supprimer le dernier administrateur" : "Supprimer"}
                >
                  Supprimer
                </button>
              </div>
            ))
          )}
        </div>

        {/* Ajout d'un admin */}
        <form onSubmit={handleCreateAdmin} className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-700 mb-3">Ajouter un administrateur</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-slate-500 mb-1">Courriel</label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin2@banque.ca"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-400"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-slate-500 mb-1">Mot de passe (min 8)</label>
              <input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-400"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-end mt-3 pt-3 border-t border-slate-100">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-slate-500 mb-1">Votre mot de passe (confirmation)</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Mot de passe de l'admin connecté"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-400"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-800 text-white rounded-lg text-sm font-semibold hover:bg-brand-900 transition-colors"
            >
              Ajouter
            </button>
          </div>
        </form>
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
