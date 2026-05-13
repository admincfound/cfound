import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, ShieldCheck, Award, FileCheck, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function Certificates() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [certId, setCertId] = useState('');
  const [result, setResult] = useState<'valid' | 'invalid' | null>(null);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId) return;
    
    setIsVerifying(true);
    setResult(null);
    
    // Simulate API call
    setTimeout(() => {
      setIsVerifying(false);
      // For demo: IDs starting with 'CF' are valid
      if (certId.toUpperCase().startsWith('CF')) {
        setResult('valid');
      } else {
        setResult('invalid');
      }
    }, 1500);
  };

  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-24">
          <h1 className="text-4xl md:text-6xl font-bold mb-8 italic">Achievement <br /> <span className="text-gradient">Recognition</span></h1>
          <p className="text-white/50 text-xl leading-relaxed">
            Every successful internship journey at C Found culminates in a professional certification, validating your practical industry expertise.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
             <div className="glass-card p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-cyan-glow opacity-5">
                   <ShieldCheck size={120} />
                </div>
                <h2 className="text-2xl font-bold mb-8">Verify Your Certificate</h2>
                <p className="text-white/40 mb-8 text-sm leading-relaxed">
                  Enter your unique Certificate ID to verify the authenticity of your achievement and view your program details.
                </p>
                
                <form onSubmit={handleVerify} className="relative">
                   <input 
                      value={certId}
                      onChange={(e) => setCertId(e.target.value)}
                      placeholder="Enter ID (e.g. CF-2024-XXXX)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-cyan-glow transition-all placeholder:text-white/20 mb-4"
                   />
                   <button 
                      type="submit"
                      disabled={isVerifying}
                      className="w-full py-4 rounded-xl bg-cyan-glow text-black font-extrabold flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50"
                   >
                     {isVerifying ? (
                       <><Loader2 className="animate-spin" /> Verifying Records...</>
                     ) : (
                       <><Search size={20} /> Verify Now</>
                     )}
                   </button>
                </form>

                {result === 'valid' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm flex items-center gap-3"
                  >
                    <CheckCircle size={18} /> Verification Successful. Record Found.
                  </motion.div>
                )}
                {result === 'invalid' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3"
                  >
                    <AlertCircle size={18} /> No record found for this ID.
                  </motion.div>
                )}
             </div>

             <div className="grid grid-cols-2 gap-6">
                <div className="glass-card p-6">
                   <Award className="text-cyan-glow mb-4" />
                   <div className="text-2xl font-bold">Industry Standard</div>
                   <p className="text-[10px] text-white/30 uppercase tracking-widest mt-2">Globally Recognized</p>
                </div>
                <div className="glass-card p-6">
                   <FileCheck className="text-soft-purple mb-4" />
                   <div className="text-2xl font-bold">Tamper Proof</div>
                   <p className="text-[10px] text-white/30 uppercase tracking-widest mt-2">Digtally Verified</p>
                </div>
             </div>
          </div>

          <div className="relative group">
             <div className="aspect-[4/3] rounded-3xl overflow-hidden glass-card p-4">
                <div className="w-full h-full border border-white/5 bg-white/[0.02] rounded-2xl flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 flex items-center justify-center opacity-10 blur-3xl pointer-events-none">
                      <div className="w-64 h-64 bg-cyan-glow rounded-full" />
                   </div>
                   <div className="text-center relative z-10 px-8">
                      <div className="w-16 h-16 rounded-full bg-cyan-glow/10 flex items-center justify-center mx-auto mb-6">
                         <ShieldCheck className="text-cyan-glow" size={32} />
                      </div>
                      <div className="text-3xl font-serif italic mb-2 tracking-tight">Certificate of Excellence</div>
                      <div className="text-xs text-white/40 uppercase tracking-[0.3em] mb-12">Professional Internship Completion</div>
                      
                      <div className="w-32 h-0.5 bg-white/10 mx-auto mb-12" />
                      
                      <div className="flex justify-between items-end">
                        <div className="text-left">
                           <div className="text-[10px] text-white/20 uppercase tracking-widest mb-1">Authenticated by</div>
                           <div className="text-sm font-bold">C Found Tech Leads</div>
                        </div>
                        <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center">
                           <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-[10px] text-white/20 font-bold">SEAL</div>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
             <div className="absolute -top-6 -right-6 w-32 h-32 bg-cyan-glow/10 blur-[60px] pointer-events-none" />
             <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-soft-purple/10 blur-[60px] pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
