import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  Users,
  LayoutDashboard,
  UserPlus,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Employer Portal | Hire Faster, Recruit Smarter",
  description:
    "C Found for Employers: post jobs, manage applicants, and grow your company with a modern hiring platform.",
  alternates: { canonical: "https://www.cfound.in/employer" },
  openGraph: {
    title: "C Found for Employers",
    description:
      "Post jobs, manage applicants, and grow your company with C Found's employer hiring platform.",
    url: "https://www.cfound.in/employer",
  },
};

const features = [
  { icon: Briefcase, title: "Post Jobs", desc: "Publish roles in minutes and reach ready-to-work candidates." },
  { icon: Users, title: "Manage Applicants", desc: "Track, shortlist, and move candidates through your pipeline." },
  { icon: LayoutDashboard, title: "Company Dashboard", desc: "One place for jobs, applicants, and hiring activity." },
  { icon: UserPlus, title: "Recruiter Management", desc: "Invite your team and manage roles and permissions." },
  { icon: BarChart3, title: "Analytics", desc: "See what's working across your job posts and funnels." },
  { icon: Sparkles, title: "Employer Branding", desc: "Showcase your company with a branded public profile." },
];

export default function EmployerLandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/10 blur-[160px] rounded-full pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-main)] bg-[var(--bg-card)] text-[10px] font-black uppercase tracking-widest text-blue-600 mb-8">
            <Sparkles size={12} />
            C Found for Employers
          </div>

          <h1 className="text-4xl md:text-6xl font-black italic tracking-tight text-[var(--text-main)] leading-[1.05] mb-6">
            Hire Faster.
            <br />
            Recruit Smarter.
            <br />
            Grow Your Company.
          </h1>

          <p className="text-base md:text-lg text-[var(--text-muted)] max-w-2xl mx-auto mb-10">
            The employer hiring platform built on C Found &mdash; post jobs, manage
            applicants, and build your recruiting team, all in one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/employer/register"
              className="inline-flex items-center gap-2 px-7 py-4 bg-slate-900 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95"
            >
              Start Hiring
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/employer/login"
              className="inline-flex items-center gap-2 px-7 py-4 border border-[var(--border-main)] text-[var(--text-main)] font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-[var(--bg-card)] transition-all active:scale-95"
            >
              Employer Login
            </Link>
            <Link
              href="/employer/register"
              className="text-xs font-bold uppercase tracking-widest text-blue-600 underline underline-offset-4"
            >
              Create Employer Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-black italic tracking-tight text-[var(--text-main)]">
            Everything you need to hire
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            A complete toolkit for modern recruiting teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-7 hover:-translate-y-1 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-5">
                  <Icon size={20} />
                </div>
                <h3 className="font-black italic text-[var(--text-main)] mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust strip */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="bg-slate-950 text-white rounded-3xl p-10 md:p-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            "Free to get started, no credit card required",
            "Manage unlimited job posts from one dashboard",
            "Built on the same trusted C Found platform",
          ].map((t) => (
            <div key={t} className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-300">{t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-2xl md:text-3xl font-black italic tracking-tight text-[var(--text-main)] mb-4">
          Ready to build your team?
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-8">
          Create your employer account and post your first job today.
        </p>
        <Link
          href="/employer/register"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95"
        >
          Create Employer Account
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
