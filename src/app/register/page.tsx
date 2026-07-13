"use client";

/**
 * Page d'ouverture de compte (création d'un profil client).
 *
 * Formulaire validé côté client avec react-hook-form (champs requis, formats
 * courriel / téléphone / code postal). À la soumission, crée le client via
 * l'API puis redirige vers son tableau de bord.
 */
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import Logo from "@/components/common/Logo";
import { createClient } from "@/lib/api";
import { useState } from "react";

const PROVINCES = [
  "QC",
  "ON",
  "BC",
  "AB",
  "MB",
  "SK",
  "NS",
  "NB",
  "NL",
  "PE",
  "YT",
  "NT",
  "NU",
];

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  dateNaissance: string;
};

/** Composant de la page d'inscription (formulaire de création de client). */
export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      city: "",
      province: "QC",
      postalCode: "",
      dateNaissance: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    setSubmitting(true);
    try {
      await createClient(data);
      // Le compte doit d'abord être vérifié par courriel : on redirige vers
      // l'écran de saisie du code.
      router.push(`/verify?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      setServerError(err.message || "Une erreur est survenue.");
      setSubmitting(false);
    }
  };

  const fieldClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border outline-none transition-colors focus:ring-2 focus:ring-brand-50 ${
      hasError
        ? "border-red-400 focus:border-red-400"
        : "border-slate-200 focus:border-brand-600"
    }`;

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#dce6ee" }}
    >
      <header className="px-6 py-5">
        <Logo variant="dark" size="md" />
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm border border-white/60 p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mb-4">
              Ouvrir un compte
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Quelques informations et votre profil est prêt en 2 minutes.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  placeholder="Alice"
                  className={fieldClass(!!errors.firstName)}
                  {...register("firstName", { required: "Prénom requis." })}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  placeholder="Tremblay"
                  className={fieldClass(!!errors.lastName)}
                  {...register("lastName", { required: "Nom requis." })}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Courriel
                </label>
                <input
                  type="email"
                  placeholder="alice@email.ca"
                  className={fieldClass(!!errors.email)}
                  {...register("email", {
                    required: "Courriel requis.",
                    pattern: {
                      value:
                        /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
                      message: "Courriel invalide.",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  placeholder="514-555-0101"
                  className={fieldClass(!!errors.phone)}
                  {...register("phone", {
                    required: "Téléphone requis.",
                    pattern: {
                      value: /^(\(\d{3}\)\s?|\d{3}[-.\s]?)\d{3}[-.\s]?\d{4}$/,
                      message:
                        "Format invalide (ex: 514-555-0101 ou (514) 555-0101).",
                    },
                  })}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                placeholder="Au moins 8 caractères"
                className={fieldClass(!!errors.password)}
                {...register("password", {
                  required: "Mot de passe requis.",
                  minLength: { value: 8, message: "Au moins 8 caractères." },
                })}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Adresse
              </label>
              <input
                type="text"
                placeholder="123 Rue Saint-Jacques"
                className={fieldClass(!!errors.address)}
                {...register("address", { required: "Adresse requise." })}
              />
              {errors.address && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  placeholder="Montréal"
                  className={fieldClass(!!errors.city)}
                  {...register("city", { required: "Ville requise." })}
                />
                {errors.city && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.city.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Province
                </label>
                <select className={fieldClass(false)} {...register("province")}>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Code postal
                </label>
                <input
                  type="text"
                  placeholder="H2Y 1L9"
                  className={fieldClass(!!errors.postalCode)}
                  {...register("postalCode", {
                    required: "Code postal requis.",
                    pattern: {
                      value: /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/,
                      message: "Format invalide (ex: H2Y 1L9).",
                    },
                  })}
                />
                {errors.postalCode && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.postalCode.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date de naissance
              </label>
              <input
                type="date"
                className={fieldClass(!!errors.dateNaissance)}
                {...register("dateNaissance", {
                  required: "Date de naissance requise.",
                })}
              />
              {errors.dateNaissance && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.dateNaissance.message}
                </p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-brand-800 text-white rounded-xl font-semibold hover:bg-brand-950 transition-colors disabled:opacity-50 mt-2 cursor-pointer"
            >
              {submitting ? "Création du compte..." : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Vous avez déjà un profil ?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-800 hover:text-brand-950"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
