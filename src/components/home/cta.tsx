import Link from "next/link";

export default function CTA() {
  return (
    <section
      className="py-28 relative overflow-hidden"
      style={{ backgroundColor: "#081A2E" }}
    >
      <div className="relative max-w-3xl mx-auto px-6 text-center flex flex-col items-center gap-8">
        <div className="flex flex-col gap-4">
          <h2
            className="text-4xl lg:text-5xl font-bold leading-tight text-white"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Prêt à changer de banque ?
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#9FB8C9" }}>
            Rejoignez des milliers de Québécois qui ont repris le contrôle de
            leurs finances. Ouverture de compte en 2 minutes, sans rendez-vous.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 font-semibold text-sm px-7 py-4 rounded-xl transition-all duration-200 active:scale-95 hover:opacity-90"
            style={{ backgroundColor: "#1F4E6B", color: "#ffffff" }}
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
              color: "#9FB8C9",
              border: "1px solid rgba(159,184,201,0.3)",
            }}
          >
            En savoir plus
          </Link>
        </div>

        <p className="text-xs" style={{ color: "rgba(159,184,201,0.4)" }}>
          Sans carte de crédit · Sans engagement · Sans frais d&apos;ouverture
        </p>
      </div>
    </section>
  );
}
