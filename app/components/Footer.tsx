"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Instagram, Github, Linkedin, Twitter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { isAdmin } = useAuth();
  const pathname = usePathname();

  // The Employer Portal is a fully separate product with its own footer.
  if (pathname?.startsWith('/employer')) {
    return null;
  }

  return (
    <footer className="bg-[var(--bg-card)] border-t border-[var(--border-main)] pt-12 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-primary-600/10">C</div>
               <span className="text-xl font-bold font-display tracking-tight text-[var(--text-main)]">C FOUND.</span>
            </div>
            <p className="text-[var(--text-muted)] text-sm font-medium leading-relaxed mb-4 opacity-80">
              Architecting the future of software, games, and AI through high-performance engineering and industry-leading training programs.
            </p>
            <div className="flex gap-4">
               {[
                 { Icon: Instagram, href: "https://www.instagram.com/cfound.in/" },
                 { Icon: Linkedin, href: "https://www.linkedin.com/company/cfound/" },
                 { Icon: Mail, href: "mailto:admin.cfound@gmail.com" }
               ].map(({ Icon, href }, idx) => (
                  <a key={idx} href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:text-primary-600 hover:border-primary-600/30 transition-all shadow-sm">
                     <Icon size={18} />
                  </a>
               ))}
            </div>
          </div>

          <div>
             <h4 className="text-[10px] font-bold uppercase text-primary-600 tracking-widest mb-4">Ecosystem</h4>
             <ul className="space-y-2">
                <li><Link href="/projects" className="text-sm font-semibold text-[var(--text-muted)] hover:text-primary-600 transition-colors">Projects</Link></li>
                <li><Link href="/internship" className="text-sm font-semibold text-[var(--text-muted)] hover:text-primary-600 transition-colors">Internship</Link></li>
                {isAdmin && (
                  <li><Link href="/blog" className="text-sm font-semibold text-[var(--text-muted)] hover:text-primary-600 transition-colors">Journal</Link></li>
                )}
             </ul>
          </div>

          <div>
             <h4 className="text-[10px] font-bold uppercase text-primary-600 tracking-widest mb-4">Company</h4>
             <ul className="space-y-2">
                <li><Link href="/" className="text-sm font-semibold text-[var(--text-muted)] hover:text-primary-600 transition-colors">Our Ethos</Link></li>
                <li><Link href="/careers" className="text-sm font-semibold text-[var(--text-muted)] hover:text-primary-600 transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="text-sm font-semibold text-[var(--text-muted)] hover:text-primary-600 transition-colors">Contact Us</Link></li>
             </ul>
          </div>

          <div>
             <h4 className="text-[10px] font-bold uppercase text-primary-600 tracking-widest mb-4">Newsletter</h4>
             <p className="text-xs font-medium text-[var(--text-muted)] mb-6 opacity-80 leading-relaxed">Join our inner circle for the latest intelligence on emerging technologies and program releases.</p>
             <form className="relative">
              <input
                id="newsletter-email"
                name="newsletterEmail"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm focus:border-primary-600 focus:outline-none text-[var(--text-main)] font-semibold"
              />

              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-600 hover:scale-110 transition-transform"
              >
                <Mail size={18} />
              </button>
            </form>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--border-main)] flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-6 text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest opacity-60">
              <span>&copy; {new Date().getFullYear()} C FOUND. ENGINEERED IN INDIA.</span>
              <span className="hidden sm:flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                 Systems Online / Core Active
              </span>
           </div>
           <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60">
              <a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary-600 transition-colors">Cookie Policy</a>
           </div>
        </div>
      </div>
    </footer>
  );
}
