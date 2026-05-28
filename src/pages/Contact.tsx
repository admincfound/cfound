import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MapPin, Send, ShieldCheck, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';

export default function Contact() {

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const form = e.currentTarget;

    const name = (
      form.elements.namedItem('name') as HTMLInputElement
    ).value;

    const email = (
      form.elements.namedItem('email') as HTMLInputElement
    ).value;

    const inquiry = (
      form.elements.namedItem('inquiry') as HTMLSelectElement
    ).value;

    const message = (
      form.elements.namedItem('message') as HTMLTextAreaElement
    ).value;

    const whatsappMessage = `C FOUND TECHNOLOGIES

      New Contact Submission

      ━━━━━━━━━━━━━━━━━━

      FULL NAME
      ${name}

      EMAIL ADDRESS
      ${email}

      INQUIRY TYPE
      ${inquiry}

      MESSAGE
      ${message}

      ━━━━━━━━━━━━━━━━━━

      Submitted via:
      www.cfound.in`;

    const whatsappUrl =
      `https://wa.me/919361194545?text=${encodeURIComponent(
        whatsappMessage
      )}`;

    try {
      const win = window.open(
        whatsappUrl,
        '_blank'
      );

      if (!win) {
        toast.error(
          'Popup blocked. Please allow popups and try again.'
        );
        return;
      }

      form.reset();

      toast.success(
        'WhatsApp opened successfully.'
      );

      setTimeout(() => {
        const confirmed = window.confirm(
          'Did you send the WhatsApp message successfully?'
        );

        if (confirmed) {
          toast.success(
            'Message sent successfully. Our team will reply soon.'
          );
        } else {
          toast(
            'Message was not sent. Please try again.'
          );
        }
      }, 4000);

    } catch (err) {
      console.error(err);

      toast.error(
        'Failed to open WhatsApp. Please try again.'
      );
    }
  };

  return (
    <>
    <Helmet>
      <title>Contact | C FOUND Technologies</title>

      <meta
        name="description"
        content="Contact C FOUND Technologies for software development, AI systems, game development, internships, partnerships, and digital innovation."
      />

      <meta
        property="og:title"
        content="Contact | C FOUND Technologies"
      />

      <meta
        property="og:description"
        content="Get in touch with C FOUND Technologies for projects, careers, internships, and technology partnerships."
      />

      <meta
        property="og:image"
        content="https://www.cfound.in/og-image.png"
      />

      <meta
        property="twitter:title"
        content="Contact | C FOUND Technologies"
      />

      <meta
        property="twitter:description"
        content="Get in touch with C FOUND Technologies for projects, careers, internships, and technology partnerships."
      />

      <meta
        property="twitter:image"
        content="https://www.cfound.in/og-image.png"
      />
    </Helmet>
    <div className="pt-32 pb-32 px-6 bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="text-primary-600 font-bold text-sm uppercase tracking-widest mb-6 block">Get in Touch</span>
              <h1 className="text-5xl md:text-8xl font-black font-display tracking-tight text-[var(--text-main)] mb-8 leading-none">Let's <span className="text-primary-600">Connect.</span></h1>
              <p className="text-[var(--text-muted)] text-lg md:text-xl font-medium leading-relaxed mb-12">
                Have a project in mind or want to join our elite programs? Our team is always here to discuss how we can work together. Reach out via any of the channels below.
              </p>

              <div className="space-y-10">
                <ContactInfo icon={<Mail className="text-primary-600" />} label="Digital Communication" value="admin.cfound@gmail.com" />
                <ContactInfo icon={<Globe className="text-primary-600" />} label="Social Operations" value="@cfound.in" />
                <ContactInfo icon={<MapPin className="text-primary-600" />} label="Primary Studio" value=" Nagercoil, India" />
              </div>

              <div className="mt-20 pt-12 border-t border-[var(--border-main)] flex flex-wrap gap-12 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                <div className="flex items-center gap-3"><ShieldCheck size={16} className="text-primary-600" /> Secure Protocol</div>
                <div className="flex items-center gap-3"><Globe size={16} className="text-primary-600" /> Made for India</div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 md:p-16 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3rem] shadow-2xl shadow-primary-600/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-primary-600 font-display font-black text-[12rem] pointer-events-none">C</div>
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] mb-3 block">Full Name</label>
                    <input name="name" required type="text" className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-6 py-4 text-sm focus:border-primary-600 outline-none transition-all text-[var(--text-main)] font-semibold" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] mb-3 block">Email Address</label>
                    <input name="email" required type="email" className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-6 py-4 text-sm focus:border-primary-600 outline-none transition-all text-[var(--text-main)] font-semibold" placeholder="john@example.com" />
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] mb-3 block">Inquiry Type</label>
                  <select name="inquiry" className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-6 py-4 text-sm focus:border-primary-600 outline-none transition-all text-[var(--text-main)] font-semibold appearance-none">
                    <option>General Partnership</option>
                    <option>Product Development</option>
                    <option>Careers & Internships</option>
                    <option>Media Inquiry</option>
                  </select>
               </div>
               <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] mb-3 block">Message</label>
                  <textarea name="message" required rows={5} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-6 py-4 text-sm focus:border-primary-600 outline-none transition-all text-[var(--text-main)] font-semibold resize-none" placeholder="How can we help you?" />
               </div>
               <button 
                type="submit"
                className="btn-primary w-full py-5 flex items-center justify-center gap-3"
              >
                <Send size={18} />
                Send Message
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
}

function ContactInfo({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-6 group">
      <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/10 border border-primary-600/10 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest mb-1">{label}</div>
        <div className="text-xl font-bold tracking-tight text-[var(--text-main)] font-display">{value}</div>
      </div>
    </div>
  );
}
