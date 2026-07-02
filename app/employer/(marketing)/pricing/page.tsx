import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | C Found for Employers",
  description: "Simple, transparent pricing for employers hiring on C Found.",
  alternates: { canonical: "https://www.cfound.in/employer/pricing" },
};

const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "For teams making their first few hires.",
    features: ["1 active job post", "Basic applicant tracking", "Company profile page"],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "\u20b94,999",
    period: "/month",
    desc: "For growing teams hiring regularly.",
    features: [
      "10 active job posts",
      "Full applicant tracking",
      "Up to 5 recruiter seats",
      "Analytics dashboard",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For larger hiring teams and organizations.",
    features: [
      "Unlimited job posts",
      "Unlimited recruiter seats",
      "Priority support",
      "Verified company badge",
    ],
    highlighted: false,
  },
];

export default function EmployerPricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center max-w-xl mx-auto mb-16">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
          Pricing
        </span>
        <h1 className="text-3xl md:text-5xl font-black italic tracking-tight text-[var(--text-main)] mt-3 mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-sm md:text-base text-[var(--text-muted)]">
          Start free. Upgrade as your hiring needs grow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-3xl p-8 border ${
              p.highlighted
                ? "bg-slate-950 text-white border-slate-900 scale-105 shadow-2xl"
                : "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)]"
            }`}
          >
            {p.highlighted && (
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3">
                Most Popular
              </div>
            )}
            <h3 className="font-black italic text-lg mb-1">{p.name}</h3>
            <p className={`text-xs mb-6 ${p.highlighted ? "text-slate-400" : "text-[var(--text-muted)]"}`}>
              {p.desc}
            </p>
            <div className="mb-6">
              <span className="text-3xl font-black italic">{p.price}</span>
              {p.period && <span className="text-sm opacity-60">{p.period}</span>}
            </div>
            <div className="space-y-3 mb-8">
              {p.features.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm">
                  <Check size={16} className={p.highlighted ? "text-blue-400" : "text-blue-600"} />
                  <span className={p.highlighted ? "text-slate-300" : "text-[var(--text-muted)]"}>
                    {f}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/employer/register"
              className={`block text-center text-xs font-black uppercase tracking-widest rounded-2xl py-3.5 transition-all active:scale-95 ${
                p.highlighted
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "border border-[var(--border-main)] hover:bg-[var(--bg-main)]"
              }`}
            >
              Get Started
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
