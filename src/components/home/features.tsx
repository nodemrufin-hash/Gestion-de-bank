import { ReactNode } from "react";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
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
      "Envoyez de l'argent à n'importe qui au Canada en quelques secondes, 24h/24, 7j/7.",
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
      "Une carte Visa incluse dès l'ouverture. Générez autant de cartes virtuelles que vous voulez.",
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
      "Suivez chaque transaction au moment où elle se produit. Catégorisation automatique mensuelle.",
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
      "Arrondi à l'achat, virement récurrent, objectif avec suivi visuel.",
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
      "USD, EUR et plus — au taux réel, sans commission cachée. Disponible dans 150+ pays.",
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
          d="M2 17l10 5 10-5M2 12l10 5 10-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Intégrations intelligentes",
    description: "Connectez Libéo à vos outils — comptabilité, fiscalité, REER.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-16 sm:py-24 lg:py-28"
      style={{ backgroundColor: "#F2F5F7" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-xl mb-10 sm:mb-16 mx-auto text-center">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ color: "#1F4E6B" }}
          >
            Fonctionnalités
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold leading-tight mb-4"
            style={{ fontFamily: "var(--font-syne)", color: "#081A2E" }}
          >
            Tout ce qu'une banque devrait faire — sans le reste.
          </h2>
          <p className="leading-relaxed" style={{ color: "#9FB8C9" }}>
            Pas de succursales à chercher, pas de formulaires à imprimer.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map(({ icon, title, description }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl bg-white border border-slate-100 hover:shadow-md transition-all duration-300"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: "#F2F5F7", color: "#1F4E6B" }}
              >
                {icon}
              </div>
              <h3
                className="font-semibold mb-2 text-base"
                style={{ color: "#081A2E" }}
              >
                {title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#9FB8C9" }}
              >
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
