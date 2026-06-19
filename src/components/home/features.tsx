interface Feature {
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    title: "Virements instantanés",
    description:
      "Envoyez de l'argent à n'importe qui au Canada en quelques secondes, 24h/24, 7j/7.",
  },
  {
    title: "Carte virtuelle & physique",
    description:
      "Une carte Visa incluse dès l'ouverture. Générez autant de cartes virtuelles que vous voulez.",
  },
  {
    title: "Tableau de bord en temps réel",
    description:
      "Suivez chaque transaction au moment où elle se produit. Catégorisation automatique mensuelle.",
  },
  {
    title: "Épargne automatique",
    description:
      "Arrondi à l'achat, virement récurrent, objectif avec suivi visuel.",
  },
  {
    title: "Change sans frais",
    description:
      "USD, EUR et plus — au taux réel, sans commission cachée. Disponible dans 150+ pays.",
  },
  {
    title: "Intégrations",
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ title, description }, i) => (
            <div
              key={title}
              className="group p-8 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200 flex flex-col"
            >
              <span
                className="text-xs font-semibold tracking-widest mb-6 block"
                style={{ color: "#1F4E6B" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="w-6 h-px mb-6" style={{ backgroundColor: "#1F4E6B" }} />

              <h3
                className="font-bold text-lg mb-3 leading-snug"
                style={{ fontFamily: "var(--font-syne)", color: "#081A2E" }}
              >
                {title}
              </h3>
              <p className="text-sm leading-relaxed mt-auto" style={{ color: "#7B9BAD" }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
