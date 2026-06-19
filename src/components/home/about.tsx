import Image from "next/image";

const stats = [
  { value: "2021", label: "Année de fondation" },
  { value: "100 %", label: "Numérique" },
  { value: "Québec", label: "Conçue ici" },
];

export default function About() {
  return (
    <section id="apropos" style={{ backgroundColor: "#EDE8D0" }}>
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex-1 flex flex-col justify-center py-16 px-8 lg:py-28 lg:px-16">
          <p className="text-brand-800 text-sm font-semibold uppercase tracking-widest mb-3">
            À propos
          </p>
          <h2
            className="text-4xl font-bold leading-tight mb-5"
            style={{ fontFamily: "var(--font-syne)", color: "#0d1b2e" }}
          >
            Une banque pensée pour les Québécois.
          </h2>
          <div className="space-y-4 text-slate-600 leading-relaxed mb-12">
            <p>
              Libéo est née d'une idée simple : la gestion de l'argent devrait
              être claire, rapide et sans mauvaises surprises. Nous avons
              construit une banque entièrement numérique qui met le contrôle
              entre les mains de ses clients.
            </p>
            <p>
              Pas de succursales, pas de paperasse, pas de frais cachés —
              seulement les outils dont vous avez besoin pour épargner, dépenser
              et planifier en toute confiance.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-8 w-fit">
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-1">
                <span
                  className="text-3xl font-bold"
                  style={{ fontFamily: "var(--font-syne)", color: "#0d1b2e" }}
                >
                  {value}
                </span>
                <span className="text-xs uppercase tracking-wider text-slate-500">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-72 sm:h-96 w-full lg:h-auto lg:w-5/12 lg:mx-8">
          <Image
            src="/forest5.webp"
            alt="forest"
            fill
            priority
            className="object-cover object-[50%_30%]"
          />
        </div>
      </div>
    </section>
  );
}
