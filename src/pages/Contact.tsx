import { MessageCircle, Mail, MapPin, Send, Loader2, Globe } from 'lucide-react';
import React, { useState } from 'react';
import { motion } from 'motion/react';

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-24">
          <h1 className="text-4xl md:text-6xl font-bold mb-8">Get in <span className="text-gradient">Touch</span></h1>
          <p className="text-white/50 text-xl leading-relaxed">
            Have a project in mind or a question about our careers? Our team is always ready to collaborate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Info Side */}
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div className="glass-card p-8">
                  <Mail className="text-cyan-glow mb-4" />
                  <h3 className="font-bold mb-2">Email Us</h3>
                  <a href="mailto:admin.cfound@gmail.com" className="text-sm text-white/50 hover:text-white transition-colors">admin.cfound@gmail.com</a>
               </div>
               <div className="glass-card p-8">
                  <MessageCircle className="text-soft-purple mb-4" />
                  <h3 className="font-bold mb-2">WhatsApp</h3>
                  <a href="https://wa.me/91936119454" className="text-sm text-white/50 hover:text-white transition-colors">Chat with Support</a>
               </div>
            </div>

            <div className="glass-card p-8 flex items-start gap-6">
               <MapPin className="text-cyan-glow shrink-0 mt-1" />
               <div>
                  <h3 className="font-bold mb-2">Office Location</h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Technology Hub, 4th Floor, Global Digital District, <br />
                    Innovation Park, 500032
                  </p>
               </div>
            </div>

            {/* Google Maps Placeholder */}
            <div className="rounded-3xl overflow-hidden glass-card h-64 grayscale opacity-50 relative group">
               <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all cursor-pointer">
                  <Globe className="text-white/20 animate-spin-slow" size={48} />
               </div>
               <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.757751996765!2d78.37528347587747!3d17.43575798345104!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93dc8c58695b%3A0x4c9b9ce30e196024!2sT-Hub!5e0!3m2!1sen!2sin!4v1715511600000!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Map"
               />
            </div>
          </div>

          {/* Form Side */}
          <div className="glass-card p-8 md:p-12 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-soft-purple/5 blur-[100px] pointer-events-none" />
             
             {submitted ? (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="h-full flex flex-col items-center justify-center text-center py-12"
               >
                 <div className="w-20 h-20 rounded-full bg-cyan-glow/10 flex items-center justify-center mb-6">
                    <Send className="text-cyan-glow" size={32} />
                 </div>
                 <h2 className="text-2xl font-bold mb-4">Message Sent!</h2>
                 <p className="text-white/50 text-sm mb-8 max-w-xs">We've received your inquiry and will get back to you shortly.</p>
                 <button 
                   onClick={() => setSubmitted(false)}
                   className="text-cyan-glow text-sm font-bold uppercase tracking-widest border-b border-cyan-glow/50 pb-1"
                 >
                   Send another message
                 </button>
               </motion.div>
             ) : (
               <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                       required
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-cyan-glow transition-all"
                       placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                       required
                       type="email"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-cyan-glow transition-all"
                       placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Subject</label>
                    <select 
                       defaultValue="Product Development"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-cyan-glow transition-all"
                    >
                       <option value="Product Development">Product Development</option>
                       <option value="General Inquiry">General Inquiry</option>
                       <option value="Support">Support</option>
                       <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Message</label>
                    <textarea 
                       required
                       rows={4}
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-cyan-glow transition-all resize-none"
                       placeholder="How can we help you?"
                    />
                  </div>
                  
                  <button 
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-white text-black font-extrabold flex items-center justify-center gap-2 hover:bg-cyan-glow transition-all disabled:opacity-50 mt-4"
                  >
                    {isSubmitting ? <><Loader2 className="animate-spin" /> Sending...</> : <>Send Message <Send size={18} /></>}
                  </button>
               </form>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
