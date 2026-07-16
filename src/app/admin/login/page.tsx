"use client";

/**
 * Page de connexion administrateur.
 *
 * Espace séparé de la connexion client : formulaire courriel + mot de passe
 * vérifié contre le compte admin. En cas de succès, enregistre la session admin
 * puis redirige vers la page d'administration.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { loginAdmin } from "@/lib/api";
import { setAdminSession } from "@/lib/auth";

/** Composant de la page de connexion administrateur. */
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Veuillez saisir votre courriel et votre mot de passe.");
      return;
    }
    setLoading(true);
    try {
      const { email: adminEmail, token } = await loginAdmin(email.trim(), password);
      setAdminSession(adminEmail, token);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Connexion impossible.");
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0E2A47" }}
    >
      <header className="px-6 py-5">
        <Logo variant="light" size="md" />
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mb-4">
              Administration
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Espace réservé à l'administrateur.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Courriel
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@banque.ca"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-50"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-800 text-white rounded-xl font-semibold hover:bg-brand-950 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            <Link
              href="/login"
              className="font-semibold text-brand-800 hover:text-brand-950"
            >
              ← Connexion client
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
