import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import { Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact | C Found for Employers",
  description: "Get in touch with the C Found employer team.",
  alternates: { canonical: "https://www.cfound.in/employer/contact" },
};

export default function EmployerContactPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16">
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
          Contact
        </span>
        <h1 className="text-3xl md:text-4xl font-black italic tracking-tight text-[var(--text-main)] mt-3 mb-6">
          Talk to our team
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-10 leading-relaxed">
          Questions about hiring on C Found, plans, or getting your company
          verified? We&apos;re happy to help.
        </p>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Mail size={18} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Email</div>
              <div className="text-sm font-bold text-[var(--text-main)]">employers@cfound.in</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Phone size={18} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Phone</div>
              <div className="text-sm font-bold text-[var(--text-main)]">+91 00000 00000</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <MapPin size={18} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Location</div>
              <div className="text-sm font-bold text-[var(--text-main)]">Chennai, India</div>
            </div>
          </div>
        </div>
      </div>

      <ContactForm />
    </div>
  );
}
