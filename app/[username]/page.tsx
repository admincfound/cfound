"use client";
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc, increment
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { resolveUidForUsername } from '../../lib/usernameUtils';
import {
  MapPin, Eye, Download, Users, Calendar, ShieldCheck, Briefcase,
  BookOpen, Globe, Github, Linkedin, ExternalLink, Copy, Check,
  CheckCircle, Code2, GraduationCap, Award, Phone, Mail, Share2,
  Loader2, UserX, BookMarked
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
// Mirrors the actual Firestore `users/{uid}` document shape written by the
// Profile edit page, with a few legacy fields kept optional for backwards
// compatibility with documents created before this schema was finalized.

interface PublicProfile {
  uid: string;
  username?: string;
  displayName?: string;
  photoURL?: string;

  // Role / role legacy alias
  primaryRole?: string;
  secondaryRole?: string;
  /** @deprecated legacy field name, prefer primaryRole */
  currentRole?: string;

  country?: string;
  state?: string;
  city?: string;
  bio?: string;
  /** @deprecated legacy alias for bio on very old documents */
  about?: string;

  skills?: string[];
  experienceLevel?: string;

  languages?: { name: string; level: string }[];

  experiences?: {
    role: string; company: string; type?: string; location?: string; mode?: string;
    startMonth?: string; startYear: string; endMonth?: string; endYear?: string;
    current?: boolean; skills?: string; description?: string;
  }[];
  /** @deprecated legacy field name, prefer experiences */
  experience?: {
    title: string; company: string;
    startDate: string; endDate?: string; current?: boolean; description?: string;
  }[];

  education?: {
    institution: string; degree: string; department?: string;
    startYear: string; endYear?: string; current?: boolean; grade?: string;
  }[];

  projects?: {
    title: string; category?: string; description?: string;
    technologies?: string; skills?: string;
    startMonth?: string; startYear?: string; endMonth?: string; endYear?: string;
    status?: string; demoUrl?: string; githubUrl?: string;
  }[];

  certifications?: {
    name: string; org: string; issueMonth?: string; issueYear?: string; url?: string;
  }[];
  /** @deprecated legacy field name, prefer certifications */
  certificates?: { name: string; issuer: string; date?: string; issuerIcon?: string }[];

  publications?: {
    title: string; publisher: string; dateMonth?: string; dateYear?: string; url?: string;
  }[];

  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  behanceUrl?: string;
  artstationUrl?: string;
  youtubeUrl?: string;
  otherUrl?: string;

  email?: string;
  phone?: string;

  openToWork?: boolean;
  /** @deprecated legacy field name, prefer openToWork */
  isOpenToWork?: boolean;

  viewCount?: number;
  downloadCount?: number;
  connectionCount?: number;
  createdAt?: any;
}

// ─── Derived/normalized view-model helpers ────────────────────────────────────
// Keep the rendering JSX clean by resolving legacy-vs-current fields up front.

function getOpenToWork(p: PublicProfile): boolean {
  return p.openToWork ?? p.isOpenToWork ?? false;
}

function getRole(p: PublicProfile): string {
  return p.primaryRole || p.currentRole || 'Member';
}

function getAbout(p: PublicProfile): string {
  return p.bio || p.about || '';
}

interface NormalizedExperience {
  title: string; company: string; dateRange: string; description?: string;
}

function getExperiences(p: PublicProfile): NormalizedExperience[] {
  if (p.experiences && p.experiences.length > 0) {
    return p.experiences.map((e) => ({
      title: e.role,
      company: e.company,
      dateRange: `${[e.startMonth, e.startYear].filter(Boolean).join(' ')} – ${e.current ? 'Present' : [e.endMonth, e.endYear].filter(Boolean).join(' ') || 'Present'}`,
      description: e.description,
    }));
  }
  if (p.experience && p.experience.length > 0) {
    return p.experience.map((e) => ({
      title: e.title,
      company: e.company,
      dateRange: `${e.startDate} – ${e.current ? 'Present' : e.endDate}`,
      description: e.description,
    }));
  }
  return [];
}

interface NormalizedCertificate {
  name: string; issuer: string; date?: string;
}

function getCertifications(p: PublicProfile): NormalizedCertificate[] {
  if (p.certifications && p.certifications.length > 0) {
    return p.certifications.map((c) => ({
      name: c.name,
      issuer: c.org,
      date: [c.issueMonth, c.issueYear].filter(Boolean).join(' ') || undefined,
    }));
  }
  if (p.certificates && p.certificates.length > 0) {
    return p.certificates.map((c) => ({ name: c.name, issuer: c.issuer, date: c.date }));
  }
  return [];
}

interface NormalizedProject {
  title: string; subtitle?: string; description?: string; tech: string[]; url?: string;
}

function getProjects(p: PublicProfile): NormalizedProject[] {
  if (!p.projects || p.projects.length === 0) return [];
  return p.projects.map((proj) => {
    const techSource = proj.technologies || proj.skills || '';
    const tech = techSource.split(',').map((t) => t.trim()).filter(Boolean);
    return {
      title: proj.title,
      subtitle: proj.category,
      description: proj.description,
      tech,
      url: proj.demoUrl || proj.githubUrl,
    };
  });
}

interface NormalizedSocialLinks {
  linkedin?: string; github?: string; website?: string;
}

function getSocialLinks(p: PublicProfile): NormalizedSocialLinks {
  return {
    linkedin: p.linkedinUrl,
    github: p.githubUrl,
    website: p.portfolioUrl,
  };
}

function getContact(p: PublicProfile): { email?: string; phone?: string; website?: string } {
  return { email: p.email, phone: p.phone, website: p.portfolioUrl };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
        {icon}
      </div>
      <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">{title}</h2>
    </div>
  );
}

