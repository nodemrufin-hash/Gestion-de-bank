"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Logo from "@/components/common/Logo";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: "Tableau de bord", href: "/dashboard", icon: "□" },
    { label: "Admin", href: "/admin", icon: "⚙" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top bar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 shrink-0">
        <button
          className="lg:hidden mr-3 p-2 hover:bg-slate-100 rounded-lg"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Menu"
        >
          <div className="w-5 h-0.5 bg-slate-700 mb-1" />
          <div className="w-5 h-0.5 bg-slate-700 mb-1" />
          <div className="w-5 h-0.5 bg-slate-700" />
        </button>
        <Logo variant="dark" size="sm" />
        <div className="ml-auto flex items-center gap-4">
          <Link href="/" className="text-xs text-slate-500 hover:text-brand-800 transition-colors">
            ← Site public
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 pt-6 transition-transform duration-300 flex flex-col`}
        >
          <nav className="flex flex-col gap-1 px-4">
            {navItems.map(({ label, href, icon }) => {
              const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-800"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
