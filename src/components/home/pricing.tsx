import Button from "@/components/common/Button";

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: "Essentiel",
    price: "0 $",
    period: "/ mois",
    description: "Tout ce qu'il faut pour gérer son argent au quotidien.",
    features: [
      "Compte chèques et compte épargne",
      "Virements internes et Interac illimités",
      "Paiement de factures",
      "Carte virtuelle incluse",
    ],
  },
  {
    name: "Plus",
    price: "5 $",
    period: "/ mois",
    description: "Pour ceux qui veulent faire fructifier leur épargne.",
    features: [
      "Tout le forfait Essentiel",
      "Objectifs d'épargne illimités",
      "Alertes de solde faible personnalisées",
      "Catégorisation automatique des dépenses",
    ],
    highlighted: true,
  },
  {
    name: "Affaires",
    price: "15 $",
    period: "/ mois",
    description: "Pensé pour les travailleurs autonomes et PME.",
    features: [
      "Tout le forfait Plus",
      "Comptes investissement (CELI, REER)",
      "Gestion de plusieurs bénéficiaires",
      "Support prioritaire",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="tarifs" className="py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-16">
          <p className="text-brand-800 text-sm font-semibold uppercase tracking-widest mb-3">
            Tarifs
          </p>
          <h2
            className="text-4xl font-bold text-slate-900 leading-tight mb-4 font-display"
          >
            Des tarifs simples, sans frais cachés.
          </h2>
          <p className="text-slate-500 leading-relaxed">
            Choisissez le forfait qui vous convient. Aucun engagement, aucune
            surprise sur votre relevé.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col transition-all duration-300 ${
                plan.highlighted
                  ? "border-brand-800 shadow-lg shadow-brand-50 scale-[1.02]"
                  : "border-slate-200 hover:border-brand-300 hover:shadow-md"
              }`}
            >
              {plan.highlighted && (
                <span className="self-start text-xs font-semibold uppercase tracking-wider bg-brand-800 text-white px-3 py-1 rounded-full mb-4">
                  Populaire
                </span>
              )}
              <h3 className="font-semibold text-slate-900 text-lg mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span
                  className="text-4xl font-bold text-slate-900 font-display"
                >
                  {plan.price}
                </span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </div>
              <p className="text-sm text-slate-500 mb-6">{plan.description}</p>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0 text-brand-800">
                      <path d="M5 12l5 5 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                href="/register"
                variant={plan.highlighted ? "primary" : "secondary"}
                size="md"
                fullWidth
              >
                Choisir ce forfait
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