function SkillBadge({ label }: { label: string }) {
  return (
    <span className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 rounded-lg">
      {label}
    </span>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const profileUrl = typeof window !== 'undefined' ? window.location.href : `https://cfound.in/${username}`;
  const isOwnProfile = user?.uid === profile?.uid;

  useEffect(() => {
    if (username) fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // 1. Try querying by username field on the users collection first (fast path —
      //    correct for any profile saved through the current Profile edit page).
      const q = query(collection(db, 'users'), where('username', '==', username));
      const snap = await getDocs(q);

      let data: PublicProfile | null = null;
      let resolvedDocId: string | null = null;

      if (!snap.empty) {
        data = { uid: snap.docs[0].id, ...snap.docs[0].data() } as PublicProfile;
        resolvedDocId = snap.docs[0].id;
      } else {
        // 2. Fall back to the usernames/{username} reservation collection, in case
        //    the users doc hasn't been backfilled with the username field yet.
        const ownerUid = await resolveUidForUsername(username);
        if (ownerUid) {
          const ownerSnap = await getDoc(doc(db, 'users', ownerUid));
          if (ownerSnap.exists()) {
            data = { uid: ownerSnap.id, ...ownerSnap.data() } as PublicProfile;
            resolvedDocId = ownerSnap.id;
          }
        }
      }

      if (!data) {
        // 3. Final fallback: treat the route param as a raw uid (supports old links
        //    shared before usernames existed, and admin/manual navigation).
        const docRef = doc(db, 'users', username);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          data = { uid: docSnap.id, ...docSnap.data() } as PublicProfile;
          resolvedDocId = docSnap.id;
        }
      }

      if (!data || !resolvedDocId) {
        setNotFound(true);
        return;
      }

      setProfile(data);

      // Increment view count (skip own profile)
      if (user?.uid !== data.uid) {
        const ref = doc(db, 'users', resolvedDocId);
        await updateDoc(ref, { viewCount: increment(1) }).catch(() => {});
      }
    } catch (err) {
      console.error('Public profile error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success('Profile link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const memberSince = (() => {
    if (!profile?.createdAt) return 'N/A';
    const d = profile.createdAt?.toDate?.() ?? new Date(profile.createdAt);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  })();

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-sm text-gray-400 font-semibold">Loading profile…</p>
        </div>
      </div>
    );
  }

  // ── Not Found ────────────────────────────────────────────────────────────
  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <UserX size={36} className="text-gray-300" />
          </div>
          <h1 className="text-2xl font-black italic uppercase text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-400 text-sm font-medium mb-6">
            The user <span className="text-gray-600 font-bold">@{username}</span> doesn't exist or hasn't set up their public profile yet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 text-sm font-bold transition-colors"
          >
            Back to C Found
          </Link>
        </div>
      </div>
    );
  }

  // ── Derived view-model ───────────────────────────────────────────────────
  const isOpenToWork = getOpenToWork(profile);
  const role = getRole(profile);
  const about = getAbout(profile);
  const experiences = getExperiences(profile);
  const certifications = getCertifications(profile);
  const projects = getProjects(profile);
  const socialLinks = getSocialLinks(profile);
  const contact = getContact(profile);
  const publications = profile.publications || [];

  // ── Profile Page ─────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen pb-20">

      {/* ── Top Action Bar ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            {/* Reuse whatever logo element your project exports; text fallback */}
            <span className="text-lg font-black text-blue-600 italic uppercase tracking-tight">C Found</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={copyLink}
              className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} />}
              Share Profile
            </button>
            {contact.email || socialLinks.linkedin ? (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-bold transition-colors"
              >
                <Download size={14} />
                Download Resume
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-5 pt-5">

        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f1628 0%, #1a2550 40%, #1e3a8a 70%, #2563eb 100%)' }}
        >
          {/* Decorative lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="lines" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 60" stroke="white" strokeWidth="0.5" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lines)" />
          </svg>

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white/20 overflow-hidden bg-blue-900">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-3xl font-black">
                      {profile.displayName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow">
                  <ShieldCheck size={13} className="text-white" />
                </div>
              </div>

              {/* Name + Role + Bio */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight">
                    {profile.displayName}
                  </h1>
                  <CheckCircle size={20} className="text-blue-400" />
                </div>
                <p className="text-blue-300 font-bold text-sm mb-2">{role}</p>
                {profile.country && (
                  <div className="flex items-center gap-1 text-white/60 text-xs mb-3">
                    <MapPin size={11} />
                    <span>{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {about && (
                  <p className="text-white/80 text-sm leading-relaxed max-w-xl">{about}</p>
                )}

                {/* Social links */}
                <div className="flex items-center gap-2 mt-4">
                  {socialLinks.linkedin && (
                    <a href={socialLinks.linkedin} target="_blank" rel="noreferrer"
                      className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors">
                      <Linkedin size={15} />
                    </a>
                  )}
                  {socialLinks.github && (
                    <a href={socialLinks.github} target="_blank" rel="noreferrer"
                      className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors">
                      <Github size={15} />
                    </a>
                  )}
                  {socialLinks.website && (
                    <a href={socialLinks.website} target="_blank" rel="noreferrer"
                      className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors">
                      <Globe size={15} />
                    </a>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex flex-col gap-3 shrink-0 text-right">
                {[
                  { icon: <Eye size={14} />, label: 'Views', value: profile.viewCount ?? 0 },
                  { icon: <Download size={14} />, label: 'Resume Downloads', value: profile.downloadCount ?? 0 },
                  { icon: <Users size={14} />, label: 'Connections', value: profile.connectionCount ?? 0 },
                  { icon: <Calendar size={14} />, label: 'Member Since', value: memberSince },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3 text-white/80">
                    <span className="text-white/40">{s.icon}</span>
                    <div className="text-left">
                      <div className="text-[10px] text-white/40 font-semibold">{s.label}</div>
                      <div className="text-base font-black text-white leading-tight">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile stats row */}
            <div className="flex md:hidden items-center gap-6 mt-5 pt-5 border-t border-white/10">
              {[
                { label: 'Views', value: profile.viewCount ?? 0 },
                { label: 'Downloads', value: profile.downloadCount ?? 0 },
                { label: 'Connections', value: profile.connectionCount ?? 0 },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-lg font-black text-white">{s.value}</div>
                  <div className="text-[10px] text-white/50 font-semibold">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Body: two-column ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

          {/* Left main column */}
          <div className="md:col-span-8 space-y-5">

            {/* About Me */}
            {about && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card className="p-6">
                  <SectionHeader icon={<Users size={15} />} title="About Me" />
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{about}</p>
                </Card>
              </motion.div>
            )}

            {/* Experience */}
            {experiences.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                <Card className="p-6">
                  <SectionHeader icon={<Briefcase size={15} />} title="Experience" />
                  <div className="space-y-6">
                    {experiences.map((exp, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center pt-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          {i < experiences.length - 1 && (
                            <div className="w-px flex-1 bg-gray-100 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex flex-wrap items-start justify-between gap-1 mb-0.5">
                            <h3 className="font-black text-gray-900 text-sm">{exp.title}</h3>
                            <span className="text-xs text-gray-400 font-medium shrink-0">
                              {exp.dateRange}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-blue-600 mb-2">{exp.company}</p>
                          {exp.description && (
                            <p className="text-xs text-gray-500 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
                <Card className="p-6">
                  <SectionHeader icon={<GraduationCap size={15} />} title="Education" />
                  <div className="space-y-5">
                    {profile.education.map((edu, i) => (
                      <div key={i}>
                        <div className="flex flex-wrap items-start justify-between gap-1 mb-0.5">
                          <h3 className="font-black text-gray-900 text-sm">{edu.degree}</h3>
                          <span className="text-xs text-gray-400 font-medium">
                            {edu.startYear} – {edu.current ? 'Present' : (edu.endYear || 'Present')}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-blue-600">{edu.institution}</p>
                        {edu.grade && <p className="text-xs text-gray-400 mt-1 font-medium">CGPA: {edu.grade}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
                <Card className="p-6">
                  <SectionHeader icon={<Code2 size={15} />} title="Projects" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((proj, i) => (
                      <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-blue-100 hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 text-xs font-black">
                              {proj.title?.[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-black text-gray-900">{proj.title}</h4>
                                {proj.url && (
                                  <a href={proj.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                                    <ExternalLink size={11} />
                                  </a>
                                )}
                              </div>
                              {proj.subtitle && <p className="text-[10px] text-gray-400 font-medium">{proj.subtitle}</p>}
                            </div>
                          </div>
                        </div>
                        {proj.description && (
                          <p className="text-xs text-gray-500 leading-relaxed mb-3">{proj.description}</p>
                        )}
                        {proj.tech.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {proj.tech.map((t, j) => (
                              <span key={j} className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
                <Card className="p-6">
                  <SectionHeader icon={<Award size={15} />} title="Certificates" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {certifications.map((cert, i) => (
                      <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-blue-100 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-black text-gray-600 shrink-0">
                              {cert.issuer?.[0]}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-gray-900 leading-snug">{cert.name}</h4>
                              <p className="text-[10px] text-gray-400 font-medium mt-0.5">{cert.issuer}</p>
                              {cert.date && <p className="text-[10px] text-gray-400 font-medium">{cert.date}</p>}
                            </div>
                          </div>
                          <CheckCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Publications */}
            {publications.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
                <Card className="p-6">
                  <SectionHeader icon={<BookMarked size={15} />} title="Publications" />
                  <div className="space-y-4">
                    {publications.map((pub, i) => (
                      <div key={i} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex flex-wrap items-start justify-between gap-1">
                          <h4 className="text-sm font-black text-gray-900">
                            {pub.url ? (
                              <a href={pub.url} target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                                {pub.title} <ExternalLink size={11} />
                              </a>
                            ) : pub.title}
                          </h4>
                          <span className="text-xs text-gray-400 font-medium">
                            {[pub.dateMonth, pub.dateYear].filter(Boolean).join(' ')}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-blue-600 mt-0.5">{pub.publisher}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Contact */}
            {(contact.email || contact.phone || profile.country) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="p-6">
                  <SectionHeader icon={<Mail size={15} />} title="Contact" />
                  <div className="flex flex-wrap gap-6">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Mail size={14} className="text-gray-400" />
                        <span className="font-semibold">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone size={14} className="text-gray-400" />
                        <span className="font-semibold">{contact.phone}</span>
                      </div>
                    )}
                    {profile.country && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="font-semibold">{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {contact.website && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Globe size={14} className="text-gray-400" />
                        <a href={contact.website} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline">
                          {contact.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right sidebar column */}
          <div className="md:col-span-4 space-y-5">

            {/* Profile Link */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 }}>
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={15} className="text-blue-600" />
                  <h3 className="font-black text-gray-900 text-sm">My C Found Profile</h3>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-2">
                  <span className="text-xs font-semibold text-blue-700 flex-1 truncate">
                    cfound.in/{profile.username ?? username}
                  </span>
                  <button onClick={copyLink} className="shrink-0 text-blue-500 hover:text-blue-700 transition-colors">
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 font-medium">This is your public profile link. Share it anywhere with anyone.</p>
              </Card>
            </motion.div>

            {/* Open to Work */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.09 }}>
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${isOpenToWork ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <h3 className="font-black text-gray-900 text-sm">
                    {isOpenToWork ? 'Open to Opportunities' : 'Not Currently Available'}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {isOpenToWork ? 'Actively looking for new opportunities.' : 'Not accepting opportunities right now.'}
                </p>
                {isOpenToWork && (
                  <span className="inline-block text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                    Available for Work
                  </span>
                )}
              </Card>
            </motion.div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Code2 size={15} className="text-blue-600" />
                    <h3 className="font-black text-gray-900 text-sm">Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, i) => (
                      <SkillBadge key={i} label={skill} />
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe size={15} className="text-blue-600" />
                    <h3 className="font-black text-gray-900 text-sm">Languages</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-y-3">
                    {profile.languages.map((lang, i) => (
                      <div key={i}>
                        <p className="text-xs font-bold text-gray-800">{lang.name}</p>
                        <p className="text-[10px] text-blue-500 font-semibold">{lang.level}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Edit own profile CTA */}
            {isOwnProfile && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}>
                <Card className="p-5 border-blue-100 bg-blue-50">
                  <p className="text-xs font-semibold text-blue-700 mb-3">This is how others see your profile.</p>
                  <Link
                    href="/profile"
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors"
                  >
                    Edit Profile
                  </Link>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-gray-100 mt-4">
          <p className="text-xs text-gray-400 font-medium">
            © {new Date().getFullYear()} C Found. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}