"use client";

/**
 * Page de vérification du courriel.
 *
 * Après l'inscription, le client arrive ici (avec son courriel en paramètre) et
 * saisit le code à 6 chiffres reçu par email. Une fois vérifié, il est redirigé
 * vers la connexion. Un bouton permet de renvoyer un nouveau code.
 */
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { verifyEmail, resendVerification } from "@/lib/api";

/** Contenu de la page (séparé pour être encapsulé dans un <Suspense>). */
function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Entrez le code à 6 chiffres reçu par courriel.");
      return;
    }
    setLoading(true);
    try {
      await verifyEmail(email, code.trim());
      router.push("/login?verified=1");
    } catch (err: any) {
      setError(err.message || "Vérification impossible.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    try {
      const { alreadyVerified } = await resendVerification(email);
      setMessage(
        alreadyVerified
          ? "Ce courriel est déjà vérifié. Vous pouvez vous connecter."
          : "Un nouveau code a été envoyé à votre courriel."
      );
    } catch (err: any) {
      setError(err.message || "Envoi impossible.");
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-white/60 p-8 sm:p-10">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-display mb-4">
          Vérification
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          Entrez le code à 6 chiffres envoyé à{" "}
          <span className="font-medium text-slate-700">{email || "votre courriel"}</span>.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4" noValidate>
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
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-50 text-center text-2xl tracking-[0.4em] font-display"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-brand-800 text-white rounded-xl font-semibold hover:bg-brand-950 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Vérification..." : "Vérifier mon courriel"}
        </button>
      </form>

      <div className="text-center mt-6 space-y-2">
        <button
          type="button"
          onClick={handleResend}
          className="text-sm font-semibold text-brand-800 hover:text-brand-950 cursor-pointer"
        >
          Renvoyer le code
        </button>
        <p className="text-xs text-slate-400">
          <Link href="/login" className="hover:text-brand-800">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

/** Page de vérification (encapsule le contenu dans <Suspense> pour useSearchParams). */
export default function VerifyPage() {
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
          <VerifyContent />
        </Suspense>
      </div>
    </main>
  );
}
