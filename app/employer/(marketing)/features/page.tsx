import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  Users,
  LayoutDashboard,
  UserPlus,
  BarChart3,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features | C Found for Employers",
  description: "Explore the tools C Found gives employers to post jobs, manage applicants, and grow their hiring team.",
  alternates: { canonical: "https://www.cfound.in/employer/features" },
};

const features = [
  { icon: Briefcase, title: "Job Posting", desc: "Create, publish, and manage job listings with drafts and instant edits." },
  { icon: Users, title: "Applicant Tracking", desc: "Search, filter, and move candidates through hiring stages." },
  { icon: LayoutDashboard, title: "Company Dashboard", desc: "A single command center for your jobs, applicants, and activity." },
  { icon: UserPlus, title: "Recruiter Management", desc: "Invite teammates and control their roles and permissions." },
  { icon: BarChart3, title: "Analytics", desc: "Track views, applications, and funnel performance over time." },
  { icon: MessageSquare, title: "Messaging", desc: "Talk to candidates directly without leaving the platform." },
  { icon: Sparkles, title: "Employer Branding", desc: "A branded company profile that showcases who you are." },
  { icon: ShieldCheck, title: "Verified Companies", desc: "Build trust with candidates through company verification." },
];

export default function EmployerFeaturesPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
          Features
        </span>
        <h1 className="text-3xl md:text-5xl font-black italic tracking-tight text-[var(--text-main)] mt-3 mb-4">
          Built for modern hiring teams
        </h1>
        <p className="text-sm md:text-base text-[var(--text-muted)]">
          Every tool you need to post roles, manage applicants, and grow your company &mdash;
          in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-4">
                <Icon size={18} />
              </div>
              <h3 className="font-black italic text-sm text-[var(--text-main)] mb-2">{f.title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <Link
          href="/employer/register"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95"
        >
          Create Employer Account
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
