import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  increment,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Briefcase, MapPin, DollarSign, Clock, CheckCircle2, ArrowRight, Edit3, Trash2, Plus, X, Search, Activity, AlertTriangle } from 'lucide-react';
import { sendApplicationEmail } from '../services/emailService';
import { getProfileCompletion } from '../lib/profileUtils';

import { toast } from 'react-hot-toast';

export default function Internship() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingInternship, setEditingInternship] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const getGuestId = () => {
    let guestId = localStorage.getItem('guest_id');

    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem('guest_id', guestId);
    }

    return guestId;
  };

  const [userApplications, setUserApplications] = useState<Set<string>>(new Set());

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const q = isAdmin 
        ? query(collection(db, 'opportunities'), where('type', '==', 'internship'))
        : query(collection(db, 'opportunities'), where('type', '==', 'internship'), where('status', 'in', ['active', 'featured']));
      const querySnapshot = await getDocs(q);
      const data = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const d: any = docSnap.data();

          const appQuery = query(
            collection(db, 'internshipApplications'),
            where('targetId', '==', docSnap.id)
          );

          const appSnap = await getDocs(appQuery);

          const applications = appSnap.size;

          const trendingScore =
            applications * 5 +
            (d.views || 0);

          return {
            id: docSnap.id,
            ...d,
            applications,
            trendingScore
          };
        })
      );
      setInternships(data);
    } catch (err) {
      console.error("Error fetching internships:", err);
      setInternships([]);
    } finally {
      setLoading(false);
    }
  };

  const trackView = async (oppId: string) => {
    try {
      const guestId = getGuestId();

      const viewRef = doc(
        db,
        'internshipViews',
        `${oppId}_${guestId}`
      );

      const existing = await getDoc(viewRef);

      if (existing.exists()) return;

      await setDoc(viewRef, {
        internshipId: oppId,
        guestId,
        viewedAt: serverTimestamp()
      });

      await updateDoc(
        doc(db, 'opportunities', oppId),
        {
          views: increment(1)
        }
      );
    } catch (err) {
      console.error('View tracking failed:', err);
    }
  };

  const fetchUserApplications = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'internshipApplications'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const appliedIds = new Set(snap.docs.map(doc => doc.data().targetId));
      setUserApplications(appliedIds);
    } catch (err) {
      console.error("Error fetching user applications:", err);
    }
  };

  useEffect(() => {
    fetchInternships();
    fetchUserApplications();

    const handleFocus = () => {
      fetchInternships();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };

  }, [isAdmin, user]);

  const handleShare = async (opp: any) => {
    const url = `${window.location.origin}/internship/${opp.id}`;

    try {
      await navigator.share({
        title: opp.title,
        text: 'Check out this internship opportunity',
        url
      });
    } catch {
      navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  const handleApply = async (opp: any) => {
    if (isAdmin) return;
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/internship' } } });
      return;
    }


    const completion = getProfileCompletion(profile);
    if (!completion.isComplete) {
      toast.error("Complete your profile before applying.");
      return;
    }

    if (userApplications.has(opp.id)) {
      toast.error("You have already applied for this opening.");
      return;
    }

    setApplyingId(opp.id);
    try {
      await addDoc(collection(db, 'internshipApplications'), {
        userId: user.uid,
        userEmail: user.email,
        phone: profile.phone || '',
        userName: profile.displayName,
        skills: profile.skills || [],
        resumeUrl: profile.resumeUrl || '',
        portfolioUrl: profile.portfolioUrl || profile.githubUrl || profile.linkedinUrl || '',
        type: 'internship',
        targetId: opp.id,
        targetTitle: opp.title,
        status: 'pending',
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      await updateDoc(
        doc(db, 'opportunities', opp.id),
        {
          applications: increment(1)
        }
      );
      
      setUserApplications(prev => new Set(prev).add(opp.id));

      try {
        await sendApplicationEmail({
          to_name: profile.displayName,
          to_email: user.email || '',
          role_title: opp.title,
          application_type: 'Internship',
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

      toast.success(`Application submitted successfully for ${opp.title}.`);
    } catch (err) {
      console.error(err);
      toast.error("Error submitting application.");
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
      fetchInternships();
      toast.success("Internship opening purged.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete opening. Access denied.");
    }
  };

  const filtered = internships
    .filter(i =>
      i.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort(
      (a, b) =>
        (b.trendingScore || 0) -
        (a.trendingScore || 0)
    );

  const completion = getProfileCompletion(profile);

  return (
    <>
    <Helmet>
      <title>Internship Programs | C FOUND Technologies</title>

      <meta
        name="description"
        content="Apply for software engineering, AI, game development, cybersecurity, and technology internship programs at C FOUND Technologies."
      />

      <meta
        property="og:title"
        content="Internship Programs | C FOUND Technologies"
      />

      <meta
        property="og:description"
        content="Explore paid internships, engineering labs, and technology training programs at C FOUND Technologies."
      />

      <meta
        property="og:image"
        content="https://www.cfound.in/og-image.png"
      />

      <meta
        property="twitter:title"
        content="Internship Programs | C FOUND Technologies"
      />

      <meta
        property="twitter:description"
        content="Explore paid internships, engineering labs, and technology training programs at C FOUND Technologies."
      />

      <meta
        property="twitter:image"
        content="https://www.cfound.in/og-image.png"
      />
    </Helmet>
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

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20">
          <div className="max-w-3xl">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-primary-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-6 block"
            >
              Junior Engineering / Laboratories
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-8xl font-black font-display tracking-tight text-[var(--text-main)] mb-8 uppercase italic"
            >
              Junior <span className="text-primary-600">Internships.</span>
            </motion.h1>
            <p className="text-[var(--text-muted)] text-lg font-medium leading-relaxed">
              Our training laboratories provide immersive experiences for junior engineers. Contribute to production-grade game engines and enterprise software under high-stack mentorship.
            </p>
          </div>
          <div className="flex items-center gap-6">
            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingInternship(null);
                  setShowModal(true);
                }}
                className="btn-primary flex items-center gap-2 group"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Create Opportunity
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16 border-b border-[var(--border-main)] pb-10">
           <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text"
              placeholder="Query laboratory database..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl pl-12 pr-6 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary-500/50 transition-all text-[var(--text-main)]"
            />
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            <Activity size={14} className="text-primary-600" /> Active Openings: {internships.length}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
            {[1, 2, 3, 4].map(n => <div key={n} className="h-64 bg-[var(--bg-card)] rounded-[2rem] md:rounded-[2rem] md:rounded-[2.5rem] animate-pulse border border-[var(--border-main)]" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-[var(--border-main)] rounded-[3rem] bg-[var(--bg-card)]/50">
            <Briefcase size={48} className="mx-auto text-[var(--text-muted)] mb-6 opacity-20" />
            <h3 className="text-xl font-bold font-display text-[var(--text-muted)] uppercase italic">No active opportunities in the laboratory sector.</h3>
            {isAdmin && <p className="text-[10px] font-bold uppercase tracking-widest text-primary-500 mt-4">Create an opening to begin recruitment protocol.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
            <AnimatePresence mode="popLayout">
              {filtered.map((opp, i) => (
                <motion.div 
                  layout
                  key={opp.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group p-5 md:p-10 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] md:rounded-[2rem] md:rounded-[2.5rem] hover:border-primary-600/30 transition-all flex flex-col justify-between card-hover shadow-xl ${opp.status === 'hidden' ? 'opacity-60 grayscale' : ''}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-8">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-primary-600/10 text-primary-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={12} />

                          {
                            opp.mode === 'Remote'
                              ? 'Remote'
                              : `${opp.mode} • ${opp.location}`
                          }
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                          opp.internshipType === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                          {
                            opp.internshipType === 'unpaid'
                              ? 'NO FEE'
                              : opp.internshipType === 'paid'
                                ? 'PAID'
                                : 'TRAINING PROGRAM'
                          }
                        </span>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingInternship(opp);
                              setShowModal(true);
                            }}
                            className="p-2.5 bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-primary-600 rounded-xl transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(opp.id)}
                            className={`p-2.5 border rounded-xl transition-all ${deletingId === opp.id ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-red-500'}`}
                            title={deletingId === opp.id ? "Confirm Purge" : "Purge Opening"}
                          >
                            <Trash2 size={14} className={deletingId === opp.id ? 'animate-bounce' : ''} />
                          </button>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl md:text-2xl font-black font-display mb-6 tracking-tight text-[var(--text-main)] group-hover:text-primary-600 transition-colors uppercase italic">{opp.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mb-6 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">

                      <div className="flex items-center gap-1">
                        👁 {opp.views || 0} Views
                      </div>

                      <div className="flex items-center gap-1">
                        📥 {opp.applications || 0} Applied
                      </div>

                      {opp.trendingScore > 20 && (
                        <div className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                          🔥 Trending
                        </div>
                      )}

                    </div>
                    <div className="space-y-4 mb-10">
                      {(Array.isArray(opp.skills)
                        ? opp.skills
                        : [])?.slice(0, 2).map((req: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 text-xs text-[var(--text-muted)]">
                          <CheckCircle2 size={14} className="text-primary-600 mt-0.5 flex-shrink-0" />
                          <span className="font-bold uppercase tracking-tight">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6 border-t border-[var(--border-main)]">
                    <div className="text-xl font-black font-display text-[var(--text-main)] uppercase">
                      {
                        opp.internshipType === 'paid'
                          ? `₹${opp.stipend}/month`
                          : opp.internshipType === 'training'
                            ? `Fee: ₹${opp.trainingFee}`
                            : 'Unpaid Internship'
                      }
                    </div>
                    
                    {!isAdmin ? (
                      <div className="flex items-center gap-3 flex-wrap">

                        <Link
                          to={`/internship/${opp.slug}-${opp.id}`}
                          className="px-5 py-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-main)] text-[10px] font-black uppercase tracking-widest hover:border-primary-500 transition-all"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleShare(opp)}
                          className="px-5 py-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-main)] text-[10px] font-black uppercase tracking-widest hover:border-primary-500 transition-all"
                        >
                          Share
                        </button>

                        <button 
                          onClick={() => handleApply(opp)}
                          disabled={applyingId === opp.id || userApplications.has(opp.id) || !completion.isComplete}
                          className={`btn-primary flex items-center gap-2 px-5 py-3 md:px-8 transition-all ${
                            userApplications.has(opp.id) 
                              ? 'opacity-50 cursor-not-allowed bg-green-600 border-green-600' 
                              : !completion.isComplete 
                                ? 'opacity-50 cursor-not-allowed grayscale' 
                                : 'group'
                          }`}
                        >
                          {applyingId === opp.id 
                            ? "Applying..." 
                            : userApplications.has(opp.id) 
                              ? "Applied" 
                              : !completion.isComplete 
                                ? "Profile Incomplete" 
                                : <>Apply Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></>}
                        </button>

                      </div>
                      ) : (
                      <div className="text-[9px] font-black uppercase tracking-widest text-primary-500 bg-primary-500/5 px-4 py-2 rounded-xl border border-primary-500/10">
                        Admin Mode
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <InternshipModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        internship={editingInternship} 
        onSuccess={fetchInternships}
      />
    </div>
    </>
  );
}

function InternshipModal({ isOpen, onClose, internship, onSuccess }: any) {
  const [formData, setFormData] = useState({
    title: '',
    location: 'Remote',
    stipend: '',
    trainingFee: '',
    internshipType: 'unpaid',
    duration: '',
    mode: 'Remote',
    skills: [],
    description: '',
    status: 'active',
    type: 'internship'
  });
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (internship) {
      setFormData({
        ...internship,
        mode: internship.mode || 'Remote',
        skills: Array.isArray(internship.skills)
          ? internship.skills
          : [],

        description: internship.description || '',
        internshipType: internship.internshipType || 'unpaid'
      });
    } else {
      setFormData({
        title: '',
        location: 'Remote',
        stipend: '',
        trainingFee: '',
        internshipType: 'unpaid',
        duration: '',
        mode: 'Remote',
        skills: [],
        description: '',
        status: 'active',
        type: 'internship'
      });
    }
  }, [internship, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,

        slug: (formData.title || 'internship')
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-'),

        skills: formData.skills,

        description: formData.description
      };

      if (internship?.id) {
        await updateDoc(doc(db, 'opportunities', internship.id), {
          ...data,
          updatedAt: serverTimestamp()
        });
      } else {
        console.log(data);

        await addDoc(collection(db, 'opportunities'), {
          ...data,
          views: 0,
          applications: 0,
          clicks: 0,
          trendingScore: 0,
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
            className="w-full max-w-2xl bg-[var(--bg-main)] border border-[var(--border-main)] rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <div className="p-5 md:p-10 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-card)]">
              <div>
                <h2 className="text-xl md:text-2xl font-black font-display text-[var(--text-main)] uppercase italic tracking-tight">
                  {internship ? 'Edit' : 'Create'} <span className="text-primary-600">Internship.</span>
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">Recruitment Management Mode</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 md:p-10 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Position Title</label>
                  <input 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Graphics Engineering Intern"
                    className="input-main"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Program Type</label>
                  <select 
                    value={formData.internshipType}
                    onChange={(e) => setFormData({...formData, internshipType: e.target.value})}
                    className="input-main"
                  >
                    <option value="paid">Paid Internship</option>
                    <option value="unpaid">Unpaid Internship</option>
                    <option value="training">Training Program</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">
                    Work Mode
                  </label>

                  <select
                    value={formData.mode}
                    onChange={(e) => {
                      const value = e.target.value;

                      setFormData({
                        ...formData,
                        mode: value,
                        location: value === 'Remote' ? 'Remote' : ''
                      });
                    }}
                    className="input-main"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>

                {formData.mode !== 'Remote' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">
                      Office Location
                    </label>

                    <input 
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Chennai, India"
                      className="input-main"
                    />
                  </div>
                )}
              </div>

              {formData.internshipType === 'paid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">
                      Monthly Stipend
                    </label>

                    <input
                      required
                      value={formData.stipend}
                      onChange={(e) => setFormData({...formData, stipend: e.target.value})}
                      placeholder="5000"
                      className="input-main"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">
                      Duration
                    </label>

                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      className="input-main"
                    >
                      <option value="">Select Duration</option>
                      <option value="1 Month">1 Month</option>
                      <option value="2 Months">2 Months</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months">6 Months</option>
                      <option value="12 Months">12 Months</option>
                    </select>

                  </div>

                </div>
              )}

              {formData.internshipType === 'unpaid' && (
                <div>

                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">
                    Duration
                  </label>

                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="input-main"
                  >
                    <option value="">Select Duration</option>
                    <option value="1 Month">1 Month</option>
                    <option value="2 Months">2 Months</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="12 Months">12 Months</option>
                  </select>

                </div>
              )}

              {formData.internshipType === 'training' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">
                      Training Fee (₹)
                    </label>

                    <input
                      required
                      value={formData.trainingFee}
                      onChange={(e) => setFormData({...formData, trainingFee: e.target.value})}
                      placeholder="2999"
                      className="input-main"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">
                      Duration
                    </label>

                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      className="input-main"
                    >
                      <option value="">Select Duration</option>
                      <option value="1 Month">1 Month</option>
                      <option value="2 Months">2 Months</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months">6 Months</option>
                      <option value="12 Months">12 Months</option>
                    </select>

                  </div>

                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">
                  Skills Required
                </label>

                <div className="flex gap-3 mb-4">

                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Enter skill"
                    className="input-main flex-1"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (!skillInput.trim()) return;

                      setFormData({
                        ...formData,
                        skills: [...formData.skills, skillInput.trim()]
                      });

                      setSkillInput('');
                    }}
                    className="w-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center"
                  >
                    <Plus size={18} />
                  </button>

                </div>

                <div className="flex flex-wrap gap-3">

                  {formData.skills.map((skill: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600/10 border border-primary-600/20 text-primary-600 text-xs font-bold uppercase"
                    >
                      {skill}

                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            skills: formData.skills.filter((_: any, i: number) => i !== index)
                          });
                        }}
                      >
                        <X size={14} />
                      </button>

                    </div>
                  ))}

                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">
                  Job Description
                </label>

                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value
                    })
                  }
                  placeholder="Describe responsibilities, workflow, expectations, and internship details..."
                  className="input-main min-h-[180px]"
                />
              </div>

              <div className="pt-6 border-t border-[var(--border-main)] flex justify-end gap-4">
                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                  {internship ? 'Save Changes' : 'Create Opening'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
