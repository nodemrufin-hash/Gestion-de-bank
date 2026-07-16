"use client";

/**
 * Page « mot de passe oublié ».
 *
 * Deux étapes : (1) le client saisit son courriel et reçoit un code à 6
 * chiffres ; (2) il saisit ce code et son nouveau mot de passe. Une fois le
 * mot de passe changé, il est redirigé vers la connexion.
 */
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { forgotPassword, resetPassword } from "@/lib/api";

/** Contenu de la page (séparé pour être encapsulé dans un <Suspense>). */
function ForgotPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fieldClass =
    "w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-50";

  /** Étape 1 : demander l'envoi du code. */
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Veuillez saisir votre courriel.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setStep("code");
      setMessage(
        "Si un compte existe pour cette adresse, un code vient d'y être envoyé.",
      );
    } catch (err: any) {
      setError(err.message || "Envoi impossible.");
    }
    setLoading(false);
  };

  /** Étape 2 : vérifier le code et enregistrer le nouveau mot de passe. */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Entrez le code à 6 chiffres reçu par courriel.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim(), code.trim(), newPassword);
      router.push("/login?reset=1");
    } catch (err: any) {
      setError(err.message || "Réinitialisation impossible.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-white/60 p-8 sm:p-10">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-display mb-4">
          Mot de passe oublié
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          {step === "email"
            ? "Saisissez votre courriel : nous vous enverrons un code de vérification."
            : "Entrez le code reçu et choisissez un nouveau mot de passe."}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={handleSendCode} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Courriel
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice.tremblay@email.ca"
              className={fieldClass}
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
            {loading ? "Envoi..." : "Envoyer le code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Code de vérification
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className={`${fieldClass} text-center text-2xl tracking-[0.4em] font-display`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Au moins 8 caractères"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez le mot de passe"
              className={fieldClass}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
          {message && !error && (
            <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-800 text-white rounded-xl font-semibold hover:bg-brand-950 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Enregistrement..." : "Changer mon mot de passe"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError("");
              setMessage("");
            }}
            className="w-full text-sm font-semibold text-brand-800 hover:text-brand-950 cursor-pointer"
          >
            Utiliser une autre adresse
          </button>
        </form>
      )}

      <p className="text-center text-xs text-slate-400 mt-6">
        <Link href="/login" className="hover:text-brand-800">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}

/** Page « mot de passe oublié » (Suspense requis pour useSearchParams). */
export default function ForgotPasswordPage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#dce6ee" }}
    >
      <header className="px-6 py-5">
        <Logo variant="dark" size="md" />
      </header>
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <Suspense fallback={<div className="text-slate-400">Chargement...</div>}>
          <ForgotPasswordContent />
        </Suspense>
      </div>
    </main>
  );
}
