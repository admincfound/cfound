import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, CheckCircle2, ChevronRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { sendApplication } from '@/src/services/emailService';
import { cn } from '@/src/lib/utils';

const domains = [
  'Game Development',
  'Web Development',
  'App Development',
  'Software Engineering',
  'Database Systems',
  'UI/UX Design',
];

const durations = ['30-Day Internship', '6-Month Internship'];

export default function Careers() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await sendApplication(data);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Failed to send application. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-glow/20 bg-cyan-glow/5 text-cyan-glow text-[10px] font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles size={14} /> Join our team
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-8 leading-tight italic bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">
            Build Your Career Through <br />
            Real Industry Projects
          </h1>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
            Apply for internship opportunities and gain practical experience through live technology projects.
          </p>
        </div>

        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto py-20 px-8 rounded-3xl glass-card text-center flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-full bg-cyan-glow/10 flex items-center justify-center mb-8">
              <CheckCircle2 className="text-cyan-glow" size={40} />
            </div>
            <h2 className="text-3xl font-bold mb-4">Application Received!</h2>
            <p className="text-white/50 mb-8 leading-relaxed">
              Thank you for applying to C Found. Our recruitment team will review your profile and get back to you within 3-5 business days.
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="px-8 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-semibold"
            >
              Submit another application
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Form Column */}
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="lg:col-span-8 glass-card p-6 md:p-12 relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-glow/5 blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
               
               <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                 {error && (
                   <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
                     <AlertCircle size={18} /> {error}
                   </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-white/70 ml-1">Full Name *</label>
                     <input
                       required
                       name="fullName"
                       placeholder="John Doe"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-glow transition-colors placeholder:text-white/20"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-white/70 ml-1">Email Address *</label>
                     <input
                       required
                       type="email"
                       name="email"
                       placeholder="john@example.com"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-glow transition-colors placeholder:text-white/20"
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-white/70 ml-1">Phone Number *</label>
                     <input
                       required
                       name="phone"
                       placeholder="+1 (555) 000-0000"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-glow transition-colors placeholder:text-white/20"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-white/70 ml-1">Location *</label>
                     <input
                       required
                       name="location"
                       placeholder="City, Country"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-glow transition-colors placeholder:text-white/20"
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-white/70 ml-1">College / Institution *</label>
                     <input
                       required
                       name="college"
                       placeholder="University Name"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-glow transition-colors placeholder:text-white/20"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-white/70 ml-1">Qualification *</label>
                     <input
                       required
                       name="qualification"
                       placeholder="B.Tech / BC / MCA etc"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-glow transition-colors placeholder:text-white/20"
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-white/70 ml-1">Year of Study *</label>
                     <select
                       required
                       name="yearOfStudy"
                       defaultValue=""
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-glow transition-colors appearance-none"
                     >
                       <option value="" disabled>Select Year</option>
                       <option value="1st Year">1st Year</option>
                       <option value="2nd Year">2nd Year</option>
                       <option value="3rd Year">3rd Year</option>
                       <option value="4th Year">4th Year</option>
                       <option value="Final Year / Graduated">Final Year / Graduated</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-white/70 ml-1">Proposed Start Date *</label>
                     <input
                       required
                       type="date"
                       name="startDate"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.2 focus:outline-none focus:border-cyan-glow transition-colors"
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-white/70 ml-1">Interested Domain *</label>
                     <select
                       required
                       name="domain"
                       defaultValue=""
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-glow transition-colors"
                     >
                       <option value="" disabled>Select Domain</option>
                       {domains.map(d => <option key={d} value={d}>{d}</option>)}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-white/70 ml-1">Internship Duration *</label>
                     <select
                       required
                       name="duration"
                       defaultValue=""
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-glow transition-colors"
                     >
                       <option value="" disabled>Select Duration</option>
                       {durations.map(d => <option key={d} value={d}>{d}</option>)}
                     </select>
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-semibold text-white/70 ml-1">Key Skills *</label>
                   <textarea
                     required
                     name="skills"
                     rows={2}
                     placeholder="React, Node.js, Python, Figma etc"
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-glow transition-colors resize-none placeholder:text-white/20"
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-semibold text-white/70 ml-1">Portfolio / GitHub / LinkedIn (optional)</label>
                   <input
                     name="portfolio"
                     placeholder="https://github.com/username"
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-glow transition-colors placeholder:text-white/20"
                   />
                 </div>

                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-white/70 ml-1">Upload Resume *</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-glow/50 hover:bg-cyan-glow/[0.02] transition-all group"
                    >
                      <Upload className="text-white/20 group-hover:text-cyan-glow mb-2 transition-colors" />
                      <span className="text-sm text-white/40">{fileName || 'Click to upload PDF / DOCX'}</span>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        required 
                        className="hidden" 
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                      />
                    </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-semibold text-white/70 ml-1">Previous Projects / Experience *</label>
                   <textarea
                     required
                     name="experience"
                     rows={3}
                     placeholder="Briefly describe your best projects or any prior experience..."
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-glow transition-colors resize-none placeholder:text-white/20"
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-semibold text-white/70 ml-1">Why join C Found? *</label>
                   <textarea
                     required
                     name="reason"
                     rows={3}
                     placeholder="What motivates you to join C Found specifically?"
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-glow transition-colors resize-none placeholder:text-white/20"
                   />
                 </div>

                 <button
                   type="submit"
                   disabled={isSubmitting}
                   className="w-full py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-extrabold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cyan-button-glow"
                 >
                   {isSubmitting ? (
                     <><Loader2 className="animate-spin" /> Submitting application...</>
                   ) : (
                     <><Sparkles size={18} /> Submit Application <ChevronRight size={18} /></>
                   )}
                 </button>
               </form>
            </motion.div>

            {/* Info Column */}
            <div className="lg:col-span-4 space-y-8">
              <div className="glass-card p-8">
                <h3 className="text-xl font-bold mb-6">Program Details</h3>
                <div className="space-y-6">
                   <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-cyan-glow/10 flex items-center justify-center shrink-0">
                         <span className="text-cyan-glow font-bold">1</span>
                      </div>
                      <div>
                        <div className="font-bold mb-1">Live Projects</div>
                        <p className="text-xs text-white/40 leading-relaxed">Work on real production codebases used by actual clients and users.</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-cyan-glow/10 flex items-center justify-center shrink-0">
                         <span className="text-cyan-glow font-bold">2</span>
                      </div>
                      <div>
                        <div className="font-bold mb-1">Expert Mentorship</div>
                        <p className="text-xs text-white/40 leading-relaxed">Regular code reviews and architectural guidance from senior developers.</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-cyan-glow/10 flex items-center justify-center shrink-0">
                         <span className="text-cyan-glow font-bold">3</span>
                      </div>
                      <div>
                        <div className="font-bold mb-1">Career Launchpad</div>
                        <p className="text-xs text-white/40 leading-relaxed">Internship certificates, referral letters, and placement support for top performers.</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-gradient-to-br from-soft-purple/10 to-transparent border border-white/5">
                 <h4 className="font-bold mb-4">Need help?</h4>
                 <p className="text-sm text-white/50 mb-6 leading-relaxed">If you face any issues with the application form, feel free to contact our recruitment team.</p>
                 <a href="mailto:admin.cfound@gmail.com" className="text-sm text-cyan-glow font-semibold flex items-center gap-2">
                   admin.cfound@gmail.com <ChevronRight size={14} />
                 </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
