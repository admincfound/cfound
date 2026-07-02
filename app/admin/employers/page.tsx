'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import FormattedText from '@/app/components/FormattedText';
import {
  Search, Building2, MapPin, Users, Briefcase, Globe, Mail, Phone,
  ExternalLink, X, Check, Copy, IdCard, Calendar, ShieldCheck, ShieldQuestion,
  ArrowUpDown, SlidersHorizontal, BadgeCheck, Ban, FileText, Clock, StickyNote,
  Save, Activity, Layers, Factory, Users2, ChevronRight, AlertCircle, UserCircle2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ── Data source status ───────────────────────────────────────────────────
// This page reads from the Firestore "employers" collection. If that
// collection doesn't exist yet (no employer has ever been onboarded), the
// page shows a clear, premium empty state instead of fabricating data.
// Active-job counts are cross-referenced from the real "careers" collection
// (matched by company name) rather than invented.

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error('Could not copy'));
}

function normalize(v: any) {
  return (v || '').toString().toLowerCase().trim();
}

type SortKey = 'newest' | 'oldest' | 'alpha' | 'active';
type TabKey = 'overview' | 'recruiters' | 'jobs' | 'documents' | 'timeline' | 'activity' | 'notes';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <Building2 size={13} /> },
  { key: 'recruiters', label: 'Recruiters', icon: <Users2 size={13} /> },
  { key: 'jobs', label: 'Jobs', icon: <Briefcase size={13} /> },
  { key: 'documents', label: 'Documents', icon: <FileText size={13} /> },
  { key: 'timeline', label: 'Timeline', icon: <Clock size={13} /> },
  { key: 'activity', label: 'Activity', icon: <Activity size={13} /> },
  { key: 'notes', label: 'Notes', icon: <StickyNote size={13} /> },
];

