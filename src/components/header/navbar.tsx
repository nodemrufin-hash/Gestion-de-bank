"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import Button from "@/components/common/Button";

const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Sécurité", href: "#securite" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "À propos", href: "#apropos" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo variant="dark" size="md" />

        {/* Desktop — liens */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium text-slate-600 hover:text-brand-800 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop — actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button href="/login" variant="ghost" size="sm">
            Connexion
          </Button>
          <Button href="/register" variant="primary" size="sm">
            Ouvrir un compte
          </Button>
        </div>

        {/* Mobile — burger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
        >
          <div className="w-5 flex flex-col gap-1.5">
            <span
              className={`block h-0.5 bg-slate-700 transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block h-0.5 bg-slate-700 transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`}
            />
            <span
              className={`block h-0.5 bg-slate-700 transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </div>
        </button>
      </div>

      {/* Mobile — menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"} bg-white border-t border-slate-100 shadow-lg`}
      >
        <div className="px-6 py-4 flex flex-col gap-4">
          {navLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium text-slate-700 hover:text-brand-800 transition-colors py-1"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <hr className="border-slate-100" />
          <Button href="/login" variant="ghost" size="sm" fullWidth>
            Connexion
          </Button>
          <Button href="/register" variant="primary" size="md" fullWidth>
            Ouvrir un compte
          </Button>
        </div>
      </div>
    </nav>
  );
}
