"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Briefcase } from "lucide-react";

const links = [
  { name: "Home", path: "/employer" },
  { name: "Features", path: "/employer/features" },
  { name: "Pricing", path: "/employer/pricing" },
  { name: "Resources", path: "/employer/about" },
  { name: "Contact", path: "/employer/contact" },
];

export default function MarketingNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-main)]/90 backdrop-blur-xl border-b border-[var(--border-main)]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/employer" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black italic shadow-lg group-hover:scale-105 transition-transform">
            <Briefcase size={18} />
          </div>
          <div className="leading-tight">
            <div className="font-black italic tracking-tight text-[var(--text-main)]">
              C Found
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">
              For Employers
            </div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.path}
              href={l.path}
              className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                pathname === l.path
                  ? "text-blue-600"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              {l.name}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/employer/login"
            className="text-xs font-bold uppercase tracking-widest text-[var(--text-main)] px-4 py-2.5 hover:text-blue-600 transition-colors"
          >
            Employer Login
          </Link>
          <Link
            href="/employer/register"
            className="text-xs font-black uppercase tracking-widest bg-slate-900 hover:bg-blue-600 text-white px-5 py-3 rounded-xl transition-all active:scale-95 shadow-lg"
          >
            Get Started
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--border-main)]"
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[var(--border-main)] px-6 py-6 space-y-4 bg-[var(--bg-main)]">
          {links.map((l) => (
            <Link
              key={l.path}
              href={l.path}
              onClick={() => setOpen(false)}
              className="block text-sm font-bold uppercase tracking-widest text-[var(--text-main)]"
            >
              {l.name}
            </Link>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            <Link
              href="/employer/login"
              onClick={() => setOpen(false)}
              className="text-center text-xs font-bold uppercase tracking-widest border border-[var(--border-main)] rounded-xl py-3"
            >
              Employer Login
            </Link>
            <Link
              href="/employer/register"
              onClick={() => setOpen(false)}
              className="text-center text-xs font-black uppercase tracking-widest bg-slate-900 text-white rounded-xl py-3"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