export default function EmployerManagement() {
  const [employers, setEmployers] = useState<any[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionMissing, setCollectionMissing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [copiedId, setCopiedId] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [employersSnap, careersSnap] = await Promise.all([
        getDocs(query(collection(db, 'employers'))),
        getDocs(query(collection(db, 'careers'))),
      ]);
      const employerData = employersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEmployers(employerData);
      setCareers(careersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCollectionMissing(employerData.length === 0);
    } catch (err) {
      console.error(err);
      setCollectionMissing(true);
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployer = useMemo(
    () => employers.find(e => e.id === selectedId) || null,
    [employers, selectedId]
  );

  useEffect(() => {
    setNoteDraft(selectedEmployer?.adminNotes || '');
  }, [selectedId]);

  // ── Real cross-reference: jobs matched to each employer by company name ──
  const jobsByEmployer = useMemo(() => {
    const map: Record<string, any[]> = {};
    employers.forEach(emp => {
      const name = normalize(emp.companyName || emp.name);
      map[emp.id] = careers.filter(c => normalize(c.companyName) === name && name);
    });
    return map;
  }, [employers, careers]);

  const jobCounts = (empId: string) => {
    const jobs = jobsByEmployer[empId] || [];
    return {
      current: jobs.filter(j => (j.status || 'active') === 'active').length,
      closed: jobs.filter(j => j.status === 'closed').length,
      draft: jobs.filter(j => j.status === 'draft').length,
      all: jobs,
    };
  };

  // ── Dynamic filter option lists, built only from real loaded data ────────
  const availableIndustries = useMemo(() => {
    const s = new Set<string>();
    employers.forEach(e => e.industry && s.add(e.industry));
    return Array.from(s).sort();
  }, [employers]);

  const availableLocations = useMemo(() => {
    const s = new Set<string>();
    employers.forEach(e => {
      const loc = [e.city, e.state].filter(Boolean).join(', ');
      if (loc) s.add(loc);
    });
    return Array.from(s).sort();
  }, [employers]);

  const filteredEmployers = useMemo(() => {
    const term = normalize(searchTerm);
    let result = employers.filter(emp => {
      const searchable = [
        emp.companyName, emp.name, emp.id, emp.email, emp.phone, emp.website,
        emp.city, emp.state, emp.location,
        (Array.isArray(emp.recruiters) ? emp.recruiters.map((r: any) => r.name).join(' ') : ''),
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !term || searchable.includes(term);

      const verified = !!emp.verified;
      const matchesVerification = !verificationFilter ||
        (verificationFilter === 'verified' && verified) ||
        (verificationFilter === 'pending' && !verified);

      const matchesIndustry = !industryFilter || emp.industry === industryFilter;
      const matchesSize = !sizeFilter || emp.companySize === sizeFilter;

      const status = emp.status || 'active';
      const matchesStatus = !statusFilter || status === statusFilter;

      const loc = [emp.city, emp.state].filter(Boolean).join(', ');
      const matchesLocation = !locationFilter || loc === locationFilter;

      return matchesSearch && matchesVerification && matchesIndustry && matchesSize && matchesStatus && matchesLocation;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'alpha':
          return (a.companyName || a.name || '').localeCompare(b.companyName || b.name || '');
        case 'active':
          return jobCounts(b.id).current - jobCounts(a.id).current;
        default:
          return 0;
      }
    });

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employers, searchTerm, verificationFilter, industryFilter, sizeFilter, statusFilter, locationFilter, sortBy, jobsByEmployer]);

  const activeFilterCount = [verificationFilter, industryFilter, sizeFilter, statusFilter, locationFilter].filter(Boolean).length;
  const clearFilters = () => {
    setVerificationFilter(''); setIndustryFilter(''); setSizeFilter(''); setStatusFilter(''); setLocationFilter('');
  };

  // ── Stats (real, derived only from loaded data) ──────────────────────────
  const stats = useMemo(() => {
    const totalActiveJobs = employers.reduce((sum, e) => sum + jobCounts(e.id).current, 0);
    const totalRecruiters = employers.reduce((sum, e) => sum + (Array.isArray(e.recruiters) ? e.recruiters.length : 0), 0);
    return {
      total: employers.length,
      verified: employers.filter(e => e.verified).length,
      pending: employers.filter(e => !e.verified).length,
      activeJobs: totalActiveJobs,
      recruiters: totalRecruiters,
      inactive: employers.filter(e => (e.status || 'active') === 'suspended' || (e.status || 'active') === 'inactive').length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employers, jobsByEmployer]);

  const handleVerify = async () => {
    if (!selectedEmployer) return;
    setUpdating(true);
    try {
      const nextVerified = !selectedEmployer.verified;
      await updateDoc(doc(db, 'employers', selectedEmployer.id), {
        verified: nextVerified,
        verifiedAt: nextVerified ? new Date().toISOString() : null,
      });
      setEmployers(list => list.map(e => e.id === selectedEmployer.id ? { ...e, verified: nextVerified, verifiedAt: nextVerified ? new Date().toISOString() : null } : e));
      toast.success(nextVerified ? 'Employer verified.' : 'Verification revoked.');
    } catch (err) {
      console.error(err);
      toast.error('Could not update verification.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedEmployer) return;
    setUpdating(true);
    try {
      const suspended = (selectedEmployer.status || 'active') === 'suspended';
      const nextStatus = suspended ? 'active' : 'suspended';
      await updateDoc(doc(db, 'employers', selectedEmployer.id), {
        status: nextStatus,
        statusChangedAt: new Date().toISOString(),
      });
      setEmployers(list => list.map(e => e.id === selectedEmployer.id ? { ...e, status: nextStatus, statusChangedAt: new Date().toISOString() } : e));
      toast.success(suspended ? 'Employer reactivated.' : 'Employer suspended.');
    } catch (err) {
      console.error(err);
      toast.error('Could not update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedEmployer) return;
    setSavingNote(true);
    try {
      await updateDoc(doc(db, 'employers', selectedEmployer.id), {
        adminNotes: noteDraft,
        notesUpdatedAt: new Date().toISOString(),
      });
      setEmployers(list => list.map(e => e.id === selectedEmployer.id ? { ...e, adminNotes: noteDraft, notesUpdatedAt: new Date().toISOString() } : e));
      toast.success('Note saved.');
    } catch (err) {
      console.error(err);
      toast.error('Could not save note.');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="pt-16 pb-32 px-6 min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-10">
          <div>
            <span className="text-primary-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">Company Operations</span>
            <h1 className="text-5xl md:text-7xl font-black font-display tracking-tight text-[var(--text-main)] uppercase italic">Employer <span className="text-primary-600">Management.</span></h1>
            <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-2">Manage companies, recruiters, verification and hiring activity.</p>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <MiniStatCard label="Total Employers" value={stats.total} />
          <MiniStatCard label="Verified" value={stats.verified} accent="text-emerald-500" />
          <MiniStatCard label="Pending Verification" value={stats.pending} accent="text-yellow-500" />
          <MiniStatCard label="Active Jobs" value={stats.activeJobs} accent="text-primary-500" />
          <MiniStatCard label="Recruiters" value={stats.recruiters} />
          <MiniStatCard label="Inactive Companies" value={stats.inactive} accent="text-red-500" />
        </div>

        {/* ── SEARCH + SORT + FILTERS ── */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative group flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-hover:text-primary-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search company, recruiter, email, phone, website, location, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl pl-16 pr-6 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary-600 transition-all shadow-xl"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <ArrowUpDown className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={14} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl pl-11 pr-6 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary-600 shadow-xl appearance-none cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="alpha">Alphabetical</option>
                <option value="active">Most Active</option>
              </select>
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl border transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)] hover:border-primary-600/40'
              }`}
            >
              <SlidersHorizontal size={14} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] shadow-xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <FilterSelect label="Verification" value={verificationFilter} onChange={setVerificationFilter}>
                  <option value="">All</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending Verification</option>
                </FilterSelect>
                <FilterSelect label="Industry" value={industryFilter} onChange={setIndustryFilter}>
                  <option value="">All Industries</option>
                  {availableIndustries.map(i => <option key={i} value={i}>{i}</option>)}
                </FilterSelect>
                <FilterSelect label="Company Size" value={sizeFilter} onChange={setSizeFilter}>
                  <option value="">All Sizes</option>
                  <option value="1-10">1–10</option>
                  <option value="11-50">11–50</option>
                  <option value="51-200">51–200</option>
                  <option value="201-500">201–500</option>
                  <option value="500+">500+</option>
                </FilterSelect>
                <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}>
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </FilterSelect>
                <FilterSelect label="Location" value={locationFilter} onChange={setLocationFilter}>
                  <option value="">All Locations</option>
                  {availableLocations.map(l => <option key={l} value={l}>{l}</option>)}
                </FilterSelect>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="mt-3 text-[9px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 flex items-center gap-1.5">
                  <X size={12} /> Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── COMPANY GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            [1, 2, 3, 4, 5, 6, 7, 8].map(n => <div key={n} className="h-56 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] animate-pulse" />)
          ) : filteredEmployers.length > 0 ? (
            filteredEmployers.map((emp) => {
              const counts = jobCounts(emp.id);
              const verified = !!emp.verified;
              return (
                <motion.div
                  layout
                  key={emp.id}
                  onClick={() => { setSelectedId(emp.id); setActiveTab('overview'); }}
                  className="p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] hover:border-primary-600/30 transition-all group cursor-pointer shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                    <Building2 size={120} />
                  </div>

                  <div className="flex items-center gap-5 mb-6">
                    <img
                      src={emp.logoUrl || emp.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.companyName || emp.name || 'C')}&background=0052CC&color=fff`}
                      alt={emp.companyName || emp.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-primary-600/20 bg-[var(--bg-main)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h3 className="font-black text-sm text-[var(--text-main)] uppercase italic tracking-tight truncate">{emp.companyName || emp.name || 'Unnamed Company'}</h3>
                      <p className="text-[9px] text-primary-500 font-black uppercase tracking-[0.2em] truncate">{emp.industry || 'Industry Not Set'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    {verified ? (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <BadgeCheck size={11} /> Verified
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <ShieldQuestion size={11} /> Pending
                      </span>
                    )}
                    {(emp.status || 'active') === 'suspended' && (
                      <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest">Suspended</span>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    {(emp.city || emp.state || emp.location) && (
                      <div className="flex items-center gap-3 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest italic">
                        <MapPin size={12} className="text-primary-600" /> {emp.location || [emp.city, emp.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest italic">
                      <Briefcase size={12} className="text-primary-600" /> {counts.current} Active Job{counts.current === 1 ? '' : 's'}
                    </div>
                    <div className="flex items-center gap-3 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest italic">
                      <Users2 size={12} className="text-primary-600" /> {Array.isArray(emp.recruiters) ? emp.recruiters.length : 0} Recruiter{(Array.isArray(emp.recruiters) ? emp.recruiters.length : 0) === 1 ? '' : 's'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-[var(--border-main)]">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">
                      {emp.createdAt ? `Joined ${new Date(emp.createdAt).toLocaleDateString()}` : 'Joined Unknown'}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                      View <ChevronRight size={12} />
                    </span>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-[var(--border-main)] rounded-[4rem] bg-[var(--bg-card)]/20">
              <Building2 size={48} className="mx-auto mb-6 text-[var(--text-muted)] opacity-20" />
              {collectionMissing ? (
                <>
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-main)] mb-3">No Data Source Connected</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60 max-w-md mx-auto leading-relaxed">
                    The "employers" collection doesn't exist in Firestore yet. Once companies are onboarded there, they'll appear here automatically — nothing on this page is fabricated.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">No Employers Found</p>
                  {(activeFilterCount > 0 || searchTerm) && (
                    <button onClick={() => { clearFilters(); setSearchTerm(''); }} className="mt-4 text-[9px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700">
                      Clear search &amp; filters
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── DETAIL PANEL ── */}
      <AnimatePresence>
        {selectedEmployer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-3xl h-full bg-[var(--bg-main)] border-l border-[var(--border-main)] shadow-2xl overflow-y-auto no-scrollbar"
            >
              {/* Sticky header actions */}
              <div className="sticky top-0 z-10 bg-[var(--bg-main)]/95 backdrop-blur-md border-b border-[var(--border-main)] px-8 py-5 flex items-center gap-3">
                <button
                  onClick={handleVerify}
                  disabled={updating}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 ${
                    selectedEmployer.verified ? 'bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-yellow-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <BadgeCheck size={14} /> {selectedEmployer.verified ? 'Unverify' : 'Verify'}
                </button>
                <button
                  onClick={handleSuspend}
                  disabled={updating}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 ${
                    (selectedEmployer.status || 'active') === 'suspended' ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-red-500'
                  }`}
                >
                  <Ban size={14} /> {(selectedEmployer.status || 'active') === 'suspended' ? 'Reactivate' : 'Suspend'}
                </button>
                <button onClick={() => setSelectedId(null)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl hover:text-red-500 transition-all hover:rotate-90 flex-shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 lg:p-12 pt-8">
                {/* Header */}
                <div className="flex items-center gap-8 mb-8">
                  <img
                    src={selectedEmployer.logoUrl || selectedEmployer.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmployer.companyName || selectedEmployer.name || 'C')}&background=0052CC&color=fff`}
                    alt="logo"
                    className="w-24 h-24 rounded-[2rem] border-4 border-primary-600/20 object-cover flex-shrink-0 bg-[var(--bg-card)]"
                  />
                  <div className="min-w-0">
                    <h2 className="text-3xl lg:text-4xl font-black font-display uppercase italic text-[var(--text-main)] mb-2 truncate">{selectedEmployer.companyName || selectedEmployer.name}</h2>
                    <div className="flex flex-wrap gap-3 items-center">
                      {selectedEmployer.verified ? (
                        <span className="px-4 py-1.5 bg-emerald-600 text-[9px] font-black uppercase tracking-widest text-white rounded-lg italic flex items-center gap-1.5">
                          <BadgeCheck size={12} /> Verified
                        </span>
                      ) : (
                        <span className="px-4 py-1.5 bg-yellow-500 text-[9px] font-black uppercase tracking-widest text-white rounded-lg italic flex items-center gap-1.5">
                          <ShieldQuestion size={12} /> Pending Verification
                        </span>
                      )}
                      <span className="px-4 py-1.5 bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-main)] text-[9px] font-black uppercase tracking-widest rounded-lg italic">
                        {(selectedEmployer.status || 'active')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Company ID */}
                <div className="mb-8 p-5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <IdCard size={16} className="text-primary-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">Company ID</div>
                      <div className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight truncate">{selectedEmployer.id}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { copyToClipboard(selectedEmployer.id, 'Company ID'); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }}
                    className="flex-shrink-0 p-2.5 bg-[var(--bg-hover)] rounded-xl hover:bg-primary-600 hover:text-white transition-all text-[var(--text-muted)]"
                  >
                    {copiedId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Buttons: View Public Profile / Open Website */}
                <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <QuickAction
                    icon={<ExternalLink size={15} />}
                    label="View Public Profile"
                    disabled
                    tooltip="No public employer profile route exists yet on the site"
                  />
                  <QuickAction
                    icon={<Globe size={15} />}
                    label="Open Website"
                    disabled={!selectedEmployer.website}
                    onClick={() => window.open(selectedEmployer.website, '_blank', 'noopener,noreferrer')}
                  />
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl">
                  {TABS.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        activeTab === t.key ? 'bg-primary-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>

                {/* ── TAB: OVERVIEW ── */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-8">
                      <DetailCard title="Company Profile" icon={<Factory size={16} />}>
                        <InfoStat label="Industry" value={selectedEmployer.industry || 'Not Specified'} />
                        <div className="h-4" />
                        <InfoStat label="Company Size" value={selectedEmployer.companySize || 'Not Specified'} />
                        <div className="h-4" />
                        <InfoStat label="Founded" value={selectedEmployer.foundedYear ? String(selectedEmployer.foundedYear) : 'Not Specified'} />
                      </DetailCard>
                      <DetailCard title="Location" icon={<MapPin size={16} />}>
                        <div className="text-sm font-black text-[var(--text-main)] uppercase italic tracking-widest">
                          {selectedEmployer.address || selectedEmployer.location || [selectedEmployer.city, selectedEmployer.state].filter(Boolean).join(', ') || 'Not Specified'}
                        </div>
                      </DetailCard>
                    </div>
                    <div className="space-y-8">
                      <DetailCard title="Connect Intel" icon={<Mail size={16} />}>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                          <Mail size={12} className="text-primary-600" /> {selectedEmployer.email || 'No Email'}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                          <Phone size={12} className="text-primary-600" /> {selectedEmployer.phone || 'No Comms'}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                          <Globe size={12} className="text-primary-600" /> {selectedEmployer.website || 'No Website'}
                        </div>
                      </DetailCard>
                      <DetailCard title="Description" icon={<FileText size={16} />}>
                        {selectedEmployer.description ? (
                          <FormattedText text={selectedEmployer.description} className="text-xs font-medium text-[var(--text-muted)] leading-relaxed" />
                        ) : (
                          <EmptyLine text="No company description added." />
                        )}
                      </DetailCard>
                    </div>
                  </div>
                )}

                {/* ── TAB: RECRUITERS ── */}
                {activeTab === 'recruiters' && (
                  Array.isArray(selectedEmployer.recruiters) && selectedEmployer.recruiters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedEmployer.recruiters.map((r: any, i: number) => (
                        <div key={i} className="p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] flex items-center gap-5">
                          <img
                            src={r.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name || 'R')}&background=0052CC&color=fff`}
                            alt={r.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-primary-600/20 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-[var(--text-main)] uppercase italic tracking-tight truncate">{r.name || 'Unnamed'}</h4>
                            <p className="text-[9px] text-primary-500 font-black uppercase tracking-widest mb-2 truncate">{r.role || 'Recruiter'}</p>
                            {r.email && <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest truncate flex items-center gap-1.5"><Mail size={10} /> {r.email}</div>}
                            {r.phone && <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest truncate flex items-center gap-1.5 mt-1"><Phone size={10} /> {r.phone}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyPanel icon={<UserCircle2 size={32} />} title="No Recruiters On File" text="This company hasn't added any recruiters yet." />
                  )
                )}

                {/* ── TAB: JOBS ── */}
                {activeTab === 'jobs' && (() => {
                  const counts = jobCounts(selectedEmployer.id);
                  return counts.all.length > 0 ? (
                    <div className="space-y-8">
                      <JobGroup title="Current Jobs" jobs={counts.all.filter((j: any) => (j.status || 'active') === 'active')} accent="text-emerald-500" />
                      <JobGroup title="Draft Jobs" jobs={counts.all.filter((j: any) => j.status === 'draft')} accent="text-yellow-500" />
                      <JobGroup title="Closed Jobs" jobs={counts.all.filter((j: any) => j.status === 'closed')} accent="text-[var(--text-muted)]" />
                    </div>
                  ) : (
                    <EmptyPanel icon={<Briefcase size={32} />} title="No Jobs Posted" text="No listings in the careers collection match this company name yet." />
                  );
                })()}

                {/* ── TAB: DOCUMENTS ── */}
                {activeTab === 'documents' && (
                  Array.isArray(selectedEmployer.documents) && selectedEmployer.documents.length > 0 ? (
                    <div className="space-y-4">
                      {selectedEmployer.documents.map((d: any, i: number) => (
                        <a
                          key={i}
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl hover:border-primary-600/30 transition-all"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <FileText size={18} className="text-primary-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] truncate">{d.name || 'Document'}</div>
                              {d.uploadedAt && <div className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50 mt-0.5">{new Date(d.uploadedAt).toLocaleDateString()}</div>}
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <EmptyPanel icon={<FileText size={32} />} title="No Documents Uploaded" text="Verification documents, agreements, or contracts will appear here." />
                  )
                )}

                {/* ── TAB: TIMELINE ── */}
                {activeTab === 'timeline' && (() => {
                  const events: { label: string; date: string; icon: React.ReactNode }[] = [];
                  if (selectedEmployer.createdAt) events.push({ label: 'Company Registered', date: selectedEmployer.createdAt, icon: <Building2 size={13} /> });
                  if (selectedEmployer.verifiedAt) events.push({ label: 'Verification Completed', date: selectedEmployer.verifiedAt, icon: <BadgeCheck size={13} /> });
                  if (selectedEmployer.statusChangedAt) events.push({ label: `Status Changed — ${selectedEmployer.status}`, date: selectedEmployer.statusChangedAt, icon: <ShieldCheck size={13} /> });
                  (Array.isArray(selectedEmployer.recruiters) ? selectedEmployer.recruiters : []).forEach((r: any) => {
                    if (r.addedAt) events.push({ label: `Recruiter Added — ${r.name}`, date: r.addedAt, icon: <Users2 size={13} /> });
                  });
                  jobCounts(selectedEmployer.id).all.forEach((j: any) => {
                    if (j.createdAt) events.push({ label: `Job Posted — ${j.title || 'Untitled Role'}`, date: j.createdAt, icon: <Briefcase size={13} /> });
                  });
                  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  return events.length > 0 ? (
                    <div className="space-y-5">
                      {events.map((ev, i) => (
                        <div key={i} className="flex items-start gap-4 p-5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl">
                          <div className="w-9 h-9 rounded-xl bg-primary-600/10 text-primary-600 flex items-center justify-center flex-shrink-0">{ev.icon}</div>
                          <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">{ev.label}</div>
                            <div className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50 mt-0.5">{new Date(ev.date).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyPanel icon={<Clock size={32} />} title="No Timeline Events" text="Registration, verification, and hiring events will be logged here." />
                  );
                })()}

                {/* ── TAB: ACTIVITY ── */}
                {activeTab === 'activity' && (
                  <EmptyPanel icon={<Activity size={32} />} title="No Activity Tracked" text="Login history and recruiter activity aren't captured in Firestore yet." />
                )}

                {/* ── TAB: NOTES ── */}
                {activeTab === 'notes' && (
                  <div>
                    <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] mb-3 opacity-60 flex items-center gap-2"><StickyNote size={12} /> Admin-Only Notes</p>
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Internal notes about this employer — not visible to them..."
                      rows={8}
                      className="w-full p-5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-[11px] font-medium text-[var(--text-main)] focus:outline-none focus:border-primary-600 resize-none"
                    />
                    <div className="flex items-center justify-between mt-3">
                      {selectedEmployer.notesUpdatedAt ? (
                        <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50">
                          Updated {new Date(selectedEmployer.notesUpdatedAt).toLocaleString()}
                        </span>
                      ) : <span />}
                      <button
                        onClick={handleSaveNote}
                        disabled={savingNote || noteDraft === (selectedEmployer.adminNotes || '')}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all disabled:opacity-40"
                      >
                        <Save size={12} /> {savingNote ? 'Saving...' : 'Save Note'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Building blocks (mirrors Personnel Database / Intake Queue) ──────────

function MiniStatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
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

function QuickAction({ icon, label, onClick, disabled, tooltip }: { icon: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean; tooltip?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
        disabled
          ? 'bg-[var(--bg-hover)] text-[var(--text-muted)] border-transparent opacity-40 cursor-not-allowed'
          : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)] hover:bg-primary-600 hover:text-white hover:border-primary-600'
      }`}
    >
      {icon} <span className="truncate">{label}</span>
    </button>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">{label}</div>
      <div className="text-sm font-black uppercase tracking-tight text-[var(--text-main)]">{value}</div>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50 italic">{text}</p>;
}

function EmptyPanel({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="py-24 px-12 text-center border-2 border-dashed border-[var(--border-main)] rounded-[3rem] bg-[var(--bg-card)]/30 group">
      <div className="w-16 h-16 bg-[var(--bg-main)] rounded-2xl mx-auto flex items-center justify-center mb-6 border border-[var(--border-main)] shadow-sm text-[var(--text-muted)] opacity-40 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.2em] mb-2 italic">{title}</h3>
      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-relaxed opacity-60 max-w-sm mx-auto">{text}</p>
    </div>
  );
}

function DetailCard({ title, icon, children }: any) {
  return (
    <div className="p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] shadow-xl group hover:border-primary-600/20 transition-all">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-primary-600/10 text-primary-600 rounded-xl flex items-center justify-center font-black">
          {icon}
        </div>
        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60 italic">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function JobGroup({ title, jobs, accent }: { title: string; jobs: any[]; accent: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60 italic">{title}</h3>
        <span className={`text-xs font-black italic ${accent}`}>{jobs.length}</span>
        <div className="h-px flex-1 bg-[var(--border-main)]" />
      </div>
      {jobs.length > 0 ? (
        <div className="space-y-3">
          {jobs.map((j: any) => (
            <div key={j.id} className="p-5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] truncate">{j.title || 'Untitled Role'}</div>
                {j.location && <div className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50 mt-0.5 flex items-center gap-1"><MapPin size={9} /> {j.location}</div>}
              </div>
              {j.createdAt && <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-40 flex-shrink-0">{new Date(j.createdAt).toLocaleDateString()}</span>}
            </div>
          ))}
        </div>
      ) : (
        <EmptyLine text={`No ${title.toLowerCase()}.`} />
      )}
    </div>
  );
}
