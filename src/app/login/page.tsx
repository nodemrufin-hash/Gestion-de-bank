"use client";

/**
 * Page de connexion client.
 *
 * Formulaire courriel + mot de passe. En cas de succès, enregistre la session
 * client puis redirige vers le profil du client. Un lien distinct mène à la
 * connexion administrateur.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { loginClient } from "@/lib/api";
import { setClientSession } from "@/lib/auth";

/** Composant de la page de connexion client (courriel + mot de passe). */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // Messages de confirmation après une vérification (?verified=1) ou une
  // réinitialisation du mot de passe (?reset=1).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") {
      setNotice("Votre courriel est vérifié. Vous pouvez maintenant vous connecter.");
    } else if (params.get("reset") === "1") {
      setNotice("Votre mot de passe a été modifié. Connectez-vous avec le nouveau.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Veuillez saisir votre courriel et votre mot de passe.");
      return;
    }
    setLoading(true);
    try {
      const { client, token } = await loginClient(email.trim(), password);
      setClientSession(client, token);
      router.push(`/dashboard/client/${client.id}`);
    } catch (err: any) {
      // Compte non vérifié : rediriger vers la saisie du code.
      if (err.info?.needsVerification) {
        router.push(`/verify?email=${encodeURIComponent(err.info.email || email.trim())}`);
        return;
      }
      setError(err.message || "Connexion impossible.");
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#dce6ee" }}
    >
      <header className="px-6 py-5">
        <Logo variant="dark" size="md" />
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-white/60 p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-display mb-4">
              Connexion
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Accédez à vos comptes avec votre courriel.
            </p>
          </div>

          {notice && (
            <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-4">
              {notice}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Courriel
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice.tremblay@email.ca"
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
              <p className="text-right mt-1.5">
                <Link
                  href={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
                  className="text-xs font-semibold text-brand-800 hover:text-brand-950"
                >
                  Mot de passe oublié ?
                </Link>
              </p>
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
            Pas encore de profil ?{" "}
            <Link
              href="/register"
              className="font-semibold text-brand-800 hover:text-brand-950"
            >
              Ouvrir un compte
            </Link>
          </p>
          <p className="text-center text-xs text-slate-400 mt-3">
            <Link href="/admin/login" className="hover:text-brand-800">
              Accès administrateur
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
