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

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: "#0E2A47" }}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button href="/login" variant="ghost" size="sm">
            Connexion
          </Button>
          <Button href="/register" variant="primary" size="sm">
            Ouvrir un compte
          </Button>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Fermer" : "Menu"}
        >
          <div className="w-5 flex flex-col gap-1.5">
            <span
              className={`block h-0.5 transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
              style={{ backgroundColor: "#081A2E" }}
            />
            <span
              className={`block h-0.5 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
              style={{ backgroundColor: "#081A2E" }}
            />
            <span
              className={`block h-0.5 transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
              style={{ backgroundColor: "#081A2E" }}
            />
          </div>
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"} bg-white border-t border-slate-100 shadow-lg`}
      >
        <div className="px-6 py-4 flex flex-col gap-4">
          {navLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium py-1 hover:opacity-70 transition-opacity"
              style={{ color: "#0E2A47" }}
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
