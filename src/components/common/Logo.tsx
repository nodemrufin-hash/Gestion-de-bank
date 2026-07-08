import Link from "next/link";

interface LogoProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { icon: 28, text: "text-base" },
  md: { icon: 32, text: "text-lg" },
  lg: { icon: 40, text: "text-2xl" },
};

export default function Logo({ variant = "dark", size = "md" }: LogoProps) {
  const { icon, text } = sizeMap[size];
  const textColor = variant === "dark" ? "#081A2E" : "#ffffff";

  return (
    <Link href="/" className="flex items-center gap-2 group w-fit">
      <div
        className="rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity group-hover:opacity-80"
        style={{ width: icon, height: icon, backgroundColor: "#081A2E" }}
      >
        <svg
          width={icon * 0.5}
          height={icon * 0.5}
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M8 2L13 5V11L8 14L3 11V5L8 2Z"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="8" r="2" fill="white" />
        </svg>
      </div>
      <span
        className={`font-bold tracking-tight font-display ${text}`}
        style={{ color: textColor }}
      >
        Libéo
      </span>
    </Link>
  );
}
