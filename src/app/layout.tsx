import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Zeph — Votre banque numérique",
    template: "%s | Zeph",
  },
  description:
    "Zeph est la néobanque québécoise sans frais cachés. Ouvrez un compte en 2 minutes, gérez votre argent en temps réel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${syne.variable}`}>
      <body className="antialiased bg-white text-slate-900">{children}</body>
    </html>
  );
}
