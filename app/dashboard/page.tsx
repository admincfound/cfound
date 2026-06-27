"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Settings, LogOut, ChevronRight, Plus, Trash2, ExternalLink, Github, Linkedin, Globe, ShieldCheck, Briefcase, BookOpen, Activity, Clock, ArrowRight, Layout, Layers, Gamepad2, Trophy, Zap, MapPin, X,
  Bell, Eye, Calendar, Users, Download, Star, TrendingUp, CheckCircle, Circle, Minus, GraduationCap, Lightbulb, SlidersHorizontal, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, trend, trendLabel }: {
  label: string; value: number; icon: React.ReactNode;
  color: string; trend?: string; trendLabel?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-black text-gray-900">{value}</div>
      {trendLabel && (
        <div className="flex items-center gap-1 text-xs font-semibold text-green-500">
          <TrendingUp size={11} />
          <span>{trendLabel}</span>
        </div>
      )}
    </motion.div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="72" height="72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} strokeWidth="5" stroke="#e5e7eb" fill="none" />
      <circle cx="36" cy="36" r={r} strokeWidth="5" stroke="#2563eb" fill="none"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      <text x="36" y="36" dominantBaseline="middle" textAnchor="middle"
        className="fill-gray-800 text-xs font-black" style={{ fontSize: 13, fontWeight: 900 }}
        transform="rotate(90 36 36)">{pct}%</text>
    </svg>
  );
}

