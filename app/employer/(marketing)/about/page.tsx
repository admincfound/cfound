import type { Metadata } from "next";
import Link from "next/link";
import { Target, Users, Rocket, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About | C Found for Employers",
  description: "Learn about the C Found employer platform and its mission to connect companies with great talent.",
  alternates: { canonical: "https://www.cfound.in/employer/about" },
};

const values = [
  { icon: Target, title: "Our Mission", desc: "Make hiring simple, fast, and fair for growing companies of every size." },
  { icon: Users, title: "Our Community", desc: "Thousands of candidates across careers, internships, and projects." },
  { icon: Rocket, title: "Our Platform", desc: "One connected ecosystem for both employers and job seekers." },
];

export default function EmployerAboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
          About
        </span>
        <h1 className="text-3xl md:text-5xl font-black italic tracking-tight text-[var(--text-main)] mt-3 mb-4">
          Built to connect great teams with great talent
        </h1>
        <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed">
          C Found for Employers is the hiring side of the C Found platform &mdash;
          the same place candidates already use to find careers, internships,
          and projects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {values.map((v) => {
          const Icon = v.icon;
          return (
            <div
              key={v.title}
              className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-7"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-4">
                <Icon size={18} />
              </div>
              <h3 className="font-black italic text-sm text-[var(--text-main)] mb-2">{v.title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{v.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <Link
          href="/employer/register"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95"
        >
          Join as an Employer
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
