import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, MapPin, IndianRupee, Clock, CheckCircle2, ArrowRight, Zap, Target, Rocket, ShieldCheck, Edit3, Trash2, Plus, X, Search, Activity, AlertTriangle } from 'lucide-react';
import { sendApplicationEmail } from '../services/emailService';
import { getProfileCompletion } from '../lib/profileUtils';

import { toast } from 'react-hot-toast';

export default function Careers() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [userApplications, setUserApplications] = useState<Set<string>>(new Set());

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const q = isAdmin 
        ? query(collection(db, 'opportunities'), where('type', '==', 'job'))
        : query(collection(db, 'opportunities'), where('type', '==', 'job'), where('status', 'in', ['active', 'featured']));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserApplications = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'jobApplications'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const appliedIds = new Set(snap.docs.map(doc => doc.data().targetId));
      setUserApplications(appliedIds);
    } catch (err) {
      console.error("Error fetching user applications:", err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchUserApplications();
  }, [isAdmin, user]);

  const handleApply = async (opp: any) => {
    if (isAdmin) return;
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/careers' } } });
      return;
    }

    const completion = getProfileCompletion(profile);
    if (!completion.isComplete) {
      toast.error("Complete your profile before applying.");
      return;
    }

    if (userApplications.has(opp.id)) {
      toast.error("You have already applied for this position.");
      return;
    }

    setApplyingId(opp.id);
    try {
      await addDoc(collection(db, 'jobApplications'), {
        userId: user.uid,
        userEmail: user.email,
        phone: profile.phone || '',
        userName: profile.displayName,
        skills: profile.skills || [],
        resumeUrl: profile.resumeUrl || '',
        portfolioUrl: profile.portfolioUrl || profile.githubUrl || profile.linkedinUrl || '',
        type: 'job',
        targetId: opp.id,
        targetTitle: opp.title,
        status: 'pending',
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      
      setUserApplications(prev => new Set(prev).add(opp.id));

      try {
        await sendApplicationEmail({
          to_name: profile.displayName,
          to_email: user.email || '',
          role_title: opp.title,
          application_type: 'Job',
          user_name: profile.displayName,
          phone: profile.phone || 'N/A',
          skills: profile.skills ? profile.skills.join(', ') : 'N/A',
          resume_url: profile.resumeUrl || 'N/A',
          portfolio_url: profile.portfolioUrl || profile.githubUrl || profile.linkedinUrl || 'N/A',
          user_id: user.uid,
          profile: profile,
        });
      } catch (e) {
        console.error("Confirmation email failed", e);
      }

      toast.success(`Application submitted for ${opp.title}. Our team will review your credentials shortly.`);
    } catch (err) {
      console.error(err);
      toast.error("Application submission failed.");
    } finally {
      setApplyingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }

    try {
      await deleteDoc(doc(db, 'opportunities', id));
      setDeletingId(null);
      fetchJobs();
      toast.success("Role purged from database.");
    } catch (err) {
      console.error(err);
      toast.error("Access denied: Could not delete role.");
    }
  };

  const filtered = jobs.filter(j => j.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const completion = getProfileCompletion(profile);

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto">
        {!isAdmin && user && !completion.isComplete && (
          <div className="mb-10 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-red-500">
              <AlertTriangle size={24} />
              <div>
                <h3 className="font-bold text-lg">Incomplete Profile</h3>
                <p className="text-sm opacity-80">Complete your profile before applying or enrolling. Missing: {completion.missing.length} section(s).</p>
              </div>
            </div>
            <Link to="/profile" className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 transition-colors whitespace-nowrap">
              Complete Profile
            </Link>
          </div>
        )}

        <div className="mb-24 flex flex-col md:flex-row items-center md:items-end justify-between gap-4 md:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1"
            >
              <span className="text-primary-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-4 block underline decoration-primary-600/30 decoration-4 underline-offset-8">Career Opportunities / HQ</span>
              <h1 className="text-5xl md:text-8xl font-black font-display tracking-tight text-[var(--text-main)] mb-8 leading-none italic uppercase">Join our <span className="text-primary-600">Core Team.</span></h1>
              <p className="text-[var(--text-muted)] text-lg font-medium leading-relaxed max-w-2xl">
                We are building the next generation of digital infrastructure. If you are passionate about engineering excellence and innovation, we want to hear from you.
              </p>
            </motion.div>
            
            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingJob(null);
                  setShowModal(true);
                }}
                className="btn-primary flex items-center gap-2 group"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Manage Roles
              </button>
            )}
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16 border-b border-[var(--border-main)] pb-10">
           <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text"
              placeholder="Query career records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl pl-12 pr-6 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary-500/50 transition-all text-[var(--text-main)]"
            />
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            <Activity size={14} className="text-emerald-500" /> System Online / {jobs.length} Active Positions
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-32">
           <BenefitCard icon={<Zap size={24} />} title="Growth Mindset" desc="Structured career paths and mentorship from industry veterans." />
           <BenefitCard icon={<Target size={24} />} title="Global Impact" desc="Contribute to high-performance systems used at planetary scale." />
           <BenefitCard icon={<ShieldCheck size={24} />} title="Premium Benefits" desc="Competitive compensation, health coverage, and flexible work environments." />
        </div>

        <div className="space-y-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2 md:px-10">
            <h2 className="text-3xl font-black font-display text-[var(--text-main)] flex items-center gap-4 uppercase italic">
              Open Positions
            </h2>
            <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-6 py-2 border border-[var(--border-main)] rounded-full bg-[var(--bg-card)] shadow-sm">
              {jobs.length} Active Modules
            </div>
          </div>
          
          {loading ? (
             <div className="space-y-4">
               {[1, 2].map(n => <div key={n} className="h-32 bg-[var(--bg-card)] rounded-[2.5rem] animate-pulse border border-[var(--border-main)]" />)}
             </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              <AnimatePresence mode="popLayout">
                {filtered.map((opp, i) => (
                  <motion.div 
                    layout
                    key={opp.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group p-5 md:p-6 md:p-10 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] md:rounded-[3rem] hover:border-primary-600/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 card-hover shadow-2xl ${opp.status === 'hidden' ? 'opacity-60 grayscale' : ''}`}
                  >
                    <div className="flex items-center gap-5 md:gap-6 md:p-10 flex-1">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-primary-600/10 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-xl group-hover:rotate-6">
                         <Briefcase size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-3xl font-black font-display tracking-tight text-[var(--text-main)] group-hover:text-primary-600 transition-colors mb-4 uppercase italic">{opp.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 md:gap-8 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-6">
                          <span className="flex items-center gap-2"><MapPin size={16} className="text-primary-600"/> {opp.location}</span>
                          <span className="flex items-center gap-2"><IndianRupee size={16} className="text-primary-600"/> {opp.compModel === 'revenue' ? 'Revenue Share' : (opp.salary?.startsWith('₹') ? opp.salary : `₹${opp.salary}`)}</span>
                          <span className="flex items-center gap-2 transition-colors group-hover:text-primary-600"><Clock size={16} className="text-primary-600"/> {opp.timing || opp.type}</span>
                        </div>
                        {opp.description && (
                          <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest max-w-xl line-clamp-2 opacity-50">{opp.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {isAdmin && (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                              setEditingJob(opp);
                              setShowModal(true);
                            }}
                            className="p-4 bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-primary-600 hover:border-primary-600/30 rounded-2xl transition-all shadow-xl"
                            title="Edit Position"
                          >
                            <Edit3 size={20} />
                          </button>
                          <button 
                            onClick={() => handleDelete(opp.id)}
                            className={`p-4 border rounded-2xl transition-all shadow-xl ${deletingId === opp.id ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/30'}`}
                            title={deletingId === opp.id ? "Confirm Purge" : "Purge Position"}
                          >
                            <Trash2 size={20} className={deletingId === opp.id ? 'animate-bounce' : ''} />
                          </button>
                        </div>
                      )}
                      
                      {!isAdmin ? (
                        <button 
                          onClick={() => handleApply(opp)}
                          disabled={applyingId === opp.id || userApplications.has(opp.id) || !completion.isComplete}
                          className={`btn-primary w-full md:w-auto px-6 py-3 md:px-12 md:py-5 flex items-center justify-center gap-3 transition-all ${
                            userApplications.has(opp.id) 
                              ? 'opacity-50 cursor-not-allowed bg-green-600 border-green-600' 
                              : !completion.isComplete 
                                ? 'opacity-50 cursor-not-allowed grayscale' 
                                : 'active:scale-95 group'
                          }`}
                        >
                          {applyingId === opp.id ? "Applying..." : userApplications.has(opp.id) ? "Applied" : !completion.isComplete ? "Profile Incomplete" : <>Apply Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                      ) : (
                        <div className="hidden md:block text-[9px] font-black uppercase tracking-widest text-primary-500 bg-primary-500/5 px-6 py-3 rounded-2xl border border-primary-500/10">
                          Administrative Access
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-24 text-center bg-[var(--bg-card)] border border-[var(--border-main)] border-dashed rounded-[4rem]">
               <Rocket size={48} className="mx-auto text-[var(--text-muted)] mb-8 opacity-20" />
               <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-sm opacity-40 italic">System Idle / No Active Roles Detected</p>
            </div>
          )}
        </div>
      </div>

      <JobModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        job={editingJob} 
        onSuccess={fetchJobs}
      />
    </div>
  );
}

function JobModal({ isOpen, onClose, job, onSuccess }: any) {
  const [formData, setFormData] = useState({
    title: '',
    location: 'Remote',
    salary: '',
    type: 'full-time',
    timing: 'Morning Shift',
    compModel: 'fixed',
    description: '',
    requirements: '',
    status: 'active',
    opportunity_type: 'job'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job) {
      setFormData({
        ...job,
        requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : job.requirements,
        opportunity_type: 'job',
        compModel: job.compModel || 'fixed',
        timing: job.timing || 'Morning Shift',
      });
    } else {
      setFormData({
        title: '',
        location: 'Remote',
        salary: '',
        type: 'full-time',
        timing: 'Morning Shift',
        compModel: 'fixed',
        description: '',
        requirements: '',
        status: 'active',
        opportunity_type: 'job'
      });
    }
  }, [job, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        type: formData.opportunity_type === 'job' ? 'job' : 'internship', // Ensure type is correct even if called differently
        requirements: formData.requirements.split('\n').filter(r => r.trim())
      };

      // In the database 'opportunities' collection handles both 'type' == 'job' and 'internship'
      // But for Careers page we force it to be 'job'
      const finalData = { ...data, type: 'job' };

      if (job?.id) {
        await updateDoc(doc(db, 'opportunities', job.id), {
          ...finalData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'opportunities'), {
          ...finalData,
          createdAt: serverTimestamp()
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-2xl bg-[var(--bg-main)] border border-[var(--border-main)] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <div className="p-6 md:p-10 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-card)]">
              <div>
                <h2 className="text-2xl font-black font-display text-[var(--text-main)] uppercase italic tracking-tight">
                  {job ? 'Edit' : 'Create'} <span className="text-primary-600">Position.</span>
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">Role Management Mode</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Position Title</label>
                  <input 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Lead Neural Architect"
                    className="input-main"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Deployment Location</label>
                  <input 
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Remote / Hybrid / On-site"
                    className="input-main"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Compensation Basis</label>
                  <select 
                    value={formData.compModel}
                    onChange={(e) => setFormData({...formData, compModel: e.target.value})}
                    className="input-main"
                  >
                    <option value="fixed">Fixed Salary</option>
                    <option value="revenue">Revenue Basis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Timing / Shift</label>
                  <input 
                    required
                    value={formData.timing}
                    onChange={(e) => setFormData({...formData, timing: e.target.value})}
                    placeholder="e.g., 9AM - 6PM / Morning"
                    className="input-main"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">
                    {formData.compModel === 'revenue' ? 'Projected Share' : 'Salary Range (INR)'}
                  </label>
                  <input 
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    placeholder={formData.compModel === 'revenue' ? "5-10% of Revenue" : "₹50k - ₹80k / Mo"}
                    className="input-main"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Contract Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="input-main"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Job Description (JD)</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Strategic overview of the role..."
                  className="input-main min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Execution Requirements (One per line)</label>
                <textarea 
                  required
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  placeholder="Advanced Distributed Systems Expertise&#10;Neural Network Design Mastery"
                  className="input-main min-h-[150px] font-mono"
                />
              </div>

              <div className="pt-6 border-t border-[var(--border-main)] flex justify-end gap-4">
                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                  {job ? 'Save Changes' : 'Create Position'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function BenefitCard({ icon, title, desc }: any) {
  return (
    <div className="p-6 md:p-10 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] md:rounded-[3rem] hover:border-primary-600/30 transition-all card-hover group shadow-2xl">
      <div className="w-16 h-16 bg-primary-600/10 rounded-2xl flex items-center justify-center text-primary-600 mb-8 transition-all group-hover:bg-primary-600 group-hover:text-white group-hover:rotate-6 shadow-lg shadow-primary-600/5">{icon}</div>
      <h4 className="text-2xl font-black font-display text-[var(--text-main)] mb-4 uppercase italic tracking-tight">{title}</h4>
      <p className="text-[var(--text-muted)] text-sm font-medium leading-relaxed opacity-80">{desc}</p>
    </div>
  );
}
