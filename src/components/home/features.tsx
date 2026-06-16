import { ReactNode } from "react";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  accent: string;
}

const features: Feature[] = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Virements instantanés",
    description:
      "Envoyez de l'argent à n'importe qui au Canada en quelques secondes, 24h/24, 7j/7. Aucun délai, aucun frais.",
    accent: "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect
          x="2"
          y="5"
          width="20"
          height="14"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M6 15h4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    title: "Carte virtuelle & physique",
    description:
      "Une carte Visa incluse dès l'ouverture. Générez autant de cartes virtuelles que vous voulez pour vos achats en ligne.",
    accent: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    title: "Tableau de bord en temps réel",
    description:
      "Suivez chaque transaction au moment où elle se produit. Catégorisation automatique et analyses claires chaque mois.",
    accent: "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 12h8M12 8v8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    title: "Épargne automatique",
    description:
      "Définissez des règles d'épargne intelligentes : arrondi à l'achat, virement récurrent, objectif avec suivi visuel.",
    accent: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M3.6 9h16.8M3.6 15h16.8"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9c2.5-3 4-5.5 4-9s-1.5-6-4-9z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
    title: "Change sans frais",
    description:
      "Voyagez ou payez en USD, EUR et plus — au taux réel, sans commission cachée. Disponible dans 150+ pays.",
    accent: "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L2 7l10 5 10-5-10-5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M2 17l10 5 10-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M2 12l10 5 10-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Intégrations intelligentes",
    description:
      "Connectez Zeph à vos outils — comptabilité, fiscalité, REER — pour une gestion financière unifiée.",
    accent: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-28 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-16">
          <p className="text-brand-800 dark:text-brand-300 text-sm font-semibold uppercase tracking-widest mb-3">
            Fonctionnalités
          </p>
          <h2
            className="text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-4"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Tout ce qu'une banque devrait faire — sans le reste.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Pas de succursales à chercher, pas de formulaires à imprimer. Juste
            une expérience bancaire qui respecte votre temps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon, title, description, accent }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-md hover:shadow-brand-50 dark:hover:shadow-brand-950 transition-all duration-300 bg-white dark:bg-slate-900"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 ${accent}`}
              >
                {icon}
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-base">
                {title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
