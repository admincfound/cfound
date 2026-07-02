'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

import { getProfileCompletion } from '@/app/lib/profileUtils';
import { generatePDF } from '@/app/lib/resumeBuilder';
import FormattedText from '@/app/components/FormattedText';

import { ROLES, SKILLS } from '@/app/constants/profile';
import {
  Search,
  User,
  ExternalLink,
  FileText,
  Github,
  Linkedin,
  Globe,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Layers,
  X,
  CheckCircle2,
  Copy,
  Check,
  IdCard,
  Calendar,
  ShieldQuestion,
  Link2,
  Download,
  PenLine,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PUBLIC_PROFILE_BASE = 'cfound.in';

// ── Derived career status — mirrors the logic used on the public profile page ──
function deriveStatus(user: any): string {
  if (user.role === 'admin') return 'Admin';
  if (user.careerStatus) return user.careerStatus;
  if (user.currentJobTitle) return 'Working Professional';

  const currentExp = (user.experiences || []).find((e: any) => e.current);
  if (currentExp) return 'Working Professional';

  const pastExp = (user.experiences || []).filter((e: any) => !e.current);
  if (pastExp.length > 0) return 'Experienced Professional';

  const currentEdu = (user.education || []).find((e: any) => e.current);
  if (currentEdu) return 'Student';

  return user.experienceLevel === 'Fresher' || !user.experienceLevel ? 'Fresher' : user.experienceLevel;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error('Could not copy'));
}

type SortKey = 'newest' | 'oldest' | 'updated' | 'complete' | 'alpha';

