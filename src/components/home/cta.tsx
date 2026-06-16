import Link from "next/link";

export default function CTA() {
  return (
    <section
      className="py-28 relative overflow-hidden"
      style={{ backgroundColor: "#102040" }}
    >
      <div className="relative max-w-3xl mx-auto px-6 text-center flex flex-col items-center gap-8">
        <div className="flex flex-col gap-4">
          <h2
            className="text-4xl lg:text-5xl font-bold leading-tight text-white"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Prêt à changer de banque ?
          </h2>
          <p
            className="text-lg leading-relaxed"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Rejoignez des milliers de Québécois qui ont repris le contrôle de
            leurs finances. Ouverture de compte en 2 minutes, sans rendez-vous.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 font-semibold text-sm px-7 py-4 rounded-xl transition-all duration-200 active:scale-95 hover:opacity-90"
            style={{ backgroundColor: "#e0c07a", color: "#102040" }}
          >
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
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center justify-center gap-2 font-semibold text-sm px-7 py-4 rounded-xl transition-all duration-200 hover:opacity-80"
            style={{
              color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            En savoir plus
          </Link>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          Sans carte de crédit · Sans engagement · Sans frais d&apos;ouverture
        </p>
      </div>
    </section>
  );
}
