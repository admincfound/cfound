import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, MessageSquare, ShieldCheck, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Contact() {
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: 'idle', message: '' });
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      const msg = "Message received. Our team will contact you shortly via the secure protocol.";
      setStatus({ 
        type: 'success', 
        message: msg
      });
      toast.success(msg);
    }, 1500);
  };

  return (
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
                <ContactInfo icon={<MapPin className="text-primary-600" />} label="Primary Studio" value="Bengalaru / Mumbai, India" />
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
               {status.type === 'success' && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 text-xs font-black uppercase tracking-widest text-center"
                 >
                   {status.message}
                 </motion.div>
               )}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] mb-3 block">Full Name</label>
                    <input required type="text" className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-6 py-4 text-sm focus:border-primary-600 outline-none transition-all text-[var(--text-main)] font-semibold" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] mb-3 block">Email Address</label>
                    <input required type="email" className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-6 py-4 text-sm focus:border-primary-600 outline-none transition-all text-[var(--text-main)] font-semibold" placeholder="john@example.com" />
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] mb-3 block">Inquiry Type</label>
                  <select className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-6 py-4 text-sm focus:border-primary-600 outline-none transition-all text-[var(--text-main)] font-semibold appearance-none">
                    <option>General Partnership</option>
                    <option>Product Development</option>
                    <option>Careers & Internships</option>
                    <option>Media Inquiry</option>
                  </select>
               </div>
               <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] mb-3 block">Message</label>
                  <textarea required rows={5} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-6 py-4 text-sm focus:border-primary-600 outline-none transition-all text-[var(--text-main)] font-semibold resize-none" placeholder="How can we help you?" />
               </div>
               <button 
                 disabled={loading}
                 className="btn-primary w-full py-5 flex items-center justify-center gap-3"
               >
                 {loading ? "Processing..." : <><Send size={18} /> Send Message</>}
               </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
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