export default function UserLookup() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedCompletion, setSelectedCompletion] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), limit(200));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Distinct real states/cities present in the loaded data ────────────────
  const availableStates = useMemo(() => {
    const s = new Set<string>();
    users.forEach(u => u.state && s.add(u.state));
    return Array.from(s).sort();
  }, [users]);

  const availableCities = useMemo(() => {
    const s = new Set<string>();
    users.forEach(u => {
      if (!selectedState || u.state === selectedState) {
        if (u.city) s.add(u.city);
      }
    });
    return Array.from(s).sort();
  }, [users, selectedState]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    let result = users.filter((user) => {
      const userSkills = Array.isArray(user.skills) ? user.skills.map((s: string) => s.toLowerCase().trim()) : [];
      const experience = (user.experienceLevel || '').toLowerCase().trim();

      // Search across name, username, email, doc id, phone, company, college, skills, location
      const companies = (user.experiences || []).map((e: any) => e.company || '').join(' ');
      const colleges = (user.education || []).map((e: any) => e.institution || '').join(' ');
      const searchable = [
        user.displayName, user.username, user.email, user.id, user.phone,
        user.currentCompany, companies, colleges,
        userSkills.join(' '), user.city, user.state,
      ].filter(Boolean).join(' ').toLowerCase();

      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);

      const matchesRole = !selectedRole || (user.primaryRole || '').toLowerCase() === selectedRole.toLowerCase();
      const matchesSkill = !selectedSkill || userSkills.includes(selectedSkill.toLowerCase().trim());
      const matchesExperience = !selectedExperience || experience === selectedExperience.toLowerCase();

      const completion = getProfileCompletion(user);
      const matchesCompletion =
        !selectedCompletion ||
        (selectedCompletion === 'complete' && completion.isComplete) ||
        (selectedCompletion === 'incomplete' && !completion.isComplete);

      const matchesAvailability =
        !selectedAvailability ||
        (selectedAvailability === 'open' && user.openToWork) ||
        (selectedAvailability === 'not-open' && !user.openToWork);

      const matchesState = !selectedState || user.state === selectedState;
      const matchesCity = !selectedCity || user.city === selectedCity;

      return matchesSearch && matchesRole && matchesSkill && matchesExperience &&
        matchesCompletion && matchesAvailability && matchesState && matchesCity;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'updated':
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        case 'complete':
          return getProfileCompletion(b).percentage - getProfileCompletion(a).percentage;
        case 'alpha':
          return (a.displayName || '').localeCompare(b.displayName || '');
        default:
          return 0;
      }
    });

    return result;
  }, [users, searchTerm, selectedRole, selectedSkill, selectedExperience, selectedCompletion, selectedAvailability, selectedState, selectedCity, sortBy]);

  const activeFilterCount = [selectedRole, selectedSkill, selectedExperience, selectedCompletion, selectedAvailability, selectedState, selectedCity].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedRole(''); setSelectedSkill(''); setSelectedExperience('');
    setSelectedCompletion(''); setSelectedAvailability(''); setSelectedState(''); setSelectedCity('');
  };

  const handleDownloadResume = async () => {
    if (!selectedUser) return;
    setDownloadingResume(true);
    try {
      await generatePDF(selectedUser);
    } catch (err) {
      console.error(err);
      toast.error('Could not generate resume');
    } finally {
      setDownloadingResume(false);
    }
  };

  return (
    <div className="pt-16 pb-32 px-6 min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-10">
          <div>
            <span className="text-primary-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">Talent Acquisition</span>
            <h1 className="text-5xl md:text-7xl font-black font-display tracking-tight text-[var(--text-main)] uppercase italic">Personnel <span className="text-primary-600">Database.</span></h1>
            <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-2">{filteredUsers.length} of {users.length} Identified Entities</p>
          </div>
        </div>

        {/* Search + Sort + Filter toggle */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative group flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-hover:text-primary-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search name, username, email, ID, phone, company, college, skills..."
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
                <option value="updated">Recently Updated</option>
                <option value="complete">Most Complete</option>
                <option value="alpha">Alphabetical</option>
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

        {/* Expandable filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] shadow-xl grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <FilterSelect label="Role" value={selectedRole} onChange={setSelectedRole}>
                  <option value="">All Roles</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </FilterSelect>

                <FilterSelect label="Skill" value={selectedSkill} onChange={setSelectedSkill}>
                  <option value="">All Skills</option>
                  {SKILLS.map((s) => <option key={s} value={s.toLowerCase().trim()}>{s}</option>)}
                </FilterSelect>

                <FilterSelect label="Experience" value={selectedExperience} onChange={setSelectedExperience}>
                  <option value="">All Levels</option>
                  <option value="Fresher">Fresher</option>
                  <option value="1–2 Years">1–2 Years</option>
                  <option value="2–5 Years">2–5 Years</option>
                  <option value="5–10 Years">5–10 Years</option>
                  <option value="10+ Years">10+ Years</option>
                </FilterSelect>

                <FilterSelect label="Profile" value={selectedCompletion} onChange={setSelectedCompletion}>
                  <option value="">Complete + Incomplete</option>
                  <option value="complete">Complete</option>
                  <option value="incomplete">Incomplete</option>
                </FilterSelect>

                <FilterSelect label="Availability" value={selectedAvailability} onChange={setSelectedAvailability}>
                  <option value="">All</option>
                  <option value="open">Open to Work</option>
                  <option value="not-open">Not Looking</option>
                </FilterSelect>

                <FilterSelect label="State" value={selectedState} onChange={(v) => { setSelectedState(v); setSelectedCity(''); }}>
                  <option value="">All States</option>
                  {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                </FilterSelect>

                <FilterSelect label="City" value={selectedCity} onChange={setSelectedCity}>
                  <option value="">All Cities</option>
                  {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            [1, 2, 3, 4, 5, 6, 7, 8].map(n => <div key={n} className="h-48 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] animate-pulse" />)
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const status = deriveStatus(user);
              return (
                <motion.div
                  layout
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] hover:border-primary-600/30 transition-all group cursor-pointer shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                    <User size={120} />
                  </div>
                  <div className="flex items-center gap-6 mb-8">
                    <img
                      src={user.photoURL || user.googlePhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=0052CC&color=fff`}
                      alt={user.displayName}
                      className="w-14 h-14 rounded-2xl object-cover border border-primary-600/20"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h3 className="font-black text-sm text-[var(--text-main)] uppercase italic tracking-tight truncate">{user.displayName || 'Anonymous'}</h3>
                      <p className="text-[9px] text-primary-500 font-black uppercase tracking-[0.2em] mb-1 truncate">{user.primaryRole || status}</p>
                      <div className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">Profile Comp: {getProfileCompletion(user).percentage}%</div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    {user.city && (
                      <div className="flex items-center gap-3 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest italic">
                        <MapPin size={12} className="text-primary-600" /> {user.city}{user.state ? `, ${user.state}` : ''}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest italic">
                      <Briefcase size={12} className="text-primary-600" /> {status}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 opacity-60">
                    {(Array.isArray(user.skills) ? user.skills : [])
                      .slice(0, 3)
                      .map((s: string) => (
                        <span key={s} className="px-2 py-0.5 bg-primary-600/5 text-primary-600 rounded text-[7px] font-black uppercase tracking-tighter border border-primary-600/10">{s}</span>
                      ))}
                    {(user.skills?.length || 0) > 3 && <span className="text-[7px] font-black uppercase tracking-tighter opacity-40">+{user.skills.length - 3}</span>}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-[var(--border-main)] rounded-[4rem] bg-[var(--bg-card)]/20">
              <X size={48} className="mx-auto mb-6 text-red-500 opacity-20" />
              <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">No Target Identified</p>
              {(activeFilterCount > 0 || searchTerm) && (
                <button onClick={() => { clearFilters(); setSearchTerm(''); }} className="mt-4 text-[9px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700">
                  Clear search &amp; filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Detail Overlay */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-3xl h-full bg-[var(--bg-main)] border-l border-[var(--border-main)] shadow-2xl overflow-y-auto no-scrollbar"
            >
              {/* ── STICKY HEADER: View Public Profile always visible without scrolling ── */}
              <div className="sticky top-0 z-10 bg-[var(--bg-main)]/95 backdrop-blur-md border-b border-[var(--border-main)] px-8 py-5 flex items-center justify-between gap-4">
                {selectedUser.username ? (
                  <a
                    href={`https://${PUBLIC_PROFILE_BASE}/${selectedUser.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    <ExternalLink size={14} /> View Public Profile
                  </a>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 bg-[var(--bg-hover)] text-[var(--text-muted)] rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest">
                    No Public Username Set
                  </div>
                )}
                <button onClick={() => setSelectedUser(null)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl hover:text-red-500 transition-all hover:rotate-90 flex-shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 lg:p-12 pt-8">
                <div className="flex items-center gap-8 mb-10">
                  <img
                    src={selectedUser.photoURL || selectedUser.googlePhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.displayName || 'U')}&background=0052CC&color=fff`}
                    alt="profile"
                    className="w-24 h-24 rounded-[2rem] border-4 border-primary-600/20 object-cover flex-shrink-0"
                    onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=U&background=0052CC&color=fff`; }}
                  />
                  <div className="min-w-0">
                    <h2 className="text-3xl lg:text-4xl font-black font-display uppercase italic text-[var(--text-main)] mb-2 truncate">{selectedUser.displayName}</h2>
                    <div className="flex flex-wrap gap-3 items-center">
                      <span className="px-4 py-1.5 bg-primary-600 text-[9px] font-black uppercase tracking-widest text-white rounded-lg italic">
                        {selectedUser.role === 'admin' ? 'Administrator' : 'Talent Asset'}
                      </span>
                      <span className="px-4 py-1.5 bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-main)] text-[9px] font-black uppercase tracking-widest rounded-lg italic">
                        {deriveStatus(selectedUser)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── USER ID with copy ── */}
                <div className="mb-8 p-5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <IdCard size={16} className="text-primary-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">User ID</div>
                      <div className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight truncate">{selectedUser.id}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { copyToClipboard(selectedUser.id, 'User ID'); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }}
                    className="flex-shrink-0 p-2.5 bg-[var(--bg-hover)] rounded-xl hover:bg-primary-600 hover:text-white transition-all text-[var(--text-muted)]"
                  >
                    {copiedId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* ── QUICK ACTIONS ── */}
                <div className="mb-10 grid grid-cols-2 md:grid-cols-3 gap-3">
                  <QuickAction
                    icon={<Link2 size={15} />}
                    label="Copy Profile Link"
                    disabled={!selectedUser.username}
                    onClick={() => copyToClipboard(`https://${PUBLIC_PROFILE_BASE}/${selectedUser.username}`, 'Profile link')}
                  />
                  <QuickAction
                    icon={<IdCard size={15} />}
                    label="Copy User ID"
                    onClick={() => copyToClipboard(selectedUser.id, 'User ID')}
                  />
                  <QuickAction
                    icon={<Download size={15} />}
                    label={downloadingResume ? 'Generating...' : 'Download Resume'}
                    disabled={downloadingResume || !getProfileCompletion(selectedUser).isComplete}
                    onClick={handleDownloadResume}
                  />
                  <QuickAction
                    icon={<Mail size={15} />}
                    label="Email User"
                    disabled={!selectedUser.email}
                    onClick={() => window.open(`mailto:${selectedUser.email}`, '_blank')}
                  />
                  <QuickAction
                    icon={<ExternalLink size={15} />}
                    label="View Public Profile"
                    disabled={!selectedUser.username}
                    onClick={() => window.open(`https://${PUBLIC_PROFILE_BASE}/${selectedUser.username}`, '_blank', 'noopener,noreferrer')}
                  />
                  <QuickAction
                    icon={<PenLine size={15} />}
                    label="Edit Profile"
                    disabled
                    tooltip="Admin editing of another user's profile isn't wired up yet"
                  />
                </div>

                {/* ── ACCOUNT INFO ── */}
                <div className="mb-10 p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-6">Account Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <InfoStat label="Account Type" value={selectedUser.role === 'admin' ? 'Administrator' : 'Standard User'} />
                    <InfoStat label="Current Status" value={deriveStatus(selectedUser)} />
                    <InfoStat
                      label="Profile Completion"
                      value={`${getProfileCompletion(selectedUser).percentage}%`}
                      valueClassName="text-primary-600"
                    />
                    <InfoStat
                      label="Email Verification"
                      value="Not Tracked"
                      icon={<ShieldQuestion size={13} className="text-[var(--text-muted)]" />}
                      hint="Not stored per-user in Firestore"
                    />
                    <InfoStat
                      label="Phone Verification"
                      value="Not Tracked"
                      icon={<ShieldQuestion size={13} className="text-[var(--text-muted)]" />}
                      hint="No verification field exists yet"
                    />
                    <InfoStat
                      label="Account Created"
                      value={selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
                      icon={<Calendar size={13} className="text-primary-600" />}
                    />
                  </div>
                  {!getProfileCompletion(selectedUser).isComplete && (
                    <div className="mt-5 pt-5 border-t border-[var(--border-main)] text-[9px] text-red-500 font-bold uppercase tracking-widest">
                      Missing: {getProfileCompletion(selectedUser).missing.join(', ')}
                    </div>
                  )}
                </div>

                <div className="mb-10 p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-4">Declaration &amp; Signature</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      {selectedUser.declarationAccepted ? (
                        <div className="text-emerald-500 font-bold text-sm uppercase flex items-center gap-2"><CheckCircle2 size={16} /> Accepted</div>
                      ) : (
                        <div className="text-red-500 font-bold text-sm uppercase flex items-center gap-2"><X size={16} /> Pending</div>
                      )}
                      <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">Declaration &amp; Consent</div>
                    </div>
                    <div>
                      {selectedUser.signature ? (
                        <div className="text-emerald-500 font-bold text-sm flex items-center gap-2 font-serif italic"><CheckCircle2 size={16} /> {selectedUser.signature}</div>
                      ) : (
                        <div className="text-red-500 font-bold text-sm uppercase flex items-center gap-2"><X size={16} /> Missing</div>
                      )}
                      <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">Digital Signature</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                  <div className="space-y-8">
                    <DetailCard title="Primary Core" icon={<Briefcase size={16} />}>
                      <div className="text-sm font-black text-[var(--text-main)] uppercase italic tracking-widest mb-1">{selectedUser.primaryRole || 'Not Specified'}</div>
                      <div className="text-[10px] font-black text-primary-500 uppercase tracking-widest opacity-60">Experience: {selectedUser.experienceLevel || 'Not Specified'}</div>
                    </DetailCard>
                    <DetailCard title="Connect Intel" icon={<Mail size={16} />}>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                        <Mail size={12} className="text-primary-600" /> {selectedUser.email}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        <Phone size={12} className="text-primary-600" /> {selectedUser.phone || 'No Comms'}
                      </div>
                    </DetailCard>
                  </div>
                  <div className="space-y-8">
                    <DetailCard title="Arsenal Protocols (Skills)" icon={<Layers size={16} />}>
                      {(Array.isArray(selectedUser.skills) ? selectedUser.skills : []).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.skills.map((s: string) => (
                            <span key={s} className="px-3 py-1 bg-primary-600 text-white rounded-lg text-[8px] font-black uppercase tracking-tighter">{s}</span>
                          ))}
                        </div>
                      ) : (
                        <EmptyLine text="No skills added yet." />
                      )}
                    </DetailCard>
                    <DetailCard title="Resume" icon={<FileText size={16} />}>
                      {getProfileCompletion(selectedUser).isComplete ? (
                        <button
                          onClick={handleDownloadResume}
                          disabled={downloadingResume}
                          className="w-full flex items-center justify-between p-4 bg-emerald-600/10 border border-emerald-600/20 rounded-xl group/res hover:bg-emerald-600 transition-all"
                        >
                          <div className="text-left">
                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 group-hover/res:text-white">
                              {downloadingResume ? 'Generating...' : 'Generate & Download PDF'}
                            </div>
                          </div>
                          <Download size={18} className="text-emerald-600 group-hover/res:text-white transition-all" />
                        </button>
                      ) : (
                        <EmptyLine text="Resume not available — profile incomplete." />
                      )}
                    </DetailCard>
                  </div>
                </div>

                <div className="space-y-8 mb-16">
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[var(--text-muted)] pl-2 opacity-60 italic border-l-2 border-primary-600">Operational Log (Experience)</h3>
                  {(Array.isArray(selectedUser.experiences) ? selectedUser.experiences : []).length > 0 ? (
                    <div className="space-y-6">
                      {selectedUser.experiences.map((exp: any, i: number) => (
                        <div key={i} className="p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3rem] relative overflow-hidden group/exp">
                          <div className="flex items-center justify-between mb-4 gap-4">
                            <h4 className="text-lg font-black text-[var(--text-main)] uppercase italic tracking-tight">{exp.role} @ {exp.company}</h4>
                            <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest flex-shrink-0">{exp.type}</span>
                          </div>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest italic mb-6 opacity-60">
                            {[exp.startMonth, exp.startYear].filter(Boolean).join(' ')} — {exp.current ? 'ACTIVE ENGAGEMENT' : [exp.endMonth, exp.endYear].filter(Boolean).join(' ')} // {exp.mode}
                          </p>
                          {exp.description && (
                            <div className="border-l border-[var(--border-main)] pl-6">
                              <FormattedText
                                text={exp.description}
                                className="text-xs font-medium text-[var(--text-muted)] leading-relaxed"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyLine text="No professional experience added." />
                  )}
                </div>

                <div className="space-y-8 mb-16">
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[var(--text-muted)] pl-2 opacity-60 italic border-l-2 border-primary-600">Archive Entries (Projects)</h3>
                  {(Array.isArray(selectedUser.projects) ? selectedUser.projects : []).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedUser.projects.map((proj: any, i: number) => (
                        <div key={i} className="p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] group/proj">
                          <h4 className="text-sm font-black text-[var(--text-main)] uppercase italic tracking-tight mb-2">{proj.title} <span className="text-[8px] opacity-40 ml-2">// {proj.status}</span></h4>
                          {proj.description && (
                            <div className="mb-6 opacity-60 line-clamp-2">
                              <FormattedText
                                text={proj.description}
                                className="text-[9px] font-bold text-[var(--text-muted)] leading-relaxed uppercase tracking-widest"
                              />
                            </div>
                          )}
                          <div className="flex gap-3">
                            {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-[var(--bg-main)] rounded-xl text-[var(--text-muted)] hover:text-primary-600 transition-all"><Github size={14} /></a>}
                            {proj.demoUrl && <a href={proj.demoUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-[var(--bg-main)] rounded-xl text-[var(--text-muted)] hover:text-primary-600 transition-all"><Globe size={14} /></a>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyLine text="No projects added." />
                  )}
                </div>

                <div className="space-y-8 mb-16">
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[var(--text-muted)] pl-2 opacity-60 italic border-l-2 border-primary-600">Education</h3>
                  {(Array.isArray(selectedUser.education) ? selectedUser.education : []).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedUser.education.map((edu: any, i: number) => (
                        <div key={i} className="p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem]">
                          <h4 className="text-sm font-black text-[var(--text-main)] uppercase italic tracking-tight mb-1">{edu.institution}</h4>
                          <p className="text-[9px] font-bold text-primary-500 uppercase tracking-widest mb-2">{edu.degree}{edu.department ? ` · ${edu.department}` : ''}</p>
                          <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">{edu.startYear} — {edu.current ? 'Present' : edu.endYear}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyLine text="No education details available." />
                  )}
                </div>

                <div className="mt-16 pt-10 border-t border-[var(--border-main)]">
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-40">Identity Footprint</div>
                    <div className="flex gap-4">
                      {selectedUser.linkedinUrl && <a href={selectedUser.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-primary-600"><Linkedin size={18} /></a>}
                      {selectedUser.githubUrl && <a href={selectedUser.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-primary-600"><Github size={18} /></a>}
                      {selectedUser.portfolioUrl && <a href={selectedUser.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-primary-600"><Globe size={18} /></a>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
      className={`flex items-center gap-2 px-4 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
        disabled
          ? 'bg-[var(--bg-hover)] text-[var(--text-muted)] border-transparent opacity-40 cursor-not-allowed'
          : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)] hover:bg-primary-600 hover:text-white hover:border-primary-600'
      }`}
    >
      {icon} <span className="truncate">{label}</span>
    </button>
  );
}

function InfoStat({ label, value, icon, hint, valueClassName }: { label: string; value: string; icon?: React.ReactNode; hint?: string; valueClassName?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <div className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
      </div>
      <div className={`text-sm font-black uppercase tracking-tight ${valueClassName || 'text-[var(--text-main)]'}`}>{value}</div>
      {hint && <div className="text-[7px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40 mt-0.5">{hint}</div>}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50 italic">{text}</p>;
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