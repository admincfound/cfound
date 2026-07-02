import Link from "next/link";
import { Briefcase } from "lucide-react";

export default function MarketingFooter() {
  return (
    <footer className="bg-slate-950 text-white mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Briefcase size={16} />
            </div>
            <span className="font-black italic tracking-tight">C Found for Employers</span>
          </div>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            Post jobs, manage applicants, and grow your team with C Found&apos;s employer
            hiring platform.
          </p>
        </div>

        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
            Product
          </div>
          <div className="space-y-3 text-sm">
            <Link href="/employer/features" className="block text-slate-300 hover:text-white">
              Features
            </Link>
            <Link href="/employer/pricing" className="block text-slate-300 hover:text-white">
              Pricing
            </Link>
            <Link href="/employer/register" className="block text-slate-300 hover:text-white">
              Create Employer Account
            </Link>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
            Company
          </div>
          <div className="space-y-3 text-sm">
            <Link href="/employer/about" className="block text-slate-300 hover:text-white">
              About
            </Link>
            <Link href="/employer/contact" className="block text-slate-300 hover:text-white">
              Contact
            </Link>
            <Link href="/" className="block text-slate-300 hover:text-white">
              Candidate Site
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-[10px] uppercase tracking-widest text-slate-500">
        © {new Date().getFullYear()} C Found Technologies. All rights reserved.
      </div>
    </footer>
  );
}