function PipelineTimeline({ stages, activeIdx }: { stages: string[]; activeIdx: number }) {
  return (
    <div className="flex items-center gap-0 mt-3 w-full">
      {stages.map((stage, i) => (
        <div key={stage} className="flex-1 flex flex-col items-center">
          <div className="flex items-center w-full">
            {i > 0 && <div className={`flex-1 h-[2px] ${i <= activeIdx ? 'bg-blue-500' : 'bg-gray-200'}`} />}
            <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
              i < activeIdx ? 'bg-blue-500 border-blue-500' :
              i === activeIdx ? 'bg-blue-500 border-blue-500 ring-2 ring-blue-200' :
              'bg-white border-gray-300'
            }`} />
            {i < stages.length - 1 && <div className={`flex-1 h-[2px] ${i < activeIdx ? 'bg-blue-500' : 'bg-gray-200'}`} />}
          </div>
          <span className={`text-[9px] font-semibold mt-1 ${i === activeIdx ? 'text-blue-600' : 'text-gray-400'}`}>
            {stage}
          </span>
        </div>
      ))}
    </div>
  );
}

const JOB_STAGES = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Joined'];
const ACADEMY_STAGES = ['Enrolled', 'In Progress', 'Assessment', 'Completed', 'Certificate'];

function getStageIndex(app: any): number {
  const s = app.status;
  const stages = app.category === 'Academy' ? ACADEMY_STAGES : JOB_STAGES;
  if (s === 'pending') return 0;
  if (s === 'reviewed') return 1;
  if (s === 'interviewScheduled' || app.interviewDetails) return 2;
  if (s === 'accepted' || s === 'enrolled') return app.category === 'Academy' ? 0 : 3;
  return 0;
}

function getCategoryColor(cat: string) {
  if (cat === 'Internship') return 'bg-blue-500';
  if (cat === 'Job') return 'bg-green-500';
  return 'bg-purple-500';
}

function getCategoryIconBg(cat: string) {
  if (cat === 'Internship') return 'bg-blue-50 text-blue-500';
  if (cat === 'Job') return 'bg-green-50 text-green-500';
  return 'bg-purple-50 text-purple-500';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, profile, isAdmin } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [sortOrder, setSortOrder] = useState<'recent' | 'newest' | 'oldest'>('recent');
  const [showSort, setShowSort] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isAdmin) router.push('/admin');
  }, [isAdmin, router]);

  useEffect(() => {
    if (user) fetchUserApplications();
  }, [user]);

  const fetchUserApplications = async () => {
    setLoading(true);
    try {
      const qApplications = query(
        collection(db, 'applications'),
        where('userId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      );
      const qInternships = query(
        collection(db, 'internshipApplications'),
        where('userId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      );
      const qAcademy = query(
        collection(db, 'courseEnrollments'),
        where('userId', '==', user?.uid),
        orderBy('appliedAt', 'desc')
      );

      const [appSnap, internSnap, academySnap] = await Promise.all([
        getDocs(qApplications),
        getDocs(qInternships),
        getDocs(qAcademy)
      ]);

      const apps = appSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), category: doc.data().type || 'Job' }));
      const internApps = internSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), category: 'Internship' }));
      const academyApps = academySnap.docs.map(doc => ({ id: doc.id, ...doc.data(), category: 'Academy' }));

      const allApps = [...apps, ...internApps, ...academyApps].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.appliedAt).getTime();
        const dateB = new Date(b.createdAt || b.appliedAt).getTime();
        return dateB - dateA;
      });

      setApplications(allApps);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const internsCount = applications.filter(a => a.category === 'Internship').length;
  const jobsCount = applications.filter(a => a.category === 'Job').length;
  const academyCount = applications.filter(a => a.category === 'Academy').length;
  const pending = applications.filter(a => a.status === 'pending').length;
  const accepted = applications.filter(a => a.status === 'accepted' || a.status === 'enrolled').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'enrolled': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'reviewed': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-amber-600 bg-amber-50 border-amber-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Internship': return <Briefcase size={16} />;
      case 'Job': return <Zap size={16} />;
      case 'Academy': return <BookOpen size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const filteredApps = (() => {
    let list = activeTab === 'All' ? applications : applications.filter(a => a.category === activeTab);
    if (sortOrder === 'newest') list = [...list].sort((a, b) => new Date(b.createdAt || b.appliedAt).getTime() - new Date(a.createdAt || a.appliedAt).getTime());
    if (sortOrder === 'oldest') list = [...list].sort((a, b) => new Date(a.createdAt || a.appliedAt).getTime() - new Date(b.createdAt || b.appliedAt).getTime());
    return list;
  })();

  const profileCompletion = 85;

  // Mock notifications (static UI only)
  const notifications = [
    { icon: <Eye size={16} className="text-blue-500" />, bg: 'bg-blue-50', text: 'Your application was viewed', time: '2 min ago' },
    { icon: <Calendar size={16} className="text-purple-500" />, bg: 'bg-purple-50', text: 'Interview scheduled', time: 'Tomorrow at 10:30 AM' },
    { icon: <User size={16} className="text-green-500" />, bg: 'bg-green-50', text: 'Profile viewed by recruiter', time: '1 day ago' },
    { icon: <Briefcase size={16} className="text-amber-500" />, bg: 'bg-amber-50', text: 'New job posted for you', time: '2 days ago' },
  ];

  // Mock recommended jobs (static UI only – no backend logic)
  const recommended = [
    { title: 'Full Stack Developer', match: 98, mode: 'Remote', type: 'Full Time' },
    { title: 'Unity Game Developer', match: 95, mode: 'Remote', type: 'Internship' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-20 px-4 md:px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* ── Left Sidebar ─────────────────────────────────────────── */}
          <aside className="xl:col-span-3 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
            >
              {/* Avatar */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-3">
                  <img
                    src={user?.photoURL || ''}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow">
                    <ShieldCheck size={12} className="text-white" />
                  </div>
                </div>
                <h2 className="text-lg font-black tracking-tight text-gray-900 italic uppercase">{profile?.displayName || user?.displayName}</h2>
                <div className="flex items-center gap-1 mt-0.5">
                  <CheckCircle size={12} className="text-green-500" />
                  <span className="text-xs font-semibold text-gray-500">Identity Verified</span>
                </div>
                <div className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                  {(profile as any)?.currentRole || 'Member'}
                </div>
                <div className="flex items-center gap-1 mt-1.5 text-gray-400 text-xs">
                  <MapPin size={11} />
                  <span>{(profile as any)?.country || 'India'}</span>
                </div>
              </div>

              {/* Profile Completion */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-gray-600">Profile Completion</span>
                  <span className="text-xs font-black text-blue-600">{profileCompletion}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${profileCompletion}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Complete your profile to increase visibility</p>
              </div>

              {/* Actions */}
              <div className="space-y-2 mb-6">
                <Link
                  href="/profile"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors"
                >
                  <Settings size={14} />
                  Modify Profile
                </Link>
                <button className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors">
                  <Download size={14} />
                  Download Resume
                </button>
                <button className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors">
                  <Eye size={14} />
                  View Public Profile
                </button>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors"
                  >
                    <ShieldCheck size={14} />
                    Admin Dashboard
                  </Link>
                )}
              </div>

              {/* Stats */}
              <div className="border-t border-gray-100 pt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-1">
                    <Briefcase size={14} className="text-blue-500" />
                  </div>
                  <div className="text-lg font-black text-gray-900">{applications.length}</div>
                  <div className="text-[10px] text-gray-400 font-medium">Applications</div>
                </div>
                <div>
                  <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-1">
                    <Eye size={14} className="text-green-500" />
                  </div>
                  <div className="text-lg font-black text-gray-900">—</div>
                  <div className="text-[10px] text-gray-400 font-medium">Views</div>
                </div>
                <div>
                  <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-1">
                    <Users size={14} className="text-purple-500" />
                  </div>
                  <div className="text-lg font-black text-gray-900">—</div>
                  <div className="text-[10px] text-gray-400 font-medium">Connections</div>
                </div>
              </div>
            </motion.div>
          </aside>

          {/* ── Center Content ────────────────────────────────────────── */}
          <main className="xl:col-span-6 space-y-6">

            {/* Stat Cards */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-5 gap-3"
            >
              <StatCard label="Internships" value={internsCount} color="bg-blue-50 text-blue-500"
                icon={<GraduationCap size={16} />} trendLabel="2 this week" />
              <StatCard label="Jobs" value={jobsCount} color="bg-green-50 text-green-500"
                icon={<Briefcase size={16} />} trendLabel="0 this week" />
              <StatCard label="Academy" value={academyCount} color="bg-purple-50 text-purple-500"
                icon={<BookOpen size={16} />} trendLabel="1 this week" />
              <StatCard label="Pending" value={pending} color="bg-amber-50 text-amber-500"
                icon={<Clock size={16} />} trendLabel="3 new" />
              <StatCard label="Accepted" value={accepted} color="bg-emerald-50 text-emerald-500"
                icon={<CheckCircle size={16} />} trendLabel="1 this week" />
            </motion.div>

            {/* Pipeline */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Pipeline header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">My Pipeline</h2>
                <div className="flex items-center gap-2">
                  {/* Tabs */}
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
                    {['All', 'Internship', 'Job', 'Academy'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          activeTab === tab
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Sort dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSort(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      {sortOrder === 'recent' ? 'Recent First' : sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                      <SlidersHorizontal size={12} />
                    </button>
                    <AnimatePresence>
                      {showSort && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="absolute right-0 top-10 z-20 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden w-36"
                        >
                          {(['recent', 'newest', 'oldest'] as const).map(o => (
                            <button
                              key={o}
                              onClick={() => { setSortOrder(o); setShowSort(false); }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${sortOrder === o ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                              {o === 'recent' ? 'Recent First' : o === 'newest' ? 'Newest' : 'Oldest'}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Applications list */}
              <div className="p-4 space-y-3">
                {loading ? (
                  <div className="py-16 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs text-gray-400 font-medium">Loading records…</p>
                  </div>
                ) : filteredApps.length === 0 ? (
                  <div className="py-16 text-center">
                    <Briefcase size={36} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-sm font-semibold text-gray-400 mb-4">
                      {activeTab === 'All' ? 'No applications yet.' : `No ${activeTab.toLowerCase()} applications.`}
                    </p>
                    <Link
                      href={activeTab === 'Academy' ? '/courses' : activeTab === 'Job' ? '/careers' : '/internship'}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-colors"
                    >
                      Explore {activeTab === 'All' ? 'Openings' : `${activeTab}s`}
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : (
                  filteredApps.map((app, idx) => {
                    const stages = app.category === 'Academy' ? ACADEMY_STAGES : JOB_STAGES;
                    const activeIdx = getStageIndex(app);
                    return (
                      <motion.div
                        layout
                        key={app.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="group border border-gray-100 rounded-xl overflow-hidden hover:border-blue-100 hover:shadow-md transition-all bg-white"
                      >
                        {/* Card top */}
                        <div className="flex items-start gap-3 px-4 pt-4 pb-2">
                          {/* Color strip */}
                          <div className={`w-1 self-stretch rounded-full shrink-0 ${getCategoryColor(app.category)}`} />

                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getCategoryIconBg(app.category)}`}>
                            {getCategoryIcon(app.category)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-black text-gray-900 uppercase italic text-sm tracking-tight truncate">
                                {app.targetTitle || app.jobTitle || 'Opportunity'}
                              </h3>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(app.status)}`}>
                                {app.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 font-medium">
                              <span className="flex items-center gap-1"><Briefcase size={10} /> C Found</span>
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                Applied on {new Date(app.createdAt || app.appliedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          {/* View Details */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg transition-all"
                            >
                              View Details
                            </button>
                            <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:border-blue-200 transition-all">
                              <ArrowRight size={13} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                          </div>
                        </div>

                        {/* Progress timeline */}
                        <div className="px-6 pb-4">
                          <PipelineTimeline stages={stages} activeIdx={activeIdx} />
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {filteredApps.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-3">
                  <button className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors py-1">
                    View All Applications
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          </main>

          {/* ── Right Sidebar ─────────────────────────────────────────── */}
          <aside className="xl:col-span-3 space-y-4">

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-900 text-base">Recent Notifications</h3>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All</button>
              </div>
              <div className="space-y-3">
                {notifications.map((n, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${n.bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
                      {n.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 leading-snug">{n.text}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recommended Jobs */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-900 text-base">Recommended for You</h3>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All</button>
              </div>
              <div className="space-y-4">
                {recommended.map((r, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3 hover:border-blue-100 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-black text-gray-900">{r.title}</h4>
                        <p className="text-xs text-gray-400 font-medium">C Found</p>
                      </div>
                      <span className="text-xs font-bold text-green-600">{r.match}% Match</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r.mode}</span>
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r.type}</span>
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-xs font-bold transition-colors">
                      Apply Now
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Tips */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-amber-500" />
                  <h3 className="font-black text-gray-900 text-base">Quick Tips</h3>
                </div>
                <ProgressRing pct={profileCompletion} />
              </div>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                Complete your profile &amp; get more visibility
              </p>
              <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 mt-2 transition-colors">
                Update Now <ArrowRight size={13} />
              </Link>
            </motion.div>
          </aside>
        </div>
      </div>

      {/* ── View Details Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedApp(null); }}
          >
            <motion.div
              initial={{ scale: 0.97, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: 16 }}
              className="bg-white border border-gray-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex justify-between items-start p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-gray-900">
                    {selectedApp.targetTitle || selectedApp.jobTitle || 'Opportunity'}
                  </h3>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1 flex items-center gap-2">
                    <span className={`w-4 h-4 rounded flex items-center justify-center ${getCategoryIconBg(selectedApp.category)}`}>
                      {getCategoryIcon(selectedApp.category)}
                    </span>
                    C Found · {selectedApp.category}
                  </p>
                </div>
                <button onClick={() => setSelectedApp(null)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status + Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Current Status</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(selectedApp.status)}`}>
                      {selectedApp.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Applied Date</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {new Date(selectedApp.createdAt || selectedApp.appliedAt).toLocaleDateString()} at {new Date(selectedApp.createdAt || selectedApp.appliedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Full Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedApp.description || 'Description not available for this role.'}</p>
                </div>

                {/* Skills */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedApp.skills || ['Not Available']).map((skill: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg text-gray-700">{skill}</span>
                    ))}
                  </div>
                </div>

                {/* HR Remarks */}
                {selectedApp.hrRemarks && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1.5">HR Remarks</p>
                    <p className="text-sm text-blue-800 font-medium">{selectedApp.hrRemarks}</p>
                  </div>
                )}

                {/* Interview Details */}
                {selectedApp.interviewDetails && (
                  <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-1.5">Interview Details</p>
                    <p className="text-sm text-purple-800 font-medium whitespace-pre-wrap">{selectedApp.interviewDetails}</p>
                  </div>
                )}

                {/* Rejection */}
                {selectedApp.rejectionReason && selectedApp.status === 'rejected' && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1.5">Feedback</p>
                    <p className="text-sm text-red-800 font-medium">{selectedApp.rejectionReason}</p>
                  </div>
                )}

                {/* Activity Timeline */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Activity Timeline</p>
                  <div className="relative border-l-2 border-gray-100 ml-3 space-y-4">
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow" />
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Applied for {selectedApp.category}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(selectedApp.createdAt || selectedApp.appliedAt).toLocaleDateString()}</p>
                    </div>
                    {(selectedApp.status === 'reviewed' || selectedApp.status === 'accepted' || selectedApp.hrRemarks) && (
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow" />
                        <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">HR Reviewed Profile</p>
                        <p className="text-xs text-gray-400 mt-0.5">Application marked as reviewed</p>
                      </div>
                    )}
                    {selectedApp.interviewDetails && (
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-purple-500 border-4 border-white shadow" />
                        <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Interview Scheduled</p>
                        <p className="text-xs text-gray-400 mt-0.5">Interview details shared</p>
                      </div>
                    )}
                    {selectedApp.status === 'accepted' && (
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow" />
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Selected</p>
                        <p className="text-xs text-green-400 mt-0.5">Offer extended / Accepted</p>
                      </div>
                    )}
                    {selectedApp.status === 'rejected' && (
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-red-500 border-4 border-white shadow" />
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Rejected</p>
                        <p className="text-xs text-red-400 mt-0.5">Application closed</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Applicant Data */}
                <div className="border-t border-gray-100 pt-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Applicant Data Submitted</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5">Email</span>
                      <span className="font-semibold text-gray-800 break-all">{selectedApp.email || selectedApp.userEmail || user?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5">Phone</span>
                      <span className="font-semibold text-gray-800">{selectedApp.phone || 'N/A'}</span>
                    </div>
                    {selectedApp.resume_url && selectedApp.resume_url !== 'N/A' && (
                      <div className="sm:col-span-2">
                        <a
                          href={selectedApp.resume_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
                        >
                          <ExternalLink size={14} /> View Submitted Resume
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
