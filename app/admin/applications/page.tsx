'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, doc, updateDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { getProfileCompletion } from '@/app/lib/profileUtils';
import { generatePDF } from '@/app/lib/resumeBuilder';
import FormattedText from '@/app/components/FormattedText';
import {
  CheckCircle2, XCircle, Clock, Eye, Mail, Phone, ExternalLink, Github, Linkedin, Globe,
  User, Activity, Trash2, Search, IdCard, Copy, Check, Download, FileText,
  MapPin, Briefcase, GraduationCap, Layers, ShieldQuestion, SlidersHorizontal, X,
  StickyNote, Save, ArrowUpRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PUBLIC_PROFILE_BASE = 'cfound.in';

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error('Could not copy'));
}

export default function ApplicationManagement() {
  const [applications, setApplications] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [resumeFilter, setResumeFilter] = useState('');
  const [completionFilter, setCompletionFilter] = useState('');
  const [openToWorkFilter, setOpenToWorkFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('latest');
  const [showFilters, setShowFilters] = useState(false);

  const [copiedId, setCopiedId] = useState(false);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    setNoteDraft(selectedApp?.adminNotes || '');
  }, [selectedApp?.id]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const [internshipsSnap, jobsSnap, coursesSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'internshipApplications'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'jobApplications'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'courseEnrollments'), orderBy('appliedAt', 'desc'))),
        getDocs(collection(db, 'users')),
      ]);

      const uMap: Record<string, any> = {};
      usersSnap.forEach(d => { uMap[d.id] = { id: d.id, ...d.data() }; });
      setUsersMap(uMap);

      const data: any[] = [];
      internshipsSnap.docs.forEach(d => data.push({ id: d.id, _collection: 'internshipApplications', ...d.data() }));
      jobsSnap.docs.forEach(d => {
        const app = d.data();
        data.push({
          id: d.id,
          _collection: 'jobApplications',
          photoURL: uMap[app.userId]?.photoURL || uMap[app.userId]?.googlePhotoURL || null,
          ...app,
        });
      });
      coursesSnap.docs.forEach(d => data.push({ id: d.id, _collection: 'courseEnrollments', ...d.data() }));

      data.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.appliedAt || 0).getTime();
        const timeB = new Date(b.createdAt || b.appliedAt || 0).getTime();
        return timeB - timeA;
      });

      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId: string, collectionName: string, newStatus: string) => {
    setUpdating(appId);
    try {
      await updateDoc(doc(db, collectionName, appId), {
        status: newStatus,
        reviewedAt: new Date().toISOString(),
      });
      setApplications(apps => apps.map(app => app.id === appId ? { ...app, status: newStatus, reviewedAt: new Date().toISOString() } : app));
      if (selectedApp?.id === appId) setSelectedApp((prev: any) => ({ ...prev, status: newStatus, reviewedAt: new Date().toISOString() }));
      toast.success(`Candidate ${newStatus === 'accepted' ? 'authorized' : 'denied'}.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string, collectionName: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }
    setUpdating(id);
    try {
      await deleteDoc(doc(db, collectionName, id));
      setApplications(apps => apps.filter(app => app.id !== id));
      if (selectedApp?.id === id) setSelectedApp(null);
      setDeletingId(null);
      toast.success('Record purged successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Access denied: Could not purge record.');
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedApp) return;
    setSavingNote(true);
    try {
      await updateDoc(doc(db, selectedApp._collection, selectedApp.id), {
        adminNotes: noteDraft,
        notesUpdatedAt: new Date().toISOString(),
      });
      setApplications(apps => apps.map(a => a.id === selectedApp.id ? { ...a, adminNotes: noteDraft, notesUpdatedAt: new Date().toISOString() } : a));
      setSelectedApp((prev: any) => ({ ...prev, adminNotes: noteDraft, notesUpdatedAt: new Date().toISOString() }));
      toast.success('Note saved.');
    } catch (err) {
      console.error(err);
      toast.error('Could not save note.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDownloadResume = async (profile: any) => {
    if (!profile) return;
    setDownloadingResume(true);
    try {
      await generatePDF(profile);
    } catch (err) {
      console.error(err);
      toast.error('Could not generate resume');
    } finally {
      setDownloadingResume(false);
    }
  };

  // ── Enrich every application with the applicant's full profile ──────────
  const enrichedApplications = useMemo(() => {
    return applications.map(app => ({ ...app, _profile: usersMap[app.userId] || null }));
  }, [applications, usersMap]);

  const availableStates = useMemo(() => {
    const s = new Set<string>();
    enrichedApplications.forEach(a => a._profile?.state && s.add(a._profile.state));
    return Array.from(s).sort();
  }, [enrichedApplications]);

  const availableCities = useMemo(() => {
    const s = new Set<string>();
    enrichedApplications.forEach(a => {
      if (!stateFilter || a._profile?.state === stateFilter) {
        if (a._profile?.city) s.add(a._profile.city);
      }
    });
    return Array.from(s).sort();
  }, [enrichedApplications, stateFilter]);

  // ── Stats (real, derived from loaded data only) ──────────────────────────
  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const isToday = (d: any) => {
      const dt = new Date(d || 0);
      return !isNaN(dt.getTime()) && dt >= today;
    };
    return {
      total: applications.length,
      pending: applications.filter(a => (a.status || 'pending') === 'pending').length,
      accepted: applications.filter(a => a.status === 'accepted').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      today: applications.filter(a => isToday(a.createdAt || a.appliedAt)).length,
    };
  }, [applications]);

  const filteredApplications = enrichedApplications
    .filter((app) => {
      const status = (app.status || 'pending').toLowerCase().trim();
      const category = (
        app.type || app.category ||
        (app._collection === 'internshipApplications' ? 'internship' : app._collection === 'courseEnrollments' ? 'course' : 'job')
      ).toLowerCase().trim();

      const matchesStatus = !statusFilter || status === statusFilter.toLowerCase();
      const matchesCategory = !categoryFilter || category.includes(categoryFilter.toLowerCase());

      const matchesExperience = !experienceFilter || app._profile?.experienceLevel === experienceFilter;
      const matchesResume = !resumeFilter ||
        (resumeFilter === 'yes' && !!app.resumeUrl) ||
        (resumeFilter === 'no' && !app.resumeUrl);

      const completion = app._profile ? getProfileCompletion(app._profile) : null;
      const matchesCompletion = !completionFilter || !completion ||
        (completionFilter === 'complete' && completion.isComplete) ||
        (completionFilter === 'incomplete' && !completion.isComplete);

      const matchesOpenToWork = !openToWorkFilter ||
        (openToWorkFilter === 'open' && app._profile?.openToWork) ||
        (openToWorkFilter === 'not-open' && !app._profile?.openToWork);

      const matchesState = !stateFilter || app._profile?.state === stateFilter;
      const matchesCity = !cityFilter || app._profile?.city === cityFilter;

      const normalizedSearch = searchTerm.toLowerCase().trim();
      const searchable = [
        app.userName, app.userEmail, app.targetTitle, app.phone, app.userId, app.id,
        (Array.isArray(app.skills) ? app.skills.join(' ') : app.skills),
        app._profile?.username, app._profile?.city, app._profile?.state,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);

      return matchesStatus && matchesCategory && matchesExperience && matchesResume &&
        matchesCompletion && matchesOpenToWork && matchesState && matchesCity && matchesSearch;
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt || a.appliedAt || 0).getTime();
      const bTime = new Date(b.createdAt || b.appliedAt || 0).getTime();
      return sortOrder === 'latest' ? bTime - aTime : aTime - bTime;
    });

  const activeFilterCount = [experienceFilter, resumeFilter, completionFilter, openToWorkFilter, stateFilter, cityFilter].filter(Boolean).length;
  const clearAdvancedFilters = () => {
    setExperienceFilter(''); setResumeFilter(''); setCompletionFilter('');
    setOpenToWorkFilter(''); setStateFilter(''); setCityFilter('');
  };

  const selectedProfile = selectedApp ? usersMap[selectedApp.userId] : null;
  const selectedCompletion = selectedProfile ? getProfileCompletion(selectedProfile) : null;

  // Other applications by the same candidate across all collections
  const candidateOtherApps = useMemo(() => {
    if (!selectedApp?.userId) return [];
    return applications.filter(a => a.userId === selectedApp.userId && a.id !== selectedApp.id);
  }, [applications, selectedApp]);

  return (
    <div className="pt-16 pb-32 px-6 min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-12 border-b border-[var(--border-main)] pb-12">
          <div>
            <span className="text-primary-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">Recruitment Operations</span>
            <h1 className="text-5xl md:text-7xl font-black font-display tracking-tight text-[var(--text-main)] uppercase italic">Recruitment <span className="text-primary-600">Control Center.</span></h1>
            <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-2">{filteredApplications.length} of {applications.length} Records in pipeline</p>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <StatCard label="Total Pipeline" value={stats.total} />
          <StatCard label="Pending Review" value={stats.pending} accent="text-yellow-500" />
          <StatCard label="Approved" value={stats.accepted} accent="text-emerald-500" />
          <StatCard label="Rejected" value={stats.rejected} accent="text-red-500" />
          <StatCard label="Applied Today" value={stats.today} accent="text-primary-500" />
        </div>

        {/* ── SEARCH + SORT + FILTERS ── */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative group flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-hover:text-primary-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search name, email, role, phone, User ID, skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl pl-16 pr-6 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary-600 transition-all shadow-xl"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-main)] px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-main)] px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-main)] px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
              <option value="">All Category</option>
              <option value="internship">Intern</option>
              <option value="course">Course</option>
              <option value="job">Job</option>
            </select>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl border transition-all ${
                showFilters || activeFilterCount > 0 ? 'bg-primary-600 text-white border-primary-600' : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)] hover:border-primary-600/40'
              }`}
            >
              <SlidersHorizontal size={14} /> More {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
              <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] shadow-xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <FilterSelect label="Experience" value={experienceFilter} onChange={setExperienceFilter}>
                  <option value="">All Levels</option>
                  <option value="Fresher">Fresher</option>
                  <option value="1–2 Years">1–2 Years</option>
                  <option value="2–5 Years">2–5 Years</option>
                  <option value="5–10 Years">5–10 Years</option>
                  <option value="10+ Years">10+ Years</option>
                </FilterSelect>
                <FilterSelect label="Resume" value={resumeFilter} onChange={setResumeFilter}>
                  <option value="">All</option>
                  <option value="yes">Uploaded</option>
                  <option value="no">Not Uploaded</option>
                </FilterSelect>
                <FilterSelect label="Profile" value={completionFilter} onChange={setCompletionFilter}>
                  <option value="">Complete + Incomplete</option>
                  <option value="complete">Complete</option>
                  <option value="incomplete">Incomplete</option>
                </FilterSelect>
                <FilterSelect label="Availability" value={openToWorkFilter} onChange={setOpenToWorkFilter}>
                  <option value="">All</option>
                  <option value="open">Open to Work</option>
                  <option value="not-open">Not Looking</option>
                </FilterSelect>
                <FilterSelect label="State" value={stateFilter} onChange={(v) => { setStateFilter(v); setCityFilter(''); }}>
                  <option value="">All States</option>
                  {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                </FilterSelect>
                <FilterSelect label="City" value={cityFilter} onChange={setCityFilter}>
                  <option value="">All Cities</option>
                  {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                </FilterSelect>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearAdvancedFilters} className="mt-3 text-[9px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 flex items-center gap-1.5">
                  <X size={12} /> Clear advanced filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Applications List */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              [1, 2, 3, 4].map(n => <div key={n} className="h-32 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] animate-pulse" />)
            ) : filteredApplications.length > 0 ? (
              filteredApplications.map((app) => {
                const completion = app._profile ? getProfileCompletion(app._profile) : null;
                return (
                  <motion.div
                    layout
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`p-8 bg-[var(--bg-card)] border rounded-[3rem] flex flex-col sm:flex-row sm:items-center justify-between gap-5 cursor-pointer transition-all hover:border-primary-600/30 shadow-xl group ${selectedApp?.id === app.id ? 'border-primary-600 ring-8 ring-primary-600/5' : 'border-[var(--border-main)]'}`}
                  >
                    <div className="flex items-center gap-8 min-w-0">
                      <div className="w-14 h-14 overflow-hidden rounded-2xl border border-primary-600/20 shadow-inner flex-shrink-0">
                        <img
                          src={app.photoURL || app._profile?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.userName || 'U')}&background=0052CC&color=fff`}
                          alt={app.userName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-[var(--text-main)] mb-1 uppercase italic tracking-tight truncate">{app.userName}</h4>
                        <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] opacity-60 truncate">Target: {app.targetTitle} // {app.type}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {app._profile?.openToWork && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[7px] font-black uppercase tracking-widest">Open to Work</span>
                          )}
                          {completion && (
                            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ${completion.isComplete ? 'bg-primary-600/10 text-primary-600 border-primary-600/20' : 'bg-[var(--bg-hover)] text-[var(--text-muted)] border-transparent'}`}>
                              Profile {completion.percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        app.status === 'pending' || !app.status ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {app.status || 'pending'}
                      </span>
                      <button className="p-4 text-[var(--text-muted)] hover:text-primary-600 transition-all bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-2xl shadow-lg hover:scale-110 active:scale-95"><Eye size={18} /></button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-24 px-12 text-center border-2 border-dashed border-[var(--border-main)] rounded-[3rem] bg-[var(--bg-card)]/30 group">
                <div className="w-16 h-16 bg-[var(--bg-main)] rounded-2xl mx-auto flex items-center justify-center mb-6 border border-[var(--border-main)] shadow-sm group-hover:scale-110 transition-transform">
                  <Activity size={24} className="text-[var(--text-muted)] opacity-40" />
                </div>
                <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.2em] mb-2 italic">Pipeline Clear</h3>
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-relaxed opacity-60">
                  {applications.length === 0 ? 'No applications have come in yet.' : 'No records match your current search and filters.'}
                </p>
                {(searchTerm || activeFilterCount > 0 || statusFilter || categoryFilter) && applications.length > 0 && (
                  <button
                    onClick={() => { setSearchTerm(''); setStatusFilter(''); setCategoryFilter(''); clearAdvancedFilters(); }}
                    className="mt-4 text-[9px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700"
                  >
                    Clear search &amp; filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="relative">
            <div className="sticky top-32 space-y-6 max-h-[calc(100vh-9rem)] overflow-y-auto no-scrollbar pr-1">
              {selectedApp ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-10 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-primary-600 font-display font-black text-[15rem] pointer-events-none group-hover:scale-110 transition-transform duration-1000 uppercase">A</div>

                  {/* ── PROFESSIONAL CANDIDATE HEADER ── */}
                  <div className="flex items-center gap-6 mb-8 relative z-10">
                    <div className="w-16 h-16 overflow-hidden rounded-2xl border border-primary-600/20 flex-shrink-0">
                      <img
                        src={selectedApp.photoURL || selectedProfile?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApp.userName || 'U')}&background=0052CC&color=fff`}
                        alt={selectedApp.userName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] mb-1 uppercase italic truncate">{selectedApp.userName}</h3>
                      <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest opacity-60">{selectedProfile?.primaryRole || 'Role Not Specified'}</p>
                    </div>
                  </div>

                  <div className="absolute top-6 right-6 flex gap-2 z-20">
                    <button
                      onClick={() => handleDelete(selectedApp.id, selectedApp._collection)}
                      disabled={updating === selectedApp.id}
                      className={`p-3 border rounded-xl transition-all shadow-xl group/del ${deletingId === selectedApp.id ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/30'}`}
                      title={deletingId === selectedApp.id ? 'Confirm Purge' : 'Purge Record'}
                    >
                      <Trash2 size={16} className={`transition-transform ${deletingId === selectedApp.id ? 'animate-bounce' : 'group-hover/del:scale-110'}`} />
                    </button>
                  </div>

                  {/* ── VIEW PUBLIC PROFILE (prominent) ── */}
                  {selectedProfile?.username ? (
                    <a
                      href={`https://${PUBLIC_PROFILE_BASE}/${selectedProfile.username}`}
                      target="_blank" rel="noopener noreferrer"
                      className="relative z-10 mb-6 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-6 py-3.5 text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                      <ExternalLink size={14} /> View Public Profile
                    </a>
                  ) : (
                    <div className="relative z-10 mb-6 flex items-center justify-center gap-2 bg-[var(--bg-hover)] text-[var(--text-muted)] rounded-xl px-6 py-3.5 text-[10px] font-black uppercase tracking-widest">
                      No Public Username Set
                    </div>
                  )}

                  {/* ── USER ID ── */}
                  <div className="relative z-10 mb-6 p-5 bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <IdCard size={16} className="text-primary-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">User ID</div>
                        <div className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight truncate">{selectedApp.userId || selectedApp.id}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => { copyToClipboard(selectedApp.userId || selectedApp.id, 'User ID'); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }}
                      className="flex-shrink-0 p-2.5 bg-[var(--bg-hover)] rounded-xl hover:bg-primary-600 hover:text-white transition-all text-[var(--text-muted)]"
                    >
                      {copiedId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Application Record Ref */}
                  <p className="relative z-10 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40 mb-8">Application Ref: {selectedApp.id.slice(0, 10)}</p>

                  <div className="space-y-8 mb-10 relative z-10">
                    <div className="p-8 bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-[2.5rem] shadow-inner group/card hover:border-primary-500/20 transition-all">
                      <div className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] mb-4 opacity-40">Target Role</div>
                      <div className="text-sm font-black text-[var(--text-main)] uppercase italic tracking-widest">{selectedApp.targetTitle}</div>
                      <div className="text-[10px] text-primary-500 font-black uppercase tracking-[0.2em] mt-1">{selectedApp.type}</div>
                    </div>

                    <div className="p-8 bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-[2.5rem] shadow-inner">
                      <div className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] mb-8 opacity-40">Decision Flow</div>
                      <div className="flex flex-col gap-4">
                        <button
                          onClick={() => handleUpdateStatus(selectedApp.id, selectedApp._collection, 'accepted')}
                          disabled={updating === selectedApp.id}
                          className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)]"
                        >
                          Approve Candidate
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedApp.id, selectedApp._collection, 'rejected')}
                          disabled={updating === selectedApp.id}
                          className="w-full py-5 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-muted)] font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-red-600 hover:text-white hover:border-red-600 active:scale-95 disabled:opacity-50"
                        >
                          Reject Application
                        </button>
                      </div>
                    </div>

                    {/* ── APPLICATION TIMELINE ── */}
                    <div className="p-8 bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-[2.5rem] shadow-inner">
                      <div className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] mb-6 opacity-40">Application Timeline</div>
                      <div className="space-y-5">
                        <TimelineEvent
                          label="Applied"
                          date={selectedApp.createdAt || selectedApp.appliedAt}
                          done
                        />
                        <TimelineEvent
                          label={selectedApp.status === 'accepted' ? 'Approved' : selectedApp.status === 'rejected' ? 'Rejected' : 'Reviewed'}
                          date={selectedApp.reviewedAt}
                          done={!!selectedApp.reviewedAt}
                          pendingLabel="Awaiting review"
                        />
                      </div>
                    </div>

                    {/* ── QUICK ACTIONS: Resume ── */}
                    <div className="grid grid-cols-1 gap-3">
                      {selectedApp.resumeUrl ? (
                        <a href={selectedApp.resumeUrl} target="_blank" rel="noopener noreferrer" className="p-5 bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl">
                          <ExternalLink size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Open Uploaded Resume</span>
                        </a>
                      ) : selectedProfile && getProfileCompletion(selectedProfile).isComplete ? (
                        <button
                          onClick={() => handleDownloadResume(selectedProfile)}
                          disabled={downloadingResume}
                          className="p-5 bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50"
                        >
                          <Download size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{downloadingResume ? 'Generating...' : 'Generate & Download Resume'}</span>
                        </button>
                      ) : (
                        <div className="p-5 bg-[var(--bg-main)] border border-[var(--border-main)] border-dashed text-[var(--text-muted)] opacity-50 rounded-2xl flex items-center justify-center gap-3">
                          <XCircle size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Resume not available</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-10 border-t border-[var(--border-main)] space-y-8 relative z-10">
                    <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] opacity-60 italic">Candidate Intelligence</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl flex items-center gap-3">
                        <Mail size={16} className="text-primary-600 flex-shrink-0" />
                        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] truncate">{selectedApp.userEmail}</div>
                      </div>
                      <div className="p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl flex items-center gap-3">
                        <Phone size={16} className="text-primary-600 flex-shrink-0" />
                        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">{selectedApp.phone || 'N/A'}</div>
                      </div>
                    </div>

                    {/* ── VERIFICATION (honest) ── */}
                    <div className="grid grid-cols-2 gap-4">
                      <VerificationChip label="Email Verification" />
                      <VerificationChip label="Phone Verification" />
                    </div>

                    {/* Skills */}
                    <div>
                      <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] mb-3 opacity-60">Skills</p>
                      {(Array.isArray(selectedApp.skills) ? selectedApp.skills : selectedProfile?.skills || []).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(selectedApp.skills) ? selectedApp.skills : selectedProfile?.skills || []).map((s: string) => (
                            <span key={s} className="px-3 py-1 bg-primary-600 text-white rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-sm">{s}</span>
                          ))}
                        </div>
                      ) : (
                        <EmptyLine text="No skills listed." />
                      )}
                    </div>

                    {selectedProfile ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl">
                            <div className="flex items-center gap-1.5 text-[9px] opacity-50 uppercase mb-1"><MapPin size={11} /> Location</div>
                            <div className="text-[10px] font-black uppercase">{selectedProfile.city || 'Unknown'}{selectedProfile.state ? `, ${selectedProfile.state}` : ''}</div>
                          </div>
                          <div className="p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl">
                            <div className="flex items-center gap-1.5 text-[9px] opacity-50 uppercase mb-1"><Briefcase size={11} /> Experience</div>
                            <div className="text-[10px] font-black uppercase">{selectedProfile.experienceLevel || 'Not Specified'}</div>
                          </div>
                          <div className="p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl">
                            <div className="text-[9px] opacity-50 uppercase mb-1">Profile Completion</div>
                            <div className="text-[10px] font-black uppercase text-primary-600">{selectedCompletion?.percentage}%</div>
                          </div>
                          <div className="p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl">
                            <div className="text-[9px] opacity-50 uppercase mb-1">Availability</div>
                            <div className={`text-[10px] font-black uppercase ${selectedProfile.openToWork ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>{selectedProfile.openToWork ? 'Open to Work' : 'Not Looking'}</div>
                          </div>
                        </div>

                        {selectedProfile.bio && (
                          <div className="p-5 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl">
                            <div className="text-[9px] opacity-50 uppercase mb-2">Bio</div>
                            <FormattedText text={selectedProfile.bio} className="text-[10px] leading-relaxed text-[var(--text-main)]" />
                          </div>
                        )}

                        {/* Experience */}
                        <div>
                          <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] mb-3 opacity-60 flex items-center gap-2"><Briefcase size={12} /> Experience</p>
                          {(selectedProfile.experiences || []).length > 0 ? (
                            <div className="space-y-3">
                              {selectedProfile.experiences.map((exp: any, i: number) => (
                                <div key={i} className="p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl">
                                  <div className="text-[10px] font-black uppercase text-[var(--text-main)]">{exp.role} @ {exp.company}</div>
                                  <div className="text-[8px] font-bold text-primary-500 uppercase tracking-widest mt-1">
                                    {[exp.startMonth, exp.startYear].filter(Boolean).join(' ')} — {exp.current ? 'Present' : [exp.endMonth, exp.endYear].filter(Boolean).join(' ')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : <EmptyLine text="No professional experience added." />}
                        </div>

                        {/* Education */}
                        <div>
                          <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] mb-3 opacity-60 flex items-center gap-2"><GraduationCap size={12} /> Education</p>
                          {(selectedProfile.education || []).length > 0 ? (
                            <div className="space-y-3">
                              {selectedProfile.education.map((edu: any, i: number) => (
                                <div key={i} className="p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl">
                                  <div className="text-[10px] font-black uppercase text-[var(--text-main)]">{edu.institution}</div>
                                  <div className="text-[8px] font-bold text-primary-500 uppercase tracking-widest mt-1">{edu.degree} · {edu.startYear}—{edu.current ? 'Present' : edu.endYear}</div>
                                </div>
                              ))}
                            </div>
                          ) : <EmptyLine text="No education details available." />}
                        </div>

                        {/* Projects */}
                        <div>
                          <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] mb-3 opacity-60 flex items-center gap-2"><Layers size={12} /> Projects</p>
                          {(selectedProfile.projects || []).length > 0 ? (
                            <div className="space-y-3">
                              {selectedProfile.projects.map((proj: any, i: number) => (
                                <div key={i} className="p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl flex items-center justify-between gap-3">
                                  <div className="text-[10px] font-black uppercase text-[var(--text-main)] truncate">{proj.title}</div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[var(--text-muted)] hover:text-primary-600"><Github size={13} /></a>}
                                    {proj.demoUrl && <a href={proj.demoUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[var(--text-muted)] hover:text-primary-600"><Globe size={13} /></a>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : <EmptyLine text="No projects added." />}
                        </div>
                      </>
                    ) : (
                      <div className="p-5 bg-[var(--bg-main)] border border-[var(--border-main)] border-dashed rounded-2xl">
                        <EmptyLine text="No linked profile found for this applicant." />
                      </div>
                    )}

                    {/* ── OTHER APPLICATIONS BY THIS CANDIDATE ── */}
                    <div>
                      <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] mb-3 opacity-60 flex items-center gap-2"><ArrowUpRight size={12} /> Other Applications</p>
                      {candidateOtherApps.length > 0 ? (
                        <div className="space-y-3">
                          {candidateOtherApps.map((a) => (
                            <button
                              key={a.id}
                              onClick={() => setSelectedApp(a)}
                              className="w-full text-left p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl hover:border-primary-500/30 transition-all flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="text-[10px] font-black uppercase text-[var(--text-main)] truncate">{a.targetTitle}</div>
                                <div className="text-[8px] font-bold text-primary-500 uppercase tracking-widest">{a.type}</div>
                              </div>
                              <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest flex-shrink-0 border ${
                                a.status === 'pending' || !a.status ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                a.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                              }`}>{a.status || 'pending'}</span>
                            </button>
                          ))}
                        </div>
                      ) : <EmptyLine text="No other applications from this candidate." />}
                    </div>

                    {/* Links */}
                    <div>
                      <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] mb-3 opacity-60 italic">Professional Footprint</p>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedApp.portfolioUrl ? (
                          <a href={selectedApp.portfolioUrl} target="_blank" rel="noopener noreferrer" className="p-5 bg-[var(--bg-main)] border border-[var(--border-main)] hover:border-primary-600/30 text-[var(--text-muted)] hover:text-primary-600 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl hover:scale-105 active:scale-95">
                            <ExternalLink size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Portfolio</span>
                          </a>
                        ) : (
                          <div className="p-5 bg-[var(--bg-main)] border border-[var(--border-main)] border-dashed text-[var(--text-muted)] opacity-40 rounded-2xl flex items-center justify-center gap-3">
                            <span className="text-[9px] font-black uppercase tracking-widest">No Portfolio</span>
                          </div>
                        )}
                        {selectedProfile?.linkedinUrl ? (
                          <a href={selectedProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-5 bg-[var(--bg-main)] border border-[var(--border-main)] hover:border-primary-600/30 text-[var(--text-muted)] hover:text-primary-600 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl hover:scale-105 active:scale-95">
                            <Linkedin size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">LinkedIn</span>
                          </a>
                        ) : (
                          <div className="p-5 bg-[var(--bg-main)] border border-[var(--border-main)] border-dashed text-[var(--text-muted)] opacity-40 rounded-2xl flex items-center justify-center gap-3">
                            <span className="text-[9px] font-black uppercase tracking-widest">No LinkedIn</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── ADMIN NOTES ── */}
                    <div>
                      <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] mb-3 opacity-60 flex items-center gap-2"><StickyNote size={12} /> Admin Notes</p>
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Internal notes about this candidate — not visible to them..."
                        rows={4}
                        className="w-full p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl text-[11px] font-medium text-[var(--text-main)] focus:outline-none focus:border-primary-600 resize-none"
                      />
                      <div className="flex items-center justify-between mt-3">
                        {selectedApp.notesUpdatedAt ? (
                          <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50">
                            Updated {new Date(selectedApp.notesUpdatedAt).toLocaleString()}
                          </span>
                        ) : <span />}
                        <button
                          onClick={handleSaveNote}
                          disabled={savingNote || noteDraft === (selectedApp.adminNotes || '')}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all disabled:opacity-40"
                        >
                          <Save size={12} /> {savingNote ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="p-16 bg-[var(--bg-card)] border border-[var(--border-main)] border-dashed rounded-[3.5rem] text-center opacity-40 shadow-inner group">
                  <div className="w-20 h-20 bg-[var(--bg-main)] rounded-3xl mx-auto flex items-center justify-center mb-8 border border-[var(--border-main)] shadow-xl transition-transform group-hover:rotate-0 rotate-6">
                    <User size={36} className="text-[var(--text-muted)]" />
                  </div>
                  <h4 className="text-[10px] text-[var(--text-main)] font-black uppercase tracking-[0.3em] mb-2 italic">Data Synchronization</h4>
                  <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] leading-relaxed italic opacity-60">Select a record to view candidate intel.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] shadow-xl">
      <div className={`text-3xl font-black font-display italic tracking-tighter ${accent || 'text-[var(--text-main)]'}`}>{value}</div>
      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-2">{label}</div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--bg-hover)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:border-primary-600 cursor-pointer"
      >
        {children}
      </select>
    </div>
  );
}

function TimelineEvent({ label, date, done, pendingLabel }: { label: string; date?: string; done: boolean; pendingLabel?: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${done ? 'bg-primary-600' : 'bg-[var(--border-main)]'}`} />
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">{label}</div>
        <div className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50 mt-0.5">
          {done && date ? new Date(date).toLocaleString() : (pendingLabel || 'Pending')}
        </div>
      </div>
    </div>
  );
}

function VerificationChip({ label }: { label: string }) {
  return (
    <div className="p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl flex items-center gap-3">
      <ShieldQuestion size={14} className="text-[var(--text-muted)] flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">{label}</div>
        <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Not Tracked</div>
      </div>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50 italic">{text}</p>;
}