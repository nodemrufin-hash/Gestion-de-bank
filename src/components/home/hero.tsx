import Button from "@/components/common/Button";

const stats = [
  { value: "0 $", label: "de frais cachés" },
  { value: "2 min", label: "pour ouvrir un compte" },
  { value: "150+", label: "pays couverts" },
];

export default function Hero() {
  return (
    <section
      className="min-h-screen flex"
      style={{ backgroundColor: "#F2F5F7" }}
    >
      {/* Gauche — texte */}
      <div className="flex-1 flex flex-col justify-center px-12 lg:px-20 py-32 max-w-2xl">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 border text-xs font-semibold px-4 py-2 rounded-full w-fit mb-8"
          style={{ borderColor: "#0d1b2e", color: "#0d1b2e" }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: "#0d1b2e" }}
          />
          Banque 100 % numérique · Québec
        </div>

        {/* Titre */}
        <h1
          className="font-extrabold leading-[1.0] tracking-tight uppercase mb-6"
          style={{
            fontFamily: "var(--font-syne)",
            color: "#0d1b2e",
            fontSize: "clamp(3rem, 5vw, 5rem)",
          }}
        >
          Votre argent,
          <br />
          <span>libéré.</span>
        </h1>

        <p
          className="text-lg leading-relaxed mb-10 max-w-md"
          style={{ color: "rgba(13,27,46,0.65)" }}
        >
          Zeph vous donne le contrôle total sur vos finances — sans frais
          surprises, sans paperasse, sans attente.
        </p>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-12">
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
      </div>

      {/* Droite — image */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <img
          src="/imgHero.webp"
          alt="Zeph banque numérique"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </section>
  );
}
