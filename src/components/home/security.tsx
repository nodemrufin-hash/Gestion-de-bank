import { ReactNode } from "react";

interface Guarantee {
  icon: ReactNode;
  label: string;
}

const guarantees: Guarantee[] = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l7 4v5c0 5-3.5 9-7 10C8.5 20 5 16 5 11V6l7-4z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    label: "Chiffrement de bout en bout",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect
          x="5"
          y="11"
          width="14"
          height="10"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8 11V7a4 4 0 1 1 8 0v4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    label: "Authentification à deux facteurs",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 7v5l3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    label: "Surveillance des transactions 24/7",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
    label: "Dépôts assurés jusqu'à 100 000 $",
  },
];

export default function Security() {
  return (
    <section
      id="securite"
      className="py-16 sm:py-24 lg:py-28 relative overflow-hidden"
      style={{ backgroundColor: "#0E2A47" }}
    >
      <div
        className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: "rgba(31,78,107,0.3)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: "rgba(31,78,107,0.2)" }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="flex flex-col gap-8">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#9FB8C9" }}
              >
                Sécurité
              </p>
              <h2
                className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Votre argent est protégé.{" "}
                <span style={{ color: "#9FB8C9" }}>Point.</span>
              </h2>
              <p
                className="leading-relaxed text-base sm:text-lg"
                style={{ color: "rgba(159,184,201,0.7)" }}
              >
                Zeph utilise les mêmes standards de sécurité que les grandes
                institutions financières — sans la complexité inutile.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {guarantees.map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: "rgba(31,78,107,0.5)",
                      color: "#9FB8C9",
                    }}
                  >
                    {icon}
                  </div>
                  <span className="font-medium" style={{ color: "#F2F5F7" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shield — caché sur mobile */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">
              <div
                className="w-64 h-64 rounded-full border flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(31,78,107,0.2)",
                  borderColor: "rgba(31,78,107,0.4)",
                }}
              >
                <div
                  className="w-44 h-44 rounded-full border flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(31,78,107,0.3)",
                    borderColor: "rgba(31,78,107,0.5)",
                  }}
                >
                  <div
                    className="w-28 h-28 rounded-full border flex items-center justify-center"
                    style={{
                      backgroundColor: "rgba(31,78,107,0.4)",
                      borderColor: "rgba(159,184,201,0.3)",
                    }}
                  >
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2l7 4v5c0 5-3.5 9-7 10C8.5 20 5 16 5 11V6l7-4z"
                        stroke="#9FB8C9"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        fill="rgba(31,78,107,0.4)"
                      />
                      <path
                        d="M9 12l2 2 4-4"
                        stroke="#9FB8C9"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div
                className="absolute -top-2 -right-4 rounded-xl px-4 py-2.5 shadow-xl border"
                style={{
                  backgroundColor: "#081A2E",
                  borderColor: "rgba(31,78,107,0.6)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: "#9FB8C9" }}
                  />
                  <span className="text-white text-xs font-semibold">
                    Connexion sécurisée
                  </span>
                </div>
              </div>
              <div
                className="absolute -bottom-2 -left-4 rounded-xl px-4 py-2.5 shadow-xl border"
                style={{
                  backgroundColor: "#081A2E",
                  borderColor: "rgba(31,78,107,0.6)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#9FB8C9" }}
                  />
                  <span className="text-white text-xs font-semibold">
                    SSL 256-bit
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
