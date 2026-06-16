"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { createClient } from "@/lib/api";

const PROVINCES = ["QC", "ON", "BC", "AB", "MB", "SK", "NS", "NB", "NL", "PE", "YT", "NT", "NU"];

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "QC",
  postalCode: "",
  dateNaissance: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const update = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "Prénom requis.";
    if (!form.lastName.trim()) next.lastName = "Nom requis.";
    if (!form.email.trim()) next.email = "Courriel requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Courriel invalide.";
    if (!form.phone.trim()) next.phone = "Téléphone requis.";
    if (!form.address.trim()) next.address = "Adresse requise.";
    if (!form.city.trim()) next.city = "Ville requise.";
    if (!form.postalCode.trim()) next.postalCode = "Code postal requis.";
    if (!form.dateNaissance.trim()) next.dateNaissance = "Date de naissance requise.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { id } = await createClient(form);
      router.push(`/dashboard/client/${id}`);
    } catch (err: any) {
      setServerError(err.message || "Une erreur est survenue.");
      setSubmitting(false);
    }
  };

  const fieldClass = (field: string) =>
    `w-full px-4 py-2.5 rounded-xl border outline-none transition-colors focus:ring-2 focus:ring-brand-100 ${
      errors[field] ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-brand-400"
    }`;

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#EDE8D0" }}>
      <header className="px-6 py-5">
        <Logo variant="dark" size="md" />
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm border border-white/60 p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "var(--font-syne)" }}>
              Ouvrir un compte
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Quelques informations et votre profil est prêt en 2 minutes.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                <input type="text" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className={fieldClass("firstName")} placeholder="Alice" />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                <input type="text" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className={fieldClass("lastName")} placeholder="Tremblay" />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Courriel</label>
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={fieldClass("email")} placeholder="alice@email.ca" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={fieldClass("phone")} placeholder="514-555-0101" />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
              <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} className={fieldClass("address")} placeholder="123 Rue Saint-Jacques" />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
                <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)} className={fieldClass("city")} placeholder="Montréal" />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Province</label>
                <select value={form.province} onChange={(e) => update("province", e.target.value)} className={fieldClass("province")}>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code postal</label>
                <input type="text" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} className={fieldClass("postalCode")} placeholder="H2Y 1L9" />
                {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date de naissance</label>
              <input type="date" value={form.dateNaissance} onChange={(e) => update("dateNaissance", e.target.value)} className={fieldClass("dateNaissance")} />
              {errors.dateNaissance && <p className="text-xs text-red-500 mt-1">{errors.dateNaissance}</p>}
            </div>

            {serverError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-brand-800 text-white rounded-xl font-semibold hover:bg-brand-900 transition-colors disabled:opacity-50 mt-2"
            >
              {submitting ? "Création du compte..." : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Vous avez déjà un profil ?{" "}
            <Link href="/login" className="font-semibold text-brand-800 hover:text-brand-900">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
