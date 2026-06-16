import Button from "@/components/common/Button";

const stats = [
  { value: "0 $", label: "de frais cachés" },
  { value: "2 min", label: "pour ouvrir un compte" },
  { value: "150+", label: "pays couverts" },
];

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ backgroundColor: "#EDE8D0" }}
    >
      <div className="relative w-full max-w-5xl mx-auto px-6 pt-28 pb-16">
        <div className="flex flex-col items-center text-center gap-8 px-10 py-14">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/40 border border-white/50 text-brand-950 text-xs font-semibold px-4 py-2 rounded-full">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "#0d1b2e" }}
            />
            Banque 100 % numérique · Québec
          </div>

          {/* Titre */}
          <h1
            className="text-6xl sm:text-7xl lg:text-8xl font-extrabold leading-[1.0] tracking-tight uppercase whitespace-nowrap"
            style={{ fontFamily: "var(--font-syne)", color: "#0d1b2e" }}
          >
            Votre argent, <br />
            <span>libéré.</span>
          </h1>

          <p
            className="text-lg leading-relaxed max-w-lg"
            style={{ color: "rgba(13,27,46,0.65)" }}
          >
            Zeph vous donne le contrôle total sur vos finances — sans frais
            surprises, sans paperasse, sans attente.
          </p>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button href="/register" variant="primary" size="lg">
              Ouvrir un compte gratuit
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
            <Button href="#features" variant="secondary" size="lg">
              Voir comment ça fonctionne
            </Button>
          </div>

          {/* Stats */}
          <div
            className="flex gap-12 w-full justify-center pt-6 border-t"
            style={{ borderColor: "#0d1b2e" }}
          >
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-1 items-center">
                <span
                  className="text-4xl font-bold"
                  style={{ fontFamily: "var(--font-syne)", color: "#0d1b2e" }}
                >
                  {value}
                </span>
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "rgba(13,27,46,0.5)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
