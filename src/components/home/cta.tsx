import Button from "@/components/common/Button";

export default function CTA() {
  return (
    <section
      className="py-28 bg-white relative overflow-hidden"
      style={{ backgroundColor: "#EDE8D0" }}
    >
      <div className="relative max-w-3xl mx-auto px-6 text-center flex flex-col items-center gap-8">
        <div className="flex flex-col gap-4">
          <h2
            className="text-4xl lg:text-5xl font-bold leading-tight"
            style={{ color: "#0d1b2e", fontFamily: "var(--font-syne)" }}
          >
            Prêt à changer de banque ?
          </h2>
          <p className="text-lg leading-relaxed text-slate-500">
            Rejoignez des milliers de Québécois qui ont repris le contrôle de
            leurs finances. Ouverture de compte en 2 minutes, sans rendez-vous.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button href="/register" variant="primary" size="lg">
            Ouvrir un compte — c&apos;est gratuit
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
          <Button href="#features" variant="ghost" size="lg">
            En savoir plus
          </Button>
        </div>

        <p className="text-slate-400 text-xs">
          Sans carte de crédit · Sans engagement · Sans frais d&apos;ouverture
        </p>
      </div>
    </section>
  );
}
