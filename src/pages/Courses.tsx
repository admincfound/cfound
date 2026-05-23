import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, setDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Star, Clock, Users, PlayCircle, Plus, X, Search, Filter, ShieldCheck, Zap, Monitor, Cpu, Database, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

import { sendApplicationEmail } from '../services/emailService';
import { getProfileCompletion } from '../lib/profileUtils';

const categories = [
  'All',

  // Development
  'Game Development',
  'AI & ML',
  'Full Stack',
  'Cybersecurity',
  'Data Science',
  'Cloud Computing',
  'Mobile App Development',

  // Design
  'UI/UX Design',
  'Graphic Design',
  '3D Animation',
  'Video Editing',

  // Software
  'Blender',
  'AutoCAD',
  'Photoshop',
  'Illustrator',
  'Premiere Pro',
  'After Effects',
  'Figma',
  'Maya',

  // Engines
  'Unity',
  'Unreal Engine',

  // Extra
  'Digital Marketing',
  'Ethical Hacking',
  'Python Development'
];

export default function Courses() {
  const { isAdmin, user, profile } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [userEnrollments, setUserEnrollments] = useState<Record<string, number>>({});
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const q = isAdmin 
        ? query(collection(db, 'courses'))
        : query(collection(db, 'courses'), where('status', '==', 'active'));
        
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(data);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEnrollments = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'courseEnrollments'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const enrollments: Record<string, number> = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.cooldownExpiry) {
          const expiryTime = new Date(data.cooldownExpiry).getTime();
          if (!enrollments[data.itemId] || expiryTime > enrollments[data.itemId]) {
            enrollments[data.itemId] = expiryTime;
          }
        }
      });
      setUserEnrollments(enrollments);
    } catch (err) {
      console.error("Error fetching user enrollments:", err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchUserEnrollments();
  }, [isAdmin, user]);

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }

    try {
      await deleteDoc(doc(db, 'courses', id));
      setDeletingId(null);
      fetchCourses();
      toast.success("Curriculum record erased.");
    } catch (err) {
      console.error(err);
      toast.error("Process failed. Access restricted.");
    }
  };

  const handleEnroll = async (c: any) => {
    if (!user) {
      toast.error("Identification required. Please login.");
      navigate('/login', { state: { from: { pathname: '/courses' } } });
      return;
    }

    const completion = getProfileCompletion(profile);
    if (!completion.isComplete) {
      toast.error("Complete your profile before enrolling.");
      return;
    }

    const now = Date.now();
    const expiry = userEnrollments[c.id];
    if (expiry && now < expiry) {
      toast.error("You are already enrolled or in cooldown for this course.");
      return;
    }

    setEnrollingId(c.id);
    try {
      const cooldownExpiry = new Date();
      cooldownExpiry.setDate(cooldownExpiry.getDate() + 30); // 30 day cooldown

      const existingQuery = query(
        collection(db, 'courseEnrollments'),
        where('userId', '==', user.uid),
        where('itemId', '==', c.id)
      );

      const existingSnap = await getDocs(existingQuery);

      if (!existingSnap.empty) {
        toast.error("Already enrolled in this course.");
        setEnrollingId(null);
        return;
      }

      const enrollmentId = `${user.uid}_${c.id}`;

      await setDoc(
        doc(db, 'courseEnrollments', enrollmentId),
        {
          userId: user.uid,
          userEmail: user.email,
          userName: profile?.displayName || user.email,
          phone: profile?.phone || '',
          skills: profile?.skills || [],
          resumeUrl: profile?.resumeUrl || '',
          portfolioUrl:
            profile?.portfolioUrl ||
            profile?.githubUrl ||
            profile?.linkedinUrl ||
            '',
          type: 'course',
          itemId: c.id,
          targetTitle: c.title,
          status: 'enrolled',
          appliedAt: new Date().toISOString(),
          cooldownExpiry: cooldownExpiry.toISOString(),
        }
      );

      setUserEnrollments(prev => ({
        ...prev,
        [c.id]: cooldownExpiry.getTime()
      }));

      try {
        await sendApplicationEmail({
          to_name: profile?.displayName || 'Student',
          to_email: user.email || '',
          role_title: c.title,
          application_type: 'Course Enrollment',
          user_name: profile?.displayName || 'Student',
          phone: profile?.phone || 'N/A',
          skills: profile?.skills ? profile.skills.join(', ') : 'N/A',
          resume_url: profile?.resumeUrl || 'N/A',
          portfolio_url:
            profile?.portfolioUrl ||
            profile?.githubUrl ||
            profile?.linkedinUrl ||
            'N/A',
          user_id: user.uid,
          profile: profile,
        });

        toast.success("Enrollment completed successfully.");
      } catch (e) {
        console.error("Confirmation email failed", e);

        toast.error(
          "Enrollment saved but confirmation email failed."
        );
      }

    } catch (err) {
      console.error(err);
      toast.error("Enrollment failed.");
    } finally {
      setEnrollingId(null);
    }
  };

  const filtered = (filter === 'All' ? courses : courses.filter(c => c.category === filter))
    .filter(c => c.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  const completion = getProfileCompletion(profile);

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto">
        {!isAdmin && user && !completion.isComplete && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
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

        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8"
          >
            <div className="flex-1">
              <span className="text-primary-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-4 block underline decoration-4 underline-offset-8">Academy / Skill Sector</span>
              <h1 className="text-4xl md:text-8xl font-black font-display tracking-tight text-[var(--text-main)] mb-8 leading-none italic uppercase">Master the <span className="text-primary-600">Machine.</span></h1>
              <p className="text-[var(--text-muted)] max-w-xl text-lg font-medium italic opacity-80">Industrial-grade training protocols for the next generation of digital architects and systems engineers.</p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingCourse(null);
                  setShowModal(true);
                }}
                className="btn-primary flex items-center gap-2 group"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Initialize Course
              </button>
            )}
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-8 mb-20 border-b border-[var(--border-main)] pb-12">
          <div className="relative w-full">

            <div className="category-fade-left"></div>
            <div className="category-fade-right"></div>

            <div
              className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 w-full"
              onWheel={(e) => {
                e.currentTarget.scrollLeft += e.deltaY;
              }}
            >
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`min-w-[145px] h-[58px] flex items-center justify-center text-center px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.18em] border transition-all shrink-0 whitespace-normal snap-start ${
                  filter === c 
                  ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/30 border-primary-500' 
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-main)] hover:border-primary-600/30'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          </div>
          
          <div className="relative w-full md:w-[420px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text"
              placeholder="Search curriculum database..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl pl-14 pr-6 py-4 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary-500/50 transition-all text-[var(--text-main)] shadow-inner"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:p-10">
            {[1, 2, 3].map(n => <div key={n} className="h-[450px] bg-[var(--bg-card)] rounded-[2rem] md:rounded-[3rem] animate-pulse border border-[var(--border-main)]" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-40 border border-dashed border-[var(--border-main)] rounded-[4rem] bg-[var(--bg-card)]/30 backdrop-blur-sm">
            <BookOpen size={64} className="mx-auto text-[var(--text-muted)] mb-8 opacity-10" />
            <h3 className="text-xl md:text-2xl font-black font-display text-[var(--text-muted)] uppercase italic tracking-tighter">Sector Offline / No Courses Detected</h3>
            {isAdmin && <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary-500 mt-6">Deploy new training modules to active directory.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
            <AnimatePresence mode="popLayout">
              {filtered.map((c, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.1 }}
                  key={c.id}
                  className={`group relative min-h-[520px] bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] md:rounded-[3rem] overflow-hidden hover:border-primary-600/30 transition-all card-hover flex flex-col shadow-2xl ${c.status === 'hidden' ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className="relative h-56 overflow-hidden rounded-t-[2rem] md:rounded-t-[3rem]">
                    <img 
                      src={c.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"} 
                      alt={c.title}
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute top-5 left-5 flex gap-2">
                       <span className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-xl border border-primary-500/50">
                         {c.level || 'Intermediate'}
                       </span>
                    </div>

                    <div className="absolute bottom-6 left-8 flex items-center gap-4">
                       <div className="flex items-center gap-1.5 text-white text-[9px] font-black uppercase tracking-widest">
                          <Zap size={12} className="text-yellow-400" /> {c.price ? `₹${c.price}` : 'Premium'}
                       </div>
                    </div>

                    {isAdmin && (
                      <div className="absolute top-5 right-5 flex gap-3">
                        <button 
                          onClick={() => {
                            setEditingCourse(c);
                            setShowModal(true);
                          }}
                          className="p-3 bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-main)] text-[var(--text-main)] rounded-2xl hover:bg-primary-600 hover:text-white transition-all shadow-2xl"
                        >
                          <Zap size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className={`p-3 backdrop-blur-md border rounded-2xl transition-all shadow-2xl ${deletingId === c.id ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-[var(--bg-card)]/90 border-[var(--border-main)] text-[var(--text-main)] hover:bg-red-600 hover:text-white'}`}
                        >
                          <Database size={14} className={deletingId === c.id ? 'animate-bounce' : ''} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-6 md:p-10 flex-1 flex flex-col">
                    <div className="flex items-center gap-6 mb-8 text-[var(--text-muted)] text-[9px] uppercase font-black tracking-widest opacity-60">
                       <div className="flex items-center gap-1.5"><Clock size={12} className="text-primary-600"/> {c.duration || '24h Content'}</div>
                       <div className="flex items-center gap-1.5"><Users size={12} className="text-primary-600"/> {c.students || '1.2k'} Logged</div>
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-black font-display text-[var(--text-main)] mb-6 tracking-tight leading-tight break-words group-hover:text-primary-600 transition-colors uppercase italic underline-offset-[12px] group-hover:underline decoration-primary-600/30">
                      {c.title}
                    </h3>
                    
                    <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6 line-clamp-3 font-medium opacity-80">
                      {c.description}
                    </p>

                    <div className="mt-auto pt-6 border-t border-[var(--border-main)] flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-1 text-yellow-400">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} fill="currentColor" />)}
                        <span className="text-[9px] font-black text-[var(--text-muted)] ml-2 uppercase tracking-tighter">(4.9/5)</span>
                      </div>
                      
                      <button 
                        onClick={() => handleEnroll(c)}
                        disabled={enrollingId === c.id || (userEnrollments[c.id] && Date.now() < userEnrollments[c.id]) || !completion.isComplete}
                        className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all group/link ${
                          userEnrollments[c.id] && Date.now() < userEnrollments[c.id] 
                            ? 'text-green-500 opacity-60 cursor-not-allowed' 
                            : !completion.isComplete 
                              ? 'text-[var(--text-muted)] cursor-not-allowed grayscale' 
                              : 'text-primary-600 hover:gap-6'
                        }`}
                      >
                        {enrollingId === c.id ? 'Processing...' : (userEnrollments[c.id] && Date.now() < userEnrollments[c.id]) ? 'Enrolled' : !completion.isComplete ? 'Profile Incomplete' : <>Enroll <PlayCircle size={14} className="group-hover/link:scale-125 transition-transform" /></>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <CourseModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        course={editingCourse} 
        onSuccess={fetchCourses}
      />
    </div>
  );
}

function CourseModal({ isOpen, onClose, course, onSuccess }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Game Dev',
    imageUrl: '',
    duration: '',
    price: '',
    level: 'Intermediate',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (course) setFormData({ ...course });
    else setFormData({
      title: '',
      description: '',
      category: 'Game Dev',
      imageUrl: '',
      duration: '',
      price: '',
      level: 'Intermediate',
      status: 'active'
    });
  }, [course, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (course?.id) {
        await updateDoc(doc(db, 'courses', course.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'courses'), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      onSuccess();
      onClose();
      toast.success("Curriculum synchronized.");
    } catch (err) {
      console.error(err);
      toast.error("Handshake failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full max-w-2xl bg-[var(--bg-main)] border border-[var(--border-main)] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <div className="p-6 md:p-10 border-b border-[var(--border-main)] flex flex-col md:flex-row items-center justify-between gap-4 bg-[var(--bg-card)]">
              <div>
                <h2 className="text-xl md:text-2xl font-black font-display text-[var(--text-main)] uppercase italic tracking-tight">
                  {course ? 'Recalibrate' : 'Deploy'} <span className="text-primary-600">Module.</span>
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">Curriculum Management Protocol</p>
              </div>
              <button onClick={onClose} className="p-3 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Module Title</label>
                  <input required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Unreal Engine Architect" className="input-main" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Sector Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="input-main">
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Training Description</label>
                <textarea required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Outline training objectives..." className="input-main min-h-[120px]" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Asset Source (URL)</label>
                <input required value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://images.unsplash.com/..." className="input-main" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Temporal Length</label>
                  <input required value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} placeholder="24h Content" className="input-main" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Credit Weight (Price)</label>
                  <input required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="Amount (INR)" className="input-main" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Difficulty Metric</label>
                  <select value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})} className="input-main">
                    {['Beginner', 'Intermediate', 'Advanced', 'Professional'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Operational Status</label>
                <div className="flex gap-4">
                  {['active', 'hidden'].map(s => (
                    <button key={s} type="button" onClick={() => setFormData({...formData, status: s})} 
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.status === s ? 'bg-primary-600 text-white border-primary-500 shadow-xl shadow-primary-600/30' : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-main)]'}`}>
                      {s === 'active' ? 'Force Online' : 'System Hidden'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--border-main)] flex justify-end gap-4">
                <button type="button" onClick={onClose} className="btn-secondary">Abort</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-3">
                  {loading ? <Zap size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {course ? 'Commit Updates' : 'Sync Deployment'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
