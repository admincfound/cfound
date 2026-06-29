'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadToImageKit, deleteFromImageKit } from '../lib/imagekitUpload';
import { useAuth } from '../context/AuthContext';
import {
  validateUsernameFormat, normalizeUsername, isUsernameAvailable,
  claimUsername, changeUsername,
} from '../lib/usernameUtils';
import { 
  User, Github, Linkedin, Globe, Plus, Trash2, Save, 
  ChevronDown, ChevronUp, Briefcase, BookOpen, Award, Layers,
  Sparkles, Link as LinkIcon, BookMarked, AlertCircle, CheckCircle2, X, Edit3,
  ArrowUp, MapPin, ExternalLink, BadgeCheck, Quote, PenLine,
  BarChart2, GraduationCap, ShieldCheck, Camera, ImageOff, Upload,
  AtSign, Loader2, Copy, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getProfileCompletion } from '../lib/profileUtils';

// ── Lazy-loaded premium feature components ───────────────────────────────────
// These are code-split so they don't increase initial bundle size.
const CropModal = lazy(() => import('./CropModal'));
const DownloadDropdown = lazy(() => import('./DownloadDropdown'));

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Personal Project', 'Team Project', 'Volunteer', 'Other'];
const WORK_MODES = ['Remote', 'Hybrid', 'Onsite'];
const PROJECT_STATUS = ['Completed', 'In Progress', 'Planned'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = Array.from({length: 40}, (_, i) => new Date().getFullYear() - i).map(String);

// Debounce delay (ms) for live username-availability checking while typing.
const USERNAME_CHECK_DEBOUNCE_MS = 500;

// The public-facing base URL shown in the "your profile link" preview card.
const PUBLIC_PROFILE_BASE = 'cfound.in';

// ── IMAGEKIT DETECTION ────────────────────────────────────────────────────────

/**
 * Single source of truth: returns true only when `url` is a photo that was
 * uploaded to ImageKit by this app (i.e. stored under our URL endpoint).
 * Uses the env var so there is no hardcoded domain anywhere.
 */
function isImageKitPhoto(url: string | undefined | null): boolean {
  if (!url) return false;
  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  if (!endpoint) return false;
  return url.startsWith(endpoint);
}

// ── REQUIRED FIELDS per card type ────────────────────────────────────────────

const CARD_REQUIRED: Record<string, { field: string; label: string }[]> = {
  experiences: [
    { field: 'role', label: 'Role / Position' },
    { field: 'company', label: 'Company / Organization' },
    { field: 'startYear', label: 'Start Year' },
  ],
  projects: [
    { field: 'title', label: 'Project Title' },
    { field: 'description', label: 'Description' },
  ],
  education: [
    { field: 'institution', label: 'Institution Name' },
    { field: 'degree', label: 'Degree / Course' },
    { field: 'startYear', label: 'Start Year' },
  ],
  certifications: [
    { field: 'name', label: 'Certification Name' },
    { field: 'org', label: 'Organization' },
  ],
  publications: [
    { field: 'title', label: 'Title' },
    { field: 'publisher', label: 'Publisher' },
  ],
};

function isCardComplete(section: string, item: any): boolean {
  const required = CARD_REQUIRED[section] || [];
  return required.every(r => item[r.field]?.toString().trim());
}

function getMissingFields(section: string, item: any): string[] {
  const required = CARD_REQUIRED[section] || [];
  return required.filter(r => !item[r.field]?.toString().trim()).map(r => r.label);
}

const EXPERIENCE_LEVELS_REQUIRING_EXP = ['1–2 Years', '2–5 Years', '5–10 Years', '10+ Years'];

// ── USERNAME STATUS TYPE ──────────────────────────────────────────────────────

type UsernameStatus = 'idle' | 'unchanged' | 'checking' | 'available' | 'unavailable' | 'invalid';

// ── FIELD WRAPPER ─────────────────────────────────────────────────────────────

const FieldWrapper = ({ show, children }: { show: boolean; children: React.ReactNode }) => {
  return show ? <>{children}</> : null;
};

interface ValidationError {
  section: string;
  message: string;
}

function ProfileContent() {
  const { profile, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  // Track which cards have been "touched" (added in this session) — keyed by id
  const [touchedCards, setTouchedCards] = useState<Set<string>>(new Set());

  // ── PHOTO STATE ───────────────────────────────────────────────────────────
  const [photoURLAtEditStart, setPhotoURLAtEditStart] = useState<string>('');
  const [pendingPhotoRemoval, setPendingPhotoRemoval] = useState(false);

  // ── USERNAME STATE ────────────────────────────────────────────────────────
  // The username the user had *before* entering edit mode — used to detect
  // whether a change actually happened, and as the "old" value when reserving
  // it during a change.
  const [usernameAtEditStart, setUsernameAtEditStart] = useState<string>('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameMessage, setUsernameMessage] = useState<string>('');
  const [usernameCopied, setUsernameCopied] = useState(false);
  const usernameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped on every keystroke so a stale async check can detect it's outdated
  // and bail out without overwriting a newer result.
  const usernameCheckToken = useRef(0);
  const searchParams = useSearchParams();

  // Scroll to + focus the username input, enabling edit mode first if needed
  const scrollToUsernameField = () => {
    if (!isEditing) {
      setPhotoURLAtEditStart(formData?.photoURL || '');
      setUsernameAtEditStart(formData?.username || '');
      setIsEditing(true);
    }
    setTimeout(() => {
      const el = document.getElementById('username-input');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 150);
  };

  // ── CROP STATE ────────────────────────────────────────────────────────────
  // When set, a crop modal is shown for the selected raw image src
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  // UID passed down so PhotoUpload doesn't need extra context
  const [pendingUploadUID, setPendingUploadUID] = useState<string | undefined>(undefined);
  // Callback stored so CropModal can trigger the actual upload
  const cropUploadCallback = useRef<((blob: Blob) => Promise<void>) | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  
  const [collapsed, setCollapsed] = useState({
    personal: false,
    experience: false,
    projects: false,
    links: false,
    education: false,
    certifications: false,
    publications: false
  });

  const [skillInput, setSkillInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        country: profile.country || '',
        state: profile.state || '',
        city: profile.city || '',
        photoURL: profile.photoURL || '',
        username: profile.username || '',
        bio: profile.bio || '',
        role: profile.role || 'user',
        primaryRole: profile.primaryRole || '',
        secondaryRole: profile.secondaryRole || '',
        experienceLevel: profile.experienceLevel || 'Fresher',
        openToWork: profile.openToWork ?? true,
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        declarationAccepted: profile.declarationAccepted || false,
        signature: profile.signature || '',
        portfolioUrl: profile.portfolioUrl || '',
        githubUrl: profile.githubUrl || profile.github || '',
        linkedinUrl: profile.linkedinUrl || profile.linkedin || '',
        behanceUrl: profile.behanceUrl || '',
        artstationUrl: profile.artstationUrl || '',
        youtubeUrl: profile.youtubeUrl || '',
        otherUrl: profile.otherUrl || '',
        experiences: Array.isArray(profile.experiences) ? profile.experiences : Array.isArray(profile.experience) ? profile.experience : [],
        projects: Array.isArray(profile.projects) ? profile.projects : [],
        education: Array.isArray(profile.education) ? profile.education : [],
        certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
        publications: Array.isArray(profile.publications) ? profile.publications : [],
      });
    }
  }, [profile]);

  useEffect(() => {
    if (formData && !initialData) {
      setInitialData(JSON.stringify(formData));
    }
  }, [formData, initialData]);

  useEffect(() => {
    if (!formData || !initialData) return;
    setHasChanges(JSON.stringify(formData) !== initialData);
  }, [formData, initialData]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && isEditing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, isEditing]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle ?action=choose-username — enables edit mode and scrolls to username field
  useEffect(() => {
    if (searchParams?.get('action') === 'choose-username' && formData && !isEditing) {
      scrollToUsernameField();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, formData]);

  // ── USERNAME: live availability checking ─────────────────────────────────
  // Debounced so we don't hit Firestore on every keystroke. Re-runs whenever
  // the username field changes while editing.
  useEffect(() => {
    if (!isEditing || !formData) return;

    if (usernameCheckTimer.current) clearTimeout(usernameCheckTimer.current);

    const raw = formData.username || '';
    const normalized = normalizeUsername(raw);
    const myToken = ++usernameCheckToken.current;

    // Empty username is allowed (it's an optional field) — nothing to check.
    if (!normalized) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    // Typing back their own current username — always fine, skip the network check.
    if (normalized === normalizeUsername(usernameAtEditStart)) {
      setUsernameStatus('unchanged');
      setUsernameMessage('This is your current username.');
      return;
    }

    const format = validateUsernameFormat(raw);
    if (!format.valid) {
      setUsernameStatus('invalid');
      setUsernameMessage(format.error || 'Invalid username');
      return;
    }

    setUsernameStatus('checking');
    setUsernameMessage('Checking availability…');

    usernameCheckTimer.current = setTimeout(async () => {
      try {
        const result = await isUsernameAvailable(normalized, profile?.uid);
        if (usernameCheckToken.current !== myToken) return; // stale response, ignore
        if (result.available) {
          setUsernameStatus('available');
          setUsernameMessage('Username is available!');
        } else {
          setUsernameStatus('unavailable');
          setUsernameMessage(result.message || 'Username is not available.');
        }
      } catch (err) {
        if (usernameCheckToken.current !== myToken) return;
        console.error('Username availability check failed:', err);
        setUsernameStatus('unavailable');
        setUsernameMessage('Could not verify availability. Please try again.');
      }
    }, USERNAME_CHECK_DEBOUNCE_MS);

    return () => {
      if (usernameCheckTimer.current) clearTimeout(usernameCheckTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.username, isEditing, usernameAtEditStart, profile?.uid]);

  // ── INCOMPLETE CARDS (computed) ───────────────────────────────────────────

  const incompleteCards = useMemo(() => {
    if (!formData) return new Map<string, { section: string; missing: string[] }>();
    const result = new Map<string, { section: string; missing: string[] }>();
    const sections = ['experiences', 'projects', 'education', 'certifications', 'publications'];
    for (const section of sections) {
      const items = formData[section] || [];
      for (const item of items) {
        if (!isCardComplete(section, item)) {
          result.set(item.id, { section, missing: getMissingFields(section, item) });
        }
      }
    }
    return result;
  }, [formData]);

  // ── VALIDATE ─────────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const errors: ValidationError[] = [];
    if (!formData.displayName?.trim()) errors.push({ section: 'personal', message: 'Full name is required' });
    if (!formData.primaryRole?.trim()) errors.push({ section: 'personal', message: 'Primary role is required' });
    if (!Array.isArray(formData.skills) || formData.skills.length === 0) errors.push({ section: 'personal', message: 'At least one skill is required' });
    if (isEditing && !formData.declarationAccepted) errors.push({ section: 'declaration', message: 'You must accept the declaration' });
    if (isEditing && formData.declarationAccepted && !formData.signature?.trim()) errors.push({ section: 'declaration', message: 'Digital signature is required' });

    // Username: only blocks save if the user actually typed something into a
    // changed/invalid/unavailable state. An empty username is always fine
    // (it's optional), and "unchanged" is always fine.
    if (usernameStatus === 'invalid') {
      errors.push({ section: 'personal', message: usernameMessage || 'Username is invalid' });
    } else if (usernameStatus === 'unavailable') {
      errors.push({ section: 'personal', message: usernameMessage || 'Username is not available' });
    } else if (usernameStatus === 'checking') {
      errors.push({ section: 'personal', message: 'Still checking username availability — please wait a moment' });
    }

    if (EXPERIENCE_LEVELS_REQUIRING_EXP.includes(formData.experienceLevel)) {
      const completedExp = (formData.experiences || []).filter((e: any) => isCardComplete('experiences', e));
      if (completedExp.length === 0) {
        errors.push({ section: 'experience', message: `At least one completed experience entry is required for "${formData.experienceLevel}" level` });
      }
    }

    setValidationErrors(errors);
    if (incompleteCards.size > 0) return false;
    return errors.length === 0;
  };

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (incompleteCards.size > 0) {
      toast.error("Complete or delete the highlighted section before saving.");
      const firstId = Array.from(incompleteCards.keys())[0];
      const el = document.querySelector(`[data-card-id="${firstId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const firstInput = el.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled])') as HTMLElement;
          firstInput?.focus();
        }, 400);
      }
      return;
    }

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      const firstErrorSection = validationErrors[0]?.section;
      if (firstErrorSection) {
        const element = document.querySelector(`[data-section="${firstErrorSection}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const currentUser = profile;
    if (!currentUser) { toast.error("User not authenticated"); return; }
    setLoading(true);
    try {
      const normalizedNewUsername = normalizeUsername(formData.username || '');
      const normalizedOldUsername = normalizeUsername(usernameAtEditStart || '');
      const usernameChanged = normalizedNewUsername !== normalizedOldUsername;

      // Claim/reserve the username FIRST — this is the step that can fail due
      // to a race with another user, and we want the whole save to feel
      // atomic from the user's perspective (don't save other fields if this fails).
      if (usernameChanged && normalizedNewUsername) {
        const result = normalizedOldUsername
          ? await changeUsername(currentUser.uid, normalizedOldUsername, normalizedNewUsername)
          : await claimUsername(currentUser.uid, normalizedNewUsername);

        if (!result.success) {
          toast.error(result.error || 'That username was just taken. Please choose another.');
          setUsernameStatus('unavailable');
          setUsernameMessage(result.error || 'That username was just taken. Please choose another.');
          setLoading(false);
          return;
        }
      }

      await setDoc(
        doc(db, 'users', currentUser.uid),
        { ...formData, username: normalizedNewUsername || '', uid: currentUser.uid, email: currentUser.email || '', updatedAt: new Date().toISOString() },
        { merge: true }
      );

      if (photoURLAtEditStart && isImageKitPhoto(photoURLAtEditStart)) {
        if (pendingPhotoRemoval || (formData.photoURL && formData.photoURL !== photoURLAtEditStart)) {
          deleteFromImageKit(photoURLAtEditStart).catch(() => {});
        }
      }

      toast.success("Profile updated successfully! 🎉");
      setIsEditing(false);
      setHasChanges(false);
      setInitialData(JSON.stringify({ ...formData, username: normalizedNewUsername || '' }));
      setValidationErrors([]);
      setTouchedCards(new Set());
      setPendingPhotoRemoval(false);
      setPhotoURLAtEditStart('');
      setUsernameAtEditStart(normalizedNewUsername || '');
      setUsernameStatus('idle');
      setUsernameMessage('');
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const addItem = (section: string, defaultObj: any) => {
    const newId = crypto.randomUUID();
    setFormData({ ...formData, [section]: [...formData[section], { ...defaultObj, id: newId }] });
    setTouchedCards(prev => new Set(prev).add(newId));
  };

  const removeItem = (section: string, id: string) => {
    setFormData({ ...formData, [section]: formData[section].filter((item: any) => item.id !== id) });
    setTouchedCards(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const updateItem = (section: string, id: string, field: string, value: any) => {
    setFormData({
      ...formData,
      [section]: formData[section].map((item: any) => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const toggleCollapse = (section: keyof typeof collapsed) => {
    setCollapsed({ ...collapsed, [section]: !collapsed[section] });
  };

  const completion = useMemo(() => getProfileCompletion(formData), [formData]);

  const hasCustomPhoto = useMemo(() => isImageKitPhoto(formData?.photoURL), [formData]);

  const locationLabel = useMemo(() => {
    if (!formData) return '';
    return [formData.city, formData.country].filter(Boolean).join(', ');
  }, [formData]);

  const otherLinksExist = useMemo(() => {
    if (!formData) return false;
    return !!(formData.artstationUrl || formData.youtubeUrl || formData.otherUrl);
  }, [formData]);

  const heroPhoto =
    formData?.photoURL ||
    profile?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      formData?.displayName || "U"
    )}&background=0052CC&color=fff&size=800`;

  const copyPublicProfileLink = async () => {
    const username = formData?.username || profile?.username;
    if (!username) return;
    const url = `https://${PUBLIC_PROFILE_BASE}/${username}`;
    try {
      await navigator.clipboard.writeText(url);
      setUsernameCopied(true);
      toast.success('Profile link copied!');
      setTimeout(() => setUsernameCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  // ===== Hero Title & Status =====

  // Current job
  const currentExperience = formData?.experiences?.find(
    (exp: any) => exp.current
  );

  // Latest previous job (if no current job)
  const latestExperience =
    formData?.experiences
      ?.filter((exp: any) => !exp.current)
      ?.sort((a: any, b: any) => {
        const aYear = Number(a.endYear || a.startYear || 0);
        const bYear = Number(b.endYear || b.startYear || 0);
        return bYear - aYear;
      })?.[0];

  // Current education
  const currentEducation = formData?.education?.find(
    (edu: any) => edu.current
  );

  // Highest completed education
  const highestEducation =
    formData?.education
      ?.filter((edu: any) => !edu.current)
      ?.sort((a: any, b: any) => Number(b.endYear || 0) - Number(a.endYear || 0))
      ?.[0];

  let heroTitle = formData?.primaryRole || "Your Role";
  let heroStatus = "Fresher";

  // 1. Currently working
  if (currentExperience) {
    heroTitle = currentExperience.role || heroTitle;
    heroStatus = "Working Professional";
  }

  // 2. Has previous experience
  else if (latestExperience) {
    heroTitle = latestExperience.role || heroTitle;
    heroStatus = "Experienced Professional";
  }

  // 3. Currently studying (no experience)
  else if (currentEducation) {
    heroTitle = currentEducation.degree
      ? `${currentEducation.degree} Student`
      : heroTitle;
    heroStatus = "Student";
  }

  // 4. Completed education (no experience)
  else if (highestEducation) {
    heroTitle = highestEducation.degree || heroTitle;
    heroStatus = "Fresher";
  }
  if (authLoading || !formData) return <ProfileLoadingScreen />;

  if (isAdmin) {
    return <AdminProfileView 
      formData={formData} setFormData={setFormData} 
      handleUpdateProfile={handleUpdateProfile} loading={loading}
      profile={profile} isEditing={isEditing} setIsEditing={setIsEditing}
    />;
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* ── CROP MODAL (lazy, only renders when a file is selected) ──────── */}
      <Suspense fallback={null}>
        {cropImageSrc && (
          <CropModal
            imageSrc={cropImageSrc}
            onCancel={() => {
              setCropImageSrc(null);
              cropUploadCallback.current = null;
            }}
            onCropComplete={async (blob: Blob) => {
              setCropImageSrc(null);
              if (cropUploadCallback.current) {
                await cropUploadCallback.current(blob);
              }
              cropUploadCallback.current = null;
            }}
          />
        )}
      </Suspense>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="pt-24 px-4 lg:px-8 max-w-7xl mx-auto overflow-x-hidden lg:overflow-x-visible">
        <div className="relative bg-white rounded-2xl lg:rounded-3xl overflow-hidden shadow-sm mb-6">

          <div
            className="pointer-events-none absolute -bottom-16 -right-16 w-[260px] h-[200px] lg:w-[420px] lg:h-[320px] rounded-full opacity-60"
            style={{
              background: 'radial-gradient(ellipse at 60% 60%, #c4b5f4 0%, #a78bfa 30%, #818cf8 60%, transparent 80%)',
              filter: 'blur(2px)',
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white to-indigo-50/40" />

          {/* Action buttons row — Edit Profile + Download Resume + View Public Profile (DESKTOP ONLY) */}
          {!isEditing && (
            <div className="hidden lg:flex absolute top-6 right-6 z-30 items-center gap-3">
              {/* Download Resume — lazy loaded, only renders when profile is loaded */}
              <Suspense fallback={null}>
                <DownloadDropdown
                  profileData={formData}
                  isProfileComplete={completion.isComplete}
                  hasCustomPhoto={hasCustomPhoto}
                />
              </Suspense>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  if (formData.username) {
                    window.open(`/${formData.username}`, '_blank', 'noopener,noreferrer');
                  } else {
                    scrollToUsernameField();
                  }
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold shadow-sm transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
              >
                <ExternalLink size={15} />
                View Public Profile
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  setPhotoURLAtEditStart(formData.photoURL || '');
                  setUsernameAtEditStart(formData.username || '');
                  setIsEditing(true);
                }}
                className="px-5 py-2.5 bg-white text-blue-600 rounded-2xl font-semibold shadow-sm border border-gray-200 hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
              >
                <PenLine size={15} />
                Edit Profile
              </motion.button>
            </div>
          )}

          {/* Validation errors */}
          <AnimatePresence>
            {validationErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-4 lg:mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 max-w-full"
              >
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-red-900 text-sm mb-1">Please complete required fields:</p>
                  <ul className="space-y-0.5">
                    {validationErrors.map((err, idx) => (
                      <li key={idx} className="text-xs text-red-700 break-words">{err.message}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero content */}
          <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-start px-4 sm:px-6 lg:px-8 py-8 lg:py-10 text-center lg:text-left">

            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              <div className="w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] lg:w-[220px] lg:h-[220px] overflow-hidden rounded-[20px] lg:rounded-[24px]">
                <img
                  src={heroPhoto}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  style={{ imageRendering: "auto" }}
                />  
              </div>
              {formData.openToWork && (
                <span className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
              )}
            </div>

            {/* Info column */}
            <div className="flex-1 min-w-0 w-full pt-0 lg:pt-2">

              <div className="flex items-center justify-center lg:justify-start gap-2 lg:gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl lg:text-[44px] leading-tight font-black text-gray-900 tracking-tight break-words max-w-full">
                  {formData.displayName || 'Your Name'}
                </h1>
                <BadgeCheck size={22} className="lg:w-[26px] lg:h-[26px] text-blue-500 fill-blue-100 flex-shrink-0" />
              </div>

              {/* Username / public profile link preview (read-only display) */}
              {!isEditing && (
                formData.username ? (
                  <button
                    type="button"
                    onClick={copyPublicProfileLink}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors group"
                    title="Copy your public profile link"
                  >
                    <AtSign size={13} className="text-gray-400 group-hover:text-blue-500" />
                    {formData.username}
                    {usernameCopied ? <Check size={13} className="text-green-500" /> : <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </button>
                ) : (
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap justify-center lg:justify-start">
                    <span className="text-sm text-gray-400 font-medium">No username selected</span>
                    <button
                      type="button"
                      onClick={scrollToUsernameField}
                      className="inline-flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg transition-colors"
                    >
                      <AtSign size={11} />
                      Choose Username
                    </button>
                  </div>
                )
              )}

              <div className="mt-2 flex flex-col items-center lg:items-start">
                <h2 className="text-lg lg:text-xl font-bold text-blue-600">
                  {heroTitle}
                </h2>

                <p className="text-base lg:text-lg font-semibold text-gray-500 mt-1">
                  {heroStatus}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-center lg:justify-start gap-x-3 lg:gap-x-0 gap-y-2 flex-wrap">
                {locationLabel && (
                  <>
                    <span className="flex items-center gap-1.5 text-gray-700 text-sm font-medium lg:pr-4">
                      <MapPin size={15} className="text-gray-400 flex-shrink-0" />
                      {locationLabel}
                    </span>
                    <span className="text-gray-300 lg:pr-4 hidden sm:inline">|</span>
                  </>
                )}
                <span className="flex items-center gap-1.5 text-gray-700 text-sm font-medium lg:pr-4">
                  <Briefcase size={15} className="text-gray-400 flex-shrink-0" />
                  {formData.experienceLevel || 'Fresher'}
                </span>
                <span className="text-gray-300 lg:pr-4 hidden sm:inline">|</span>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${formData.openToWork ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className={formData.openToWork ? 'text-gray-800 font-semibold' : 'text-gray-500'}>
                    {formData.openToWork ? 'Open to Work' : 'Not looking'}
                  </span>
                </span>
              </div>

              {isEditing && (
                <label className="mt-2 inline-flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.openToWork}
                    onChange={(e) => setFormData({ ...formData, openToWork: e.target.checked })}
                    className="w-4 h-4 rounded border-2 border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
                  />
                  I'm open to work
                </label>
              )}

              {/* Social links bar */}
              <div className="mt-6 w-full flex justify-center lg:justify-start">
                <div className="inline-flex items-stretch bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-full overflow-x-auto">
                  {[
                    { key: 'portfolioUrl', label: 'Portfolio', icon: <GlobeIcon />, href: formData.portfolioUrl },
                    { key: 'githubUrl', label: 'GitHub', icon: <GithubIcon />, href: formData.githubUrl },
                    { key: 'linkedinUrl', label: 'LinkedIn', icon: <LinkedinIcon />, href: formData.linkedinUrl },
                    { key: 'behanceUrl', label: 'Behance', icon: <BehanceIcon />, href: formData.behanceUrl },
                    ...(otherLinksExist || isEditing ? [{ key: 'more', label: 'More', icon: <ExternalLink size={20} className="text-gray-500" />, href: formData.otherUrl || formData.artstationUrl || formData.youtubeUrl || undefined }] : []),
                  ].map((item, idx, arr) => (
                    <React.Fragment key={item.key}>
                      <a
                        href={item.href || undefined}
                        target={item.href ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        onClick={(e) => { if (!item.href) e.preventDefault(); }}
                        className={`flex flex-col items-center justify-center gap-2 px-3 sm:px-5 lg:px-6 py-3 lg:py-4 min-w-[64px] sm:min-w-[80px] lg:min-w-[90px] flex-shrink-0 transition-colors group ${item.href ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default opacity-70'}`}
                      >
                        <span className="w-9 h-9 flex items-center justify-center rounded-full bg-white group-hover:scale-110 transition-transform">
                          {item.icon}
                        </span>
                        <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 whitespace-nowrap">{item.label}</span>
                      </a>
                      {idx < arr.length - 1 && (
                        <div className="w-px bg-gray-100 self-stretch my-3 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE ACTION BAR — Edit Profile + Download Resume + View Public Profile (mobile/tablet only) ── */}
        {!isEditing && (
          <div className="flex lg:hidden flex-wrap items-stretch gap-3 mb-6">
            <Suspense fallback={null}>
              <DownloadDropdown
                profileData={formData}
                isProfileComplete={completion.isComplete}
                hasCustomPhoto={hasCustomPhoto}
                fullWidth
              />
            </Suspense>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                setPhotoURLAtEditStart(formData.photoURL || '');
                setUsernameAtEditStart(formData.username || '');
                setIsEditing(true);
              }}
              className="flex-1 px-5 py-3 bg-white text-blue-600 rounded-2xl font-semibold shadow-sm border border-gray-200 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
            >
              <PenLine size={15} />
              Edit Profile
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                if (formData.username) {
                  window.open(`/${formData.username}`, '_blank', 'noopener,noreferrer');
                } else {
                  scrollToUsernameField();
                }
              }}
              className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
            >
              <ExternalLink size={15} />
              View Public Profile
            </motion.button>
          </div>
        )}

        {/* ── ABOUT ME + PROFILE COMPLETION ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 mb-5" ref={formRef}>

          {/* About Me */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            data-section="personal"
            className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-7"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <User size={18} className="text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">About Me</h2>
                  <div className="mt-0.5 w-8 h-[3px] rounded-full bg-blue-600" />
                </div>
              </div>
              <span className="text-blue-200 select-none" style={{ fontSize: 40, lineHeight: 1, fontFamily: 'Georgia, serif' }}>"</span>
            </div>

            <div className="mt-4">
              {isEditing ? (
                <EditableTextarea
                  isEditing={isEditing}
                  value={formData.bio}
                  onChange={(v: string) => setFormData({ ...formData, bio: v })}
                  placeholder="Write a professional summary..."
                  minHeight="min-h-[100px]"
                />
              ) : (
                <p className="text-gray-600 leading-7 text-[15px]">
                  {formData.bio || 'Tell recruiters about yourself...'}
                </p>
              )}
            </div>

            {!isEditing && (
              <div className="mt-5 flex flex-wrap gap-2">
                {(Array.isArray(formData.skills) ? formData.skills : []).map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-4 py-1.5 rounded-full bg-blue-50/60 text-blue-700 text-sm font-semibold border border-blue-100"
                  >
                    {skill}
                  </span>
                ))}
                {(!formData.skills || formData.skills.length === 0) && (
                  <span className="text-sm text-gray-400">No skills added yet</span>
                )}
              </div>
            )}

            {isEditing && (
              <>
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = skillInput.trim();
                        if (val && !(formData.skills || []).includes(val)) {
                          setFormData({ ...formData, skills: [...(formData.skills || []), val] });
                          setSkillInput('');
                        }
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                    placeholder="Type a skill and press Enter"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = skillInput.trim();
                      if (val && !(formData.skills || []).includes(val)) {
                        setFormData({ ...formData, skills: [...(formData.skills || []), val] });
                        setSkillInput('');
                      }
                    }}
                    className="bg-blue-600 text-white rounded-lg px-4 hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {(formData.skills || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(formData.skills || []).map((skill: string, idx: number) => (
                      <motion.span
                        key={idx}
                        layout
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 border border-blue-300 text-blue-700 text-sm font-semibold rounded-full"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => {
                            const newSkills = [...formData.skills];
                            newSkills.splice(idx, 1);
                            setFormData({ ...formData, skills: newSkills });
                          }}
                          className="hover:text-red-600 transition-colors ml-0.5"
                        >
                          <X size={13} />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Profile Completion */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-7 flex flex-col"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <BarChart2 size={18} className="text-purple-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Profile Completion</h2>
              </div>
              <span className="text-2xl font-black text-blue-600">{completion.percentage}%</span>
            </div>

            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completion.percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  completion.percentage >= 100 ? 'bg-green-500' :
                  completion.percentage >= 71 ? 'bg-blue-600' :
                  completion.percentage >= 41 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              />
            </div>

            {!completion.isComplete ? (
              <div className="flex-1 p-4 bg-blue-50/60 border border-blue-100 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Sparkles size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Add more details to complete your profile and increase your visibility.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isEditing) {
                          setPhotoURLAtEditStart(formData.photoURL || '');
                          setUsernameAtEditStart(formData.username || '');
                          setIsEditing(true);
                        }
                        const el = document.querySelector('[data-section="personal"]');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="mt-2 text-sm font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    >
                      Complete Now →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-green-900">Your profile is complete! Ready to apply.</p>
              </div>
            )}

            {completion.missing?.length > 0 && (
              <ul className="mt-4 space-y-1">
                {completion.missing.map((req: string, idx: number) => (
                  <li key={idx} className="text-xs text-gray-400">• {req}</li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>

        {/* ── STATS BAR ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 sm:px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          <StatPill icon={<BriefcaseStatIcon />} value={formData.experiences?.length || 0} label="Experience" />
          <StatPill icon={<LayersStatIcon />} value={formData.projects?.length || 0} label="Projects" />
          <StatPill icon={<GraduationCap size={20} className="text-green-600" />} iconBg="bg-green-50" value={formData.education?.length || 0} label="Education" />
          <StatPill icon={<ShieldCheck size={20} className="text-orange-500" />} iconBg="bg-orange-50" value={formData.certifications?.length || 0} label="Certifications" />
        </motion.div>

        {/* ── MAIN FORM SECTIONS ─────────────────────────────────────────── */}
        <div className="pb-12">
          <form onSubmit={handleUpdateProfile} className="space-y-6">

            {/* Personal Details — edit mode only */}
            {isEditing && (
              <ProfileSection
                title="Personal Details"
                icon={<User size={22} />}
                isCollapsed={collapsed.personal}
                onToggle={() => toggleCollapse('personal')}
                sectionId="personal-form"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Full Name *" required>
                    <EditableInput
                      isEditing={isEditing}
                      value={formData.displayName}
                      onChange={(v: string) => setFormData({ ...formData, displayName: v })}
                      placeholder="John Doe"
                      hasError={validationErrors.some(e => e.message.includes('Full name'))}
                    />
                  </InputGroup>
                  <InputGroup label="Email Address">
                    <input
                      disabled type="email" value={formData.email || profile?.email || ''} readOnly
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg text-sm"
                    />
                  </InputGroup>

                  {/* ── USERNAME (Public Profile) ──────────────────────────── */}
                  <div className="md:col-span-2">
                    <InputGroup label="Username (Public Profile)">
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          <AtSign size={15} />
                        </span>
                        <input
                          id="username-input"
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                          placeholder="your.username_123"
                          maxLength={30}
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          className={`w-full pl-10 pr-10 py-2.5 rounded-lg text-sm transition-all bg-white border focus:outline-none ${
                            usernameStatus === 'available' ? 'border-green-400 focus:border-green-500' :
                            usernameStatus === 'unavailable' || usernameStatus === 'invalid' ? 'border-red-400 focus:border-red-500' :
                            'border-gray-300 focus:border-blue-600 hover:border-gray-400'
                          }`}
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                          {usernameStatus === 'checking' && <Loader2 size={15} className="text-gray-400 animate-spin" />}
                          {usernameStatus === 'available' && <CheckCircle2 size={15} className="text-green-500" />}
                          {(usernameStatus === 'unavailable' || usernameStatus === 'invalid') && <AlertCircle size={15} className="text-red-500" />}
                          {usernameStatus === 'unchanged' && <CheckCircle2 size={15} className="text-blue-400" />}
                        </span>
                      </div>

                      {usernameMessage && (
                        <p className={`mt-1.5 text-xs font-semibold flex items-center gap-1 ${
                          usernameStatus === 'available' || usernameStatus === 'unchanged' ? 'text-green-600' :
                          usernameStatus === 'checking' ? 'text-gray-400' :
                          'text-red-500'
                        }`}>
                          {usernameMessage}
                        </p>
                      )}
                      {!usernameMessage && (
                        <p className="mt-1.5 text-[11px] text-gray-400">
                          3–30 characters. Lowercase letters, numbers, underscores (_) and periods (.) only. This becomes your public profile link: {PUBLIC_PROFILE_BASE}/{formData.username || 'your-username'}
                        </p>
                      )}
                    </InputGroup>
                  </div>

                  <InputGroup label="Profile Photo">
                    <PhotoUpload
                      currentPhotoURL={formData.photoURL}
                      googlePhotoURL={profile?.photoURL}
                      displayName={formData.displayName}
                      uid={profile?.uid}
                      pendingRemoval={pendingPhotoRemoval}
                      onSelectFile={(src: string, uploadFn: (blob: Blob) => Promise<void>) => {
                        // Open crop modal instead of uploading directly
                        cropUploadCallback.current = uploadFn;
                        setCropImageSrc(src);
                      }}
                      onUploadComplete={(url: string) => {
                        setFormData({ ...formData, photoURL: url });
                        setPendingPhotoRemoval(false);
                      }}
                      onRemove={() => {
                        setFormData({ ...formData, photoURL: '' });
                        setPendingPhotoRemoval(true);
                      }}
                    />
                  </InputGroup>
                  <InputGroup label="Phone Number">
                    <EditableInput isEditing={isEditing} value={formData.phone} onChange={(v: string) => setFormData({ ...formData, phone: v })} placeholder="+91 000 000 0000" />
                  </InputGroup>
                  <InputGroup label="Country">
                    <EditableInput isEditing={isEditing} value={formData.country} onChange={(v: string) => setFormData({ ...formData, country: v })} placeholder="India" />
                  </InputGroup>
                  <InputGroup label="State / Province">
                    <EditableInput isEditing={isEditing} value={formData.state} onChange={(v: string) => setFormData({ ...formData, state: v })} placeholder="Tamil Nadu" />
                  </InputGroup>
                  <InputGroup label="City">
                    <EditableInput isEditing={isEditing} value={formData.city} onChange={(v: string) => setFormData({ ...formData, city: v })} placeholder="Chennai" />
                  </InputGroup>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Primary Role *" required>
                    <EditableInput
                      isEditing={isEditing} value={formData.primaryRole}
                      onChange={(v: string) => setFormData({ ...formData, primaryRole: v })}
                      placeholder="Frontend Developer"
                      hasError={validationErrors.some(e => e.message.includes('Primary role'))}
                    />
                  </InputGroup>
                  <InputGroup label="Secondary Role">
                    <EditableInput isEditing={isEditing} value={formData.secondaryRole} onChange={(v: string) => setFormData({ ...formData, secondaryRole: v })} placeholder="Product Designer" />
                  </InputGroup>
                  <InputGroup label="Experience Level">
                    <select
                      disabled={!isEditing} value={formData.experienceLevel}
                      onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="Fresher">Fresher</option>
                      <option value="1–2 Years">1–2 Years</option>
                      <option value="2–5 Years">2–5 Years</option>
                      <option value="5–10 Years">5–10 Years</option>
                      <option value="10+ Years">10+ Years</option>
                    </select>
                  </InputGroup>
                </div>
              </ProfileSection>
            )}

            {/* Profiles & Links — edit mode only */}
            {isEditing && (
              <ProfileSection
                title="Profiles & Links" icon={<LinkIcon size={22} />}
                isCollapsed={collapsed.links} onToggle={() => toggleCollapse('links')} sectionId="links"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SocialInput isEditing={isEditing} icon={<Globe size={16} />} placeholder="Portfolio Website" value={formData.portfolioUrl} onChange={(v: any) => setFormData({ ...formData, portfolioUrl: v })} />
                  <SocialInput isEditing={isEditing} icon={<Github size={16} />} placeholder="GitHub Profile" value={formData.githubUrl} onChange={(v: any) => setFormData({ ...formData, githubUrl: v })} />
                  <SocialInput isEditing={isEditing} icon={<Linkedin size={16} />} placeholder="LinkedIn Profile" value={formData.linkedinUrl} onChange={(v: any) => setFormData({ ...formData, linkedinUrl: v })} />
                  <SocialInput isEditing={isEditing} icon={<Layers size={16} />} placeholder="Behance" value={formData.behanceUrl} onChange={(v: any) => setFormData({ ...formData, behanceUrl: v })} />
                  <SocialInput isEditing={isEditing} icon={<Globe size={16} />} placeholder="ArtStation" value={formData.artstationUrl} onChange={(v: any) => setFormData({ ...formData, artstationUrl: v })} />
                  <SocialInput isEditing={isEditing} icon={<Globe size={16} />} placeholder="YouTube" value={formData.youtubeUrl} onChange={(v: any) => setFormData({ ...formData, youtubeUrl: v })} />
                  <SocialInput isEditing={isEditing} icon={<ExternalLink size={16} />} placeholder="Other Link" value={formData.otherUrl} onChange={(v: any) => setFormData({ ...formData, otherUrl: v })} />
                </div>
              </ProfileSection>
            )}

            {/* Experience */}
            {(isEditing || formData.experiences?.length > 0) && (
              <ModularSection
                title="Experience" icon={<Briefcase size={22} />}
                items={formData.experiences} isCollapsed={collapsed.experience}
                onToggle={() => toggleCollapse('experience')}
                onAdd={() => addItem('experiences', { role: '', company: '', type: 'Full-time', startMonth: '', startYear: '', endMonth: '', endYear: '', current: false, location: '', mode: 'Onsite', skills: '', description: '' })}
                itemRenderer={(exp: any) => (
                  <ExperienceItem
                    isEditing={isEditing} key={exp.id} exp={exp}
                    isIncomplete={incompleteCards.has(exp.id)}
                    missingFields={incompleteCards.get(exp.id)?.missing || []}
                    onUpdate={(f: any, v: any) => updateItem('experiences', exp.id, f, v)}
                    onDelete={() => removeItem('experiences', exp.id)}
                  />
                )}
                addButtonText="Add Experience" isEditing={isEditing}
                sectionNote={
                  EXPERIENCE_LEVELS_REQUIRING_EXP.includes(formData.experienceLevel) && isEditing
                    ? `Required for "${formData.experienceLevel}" level`
                    : undefined
                }
              />
            )}

            {/* Projects */}
            {(isEditing || formData.projects?.length > 0) && (
              <ModularSection
                title="Projects" icon={<Layers size={22} />}
                items={formData.projects} isCollapsed={collapsed.projects}
                onToggle={() => toggleCollapse('projects')}
                onAdd={() => addItem('projects', { title: '', category: '', description: '', skills: '', technologies: '', startMonth: '', startYear: '', endMonth: '', endYear: '', status: 'Completed', demoUrl: '', githubUrl: '' })}
                itemRenderer={(proj: any) => (
                  <ProjectItem
                    isEditing={isEditing} key={proj.id} proj={proj}
                    isIncomplete={incompleteCards.has(proj.id)}
                    missingFields={incompleteCards.get(proj.id)?.missing || []}
                    onUpdate={(f: any, v: any) => updateItem('projects', proj.id, f, v)}
                    onDelete={() => removeItem('projects', proj.id)}
                  />
                )}
                addButtonText="Add Project" isEditing={isEditing}
              />
            )}

            {/* Education */}
            {(isEditing || formData.education?.length > 0) && (
              <ModularSection
                title="Education" icon={<BookOpen size={22} />}
                items={formData.education} isCollapsed={collapsed.education}
                onToggle={() => toggleCollapse('education')}
                onAdd={() => addItem('education', { institution: '', degree: '', department: '', startYear: '', endYear: '', current: false })}
                itemRenderer={(edu: any) => (
                  <EducationItem
                    isEditing={isEditing} key={edu.id} edu={edu}
                    isIncomplete={incompleteCards.has(edu.id)}
                    missingFields={incompleteCards.get(edu.id)?.missing || []}
                    onUpdate={(f: any, v: any) => updateItem('education', edu.id, f, v)}
                    onDelete={() => removeItem('education', edu.id)}
                  />
                )}
                addButtonText="Add Education" isEditing={isEditing}
              />
            )}

            {/* Certifications */}
            {(isEditing || formData.certifications?.length > 0) && (
              <ModularSection
                title="Certifications" icon={<Award size={22} />}
                items={formData.certifications} isCollapsed={collapsed.certifications}
                onToggle={() => toggleCollapse('certifications')}
                onAdd={() => addItem('certifications', { name: '', org: '', issueMonth: '', issueYear: '', url: '' })}
                itemRenderer={(cert: any) => (
                  <CertificationItem
                    isEditing={isEditing} key={cert.id} cert={cert}
                    isIncomplete={incompleteCards.has(cert.id)}
                    missingFields={incompleteCards.get(cert.id)?.missing || []}
                    onUpdate={(f: any, v: any) => updateItem('certifications', cert.id, f, v)}
                    onDelete={() => removeItem('certifications', cert.id)}
                  />
                )}
                addButtonText="Add Certification" isEditing={isEditing}
              />
            )}

            {/* Publications */}
            {(isEditing || formData.publications?.length > 0) && (
              <ModularSection
                title="Publications" icon={<BookMarked size={22} />}
                items={formData.publications} isCollapsed={collapsed.publications}
                onToggle={() => toggleCollapse('publications')}
                onAdd={() => addItem('publications', { title: '', publisher: '', dateMonth: '', dateYear: '', url: '' })}
                itemRenderer={(pub: any) => (
                  <PublicationItem
                    isEditing={isEditing} key={pub.id} pub={pub}
                    isIncomplete={incompleteCards.has(pub.id)}
                    missingFields={incompleteCards.get(pub.id)?.missing || []}
                    onUpdate={(f: any, v: any) => updateItem('publications', pub.id, f, v)}
                    onDelete={() => removeItem('publications', pub.id)}
                  />
                )}
                addButtonText="Add Publication" isEditing={isEditing}
              />
            )}

            {/* Declaration */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                data-section="declaration"
                className="p-5 lg:p-7 bg-white rounded-2xl border border-gray-100 shadow-sm"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-blue-600" />
                  Declaration & Consent
                </h2>
                <label className="flex items-start gap-4 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.declarationAccepted}
                    onChange={(e) => setFormData({ ...formData, declarationAccepted: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors">
                    I confirm that the information provided is accurate and can be used for internship applications, job hiring evaluation, course enrollments, and professional communication purposes. *
                  </span>
                </label>
                {formData.declarationAccepted && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pt-5 mt-5 border-t border-gray-100">
                    <InputGroup label="Digital Signature (Type Full Name) *" required>
                      <input
                        type="text" value={formData.signature}
                        onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                        className={`w-full lg:w-1/2 px-4 py-2.5 rounded-lg text-sm font-serif italic focus:outline-none transition-all ${
                          validationErrors.some(e => e.message.includes('signature'))
                            ? 'border-2 border-red-500' : 'border-2 border-gray-300 focus:border-blue-600'
                        }`}
                        placeholder="Your Full Name"
                      />
                    </InputGroup>
                  </motion.div>
                )}
              </motion.div>
            )}

            <div className="h-20" />
          </form>
        </div>
      </div>

      {/* ── FLOATING ACTION BAR ──────────────────────────────────────────── */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-4 right-4 lg:bottom-6 lg:left-auto lg:right-6 flex gap-3 z-50 lg:max-w-xs"
          >
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                setFormData(JSON.parse(initialData));
                setHasChanges(false);
                setIsEditing(false);
                setValidationErrors([]);
                setTouchedCards(new Set());
                setPendingPhotoRemoval(false);
                setPhotoURLAtEditStart('');
                setUsernameAtEditStart('');
                setUsernameStatus('idle');
                setUsernameMessage('');
              }}
              className="flex-1 px-5 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="button" disabled={loading || usernameStatus === 'checking'} onClick={handleUpdateProfile}
              className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Save size={16} /> Save</>
              }
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-32 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-40"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── PROFILE LOADING SCREEN ───────────────────────────────────────────────────

function ProfileLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f5f6fa] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 px-6 sm:px-10 py-10 flex flex-col items-center w-full max-w-[340px]"
      >
        <div className="relative mb-7">
          <motion.div
            animate={{ scale: [1, 1.18, 1], opacity: [0.25, 0, 0.25] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-blue-400"
          />
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-md"
          >
            <User size={28} className="text-white" strokeWidth={2.2} />
          </motion.div>
        </div>
        <h2 className="text-base font-bold text-gray-900 mb-1">Loading your profile</h2>
        <p className="text-sm text-gray-400 mb-6">Just a moment...</p>
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mt-6 w-full max-w-4xl px-4"
      >
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8 flex flex-col sm:flex-row gap-5 sm:gap-8 items-center sm:items-start overflow-hidden">
          <div className="w-[110px] h-[110px] sm:w-[160px] sm:h-[160px] rounded-2xl sm:rounded-[20px] bg-gray-100 flex-shrink-0 relative overflow-hidden">
            <SkeletonShimmer />
          </div>
          <div className="flex-1 w-full pt-0 sm:pt-2 space-y-3">
            <div className="h-9 w-full max-w-56 mx-auto sm:mx-0 bg-gray-100 rounded-xl relative overflow-hidden"><SkeletonShimmer /></div>
            <div className="h-5 w-36 max-w-full mx-auto sm:mx-0 bg-gray-100 rounded-lg relative overflow-hidden"><SkeletonShimmer /></div>
            <div className="h-4 w-48 max-w-full mx-auto sm:mx-0 bg-gray-100 rounded-lg relative overflow-hidden mt-4"><SkeletonShimmer /></div>
            <div className="mt-5 flex gap-2 justify-center sm:justify-start flex-wrap">
              {[80, 64, 96, 72].map((w, i) => (
                <div key={i} style={{ width: w }} className="h-9 bg-gray-100 rounded-xl relative overflow-hidden">
                  <SkeletonShimmer />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SkeletonShimmer() {
  return (
    <motion.div
      animate={{ x: ['-100%', '100%'] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent"
    />
  );
}

// ── PHOTO UPLOAD (ImageKit + Crop) ────────────────────────────────────────────

const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const IMAGEKIT_FOLDER = 'profile-photos';

interface PhotoUploadProps {
  currentPhotoURL: string;
  googlePhotoURL?: string;
  displayName: string;
  uid?: string;
  pendingRemoval?: boolean;
  /** 
   * Called when a file is selected and validated.
   * Instead of uploading directly, we surface the raw image src
   * and an upload function so the parent can show the crop modal first.
   */
  onSelectFile: (imageSrc: string, uploadFn: (blob: Blob) => Promise<void>) => void;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
}

function PhotoUpload({
  currentPhotoURL,
  googlePhotoURL,
  displayName,
  uid,
  pendingRemoval,
  onSelectFile,
  onUploadComplete,
  onRemove,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCustomPhoto = isImageKitPhoto(currentPhotoURL) && !pendingRemoval;

  const displaySrc =
    currentPhotoURL
      ? `${currentPhotoURL}${currentPhotoURL.includes('?') ? '&' : '?'}tr=w-800,h-800,c-at_max,q-100,f-auto`
      : googlePhotoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'U')}&background=0052CC&color=fff&size=300`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_SIZE_MB}MB.`);
      return;
    }
    if (!uid) {
      toast.error('User not authenticated.');
      return;
    }

    // Create object URL for the crop modal
    const objectUrl = URL.createObjectURL(file);

    // Upload function that will be called AFTER cropping
    const uploadCroppedBlob = async (blob: Blob) => {
      setUploading(true);
      setProgress(0);
      try {
        const fileName = `${uid}-${Date.now()}`;
        const result = await uploadToImageKit(blob, fileName, IMAGEKIT_FOLDER, (pct) =>
          setProgress(pct)
        );
        onUploadComplete(result.url);
        toast.success('Photo updated!');
      } catch (err) {
        console.error(err);
        toast.error('Upload failed. Your existing photo is still active.');
      } finally {
        setUploading(false);
        setProgress(0);
        URL.revokeObjectURL(objectUrl);
      }
    };

    // Pass to parent to open crop modal
    onSelectFile(objectUrl, uploadCroppedBlob);
  };

  return (
    <div className="flex items-center gap-5">
      {/* Preview */}
      <div className="relative flex-shrink-0">
        <div className="w-[72px] h-[72px] rounded-[16px] overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-sm">
          {uploading ? (
            <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center gap-1">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full"
              />
              <span className="text-[9px] font-bold text-blue-500">{progress}%</span>
            </div>
          ) : (
            <img
              src={displaySrc}
              alt="Profile"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'U')}&background=0052CC&color=fff&size=120`;
              }}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
        {uploading && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="34" fill="none" stroke="#e0e7ff" strokeWidth="3" />
            <motion.circle
              cx="36" cy="36" r="34"
              fill="none" stroke="#2563eb" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          <Camera size={14} />
          {uploading ? `Uploading ${progress}%...` : 'Change Photo'}
        </motion.button>

        {hasCustomPhoto && !uploading && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRemove}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            <ImageOff size={14} />
            Remove Photo
          </motion.button>
        )}

        <p className="text-[10px] text-gray-400 leading-tight">
          JPG, PNG, WEBP · Max {MAX_SIZE_MB}MB · Crops to circle
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// ── SOCIAL ICON SVGS ──────────────────────────────────────────────────────────

function GlobeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#3B82F6" strokeWidth="1.8"/>
      <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#3B82F6" strokeWidth="1.8"/>
      <line x1="2" y1="12" x2="22" y2="12" stroke="#3B82F6" strokeWidth="1.8"/>
      <line x1="12" y1="2" x2="12" y2="22" stroke="#3B82F6" strokeWidth="1.8"/>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#1a1a1a" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#0A66C2" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function BehanceIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#1769FF" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.938 4.503c.702 0 1.34.06 1.92.188.577.13 1.07.33 1.485.61.41.28.733.65.96 1.12.225.47.34 1.05.34 1.73 0 .74-.17 1.36-.507 1.86-.338.5-.837.9-1.502 1.22.906.26 1.576.72 2.022 1.37.448.66.673 1.45.673 2.37 0 .75-.13 1.4-.41 1.96-.28.56-.67 1.03-1.16 1.4-.49.38-1.064.66-1.72.84-.655.18-1.356.27-2.1.27H0V4.503h6.938zm-.43 5.477c.585 0 1.064-.14 1.44-.42.376-.28.563-.73.563-1.34 0-.34-.06-.62-.18-.845-.12-.225-.29-.4-.5-.53-.21-.13-.45-.215-.72-.255-.27-.04-.555-.06-.854-.06H3.204v3.45h3.304zm.195 5.718c.325 0 .63-.03.913-.09.284-.06.535-.16.75-.3.217-.14.39-.33.517-.57.127-.24.19-.54.19-.91 0-.73-.206-1.25-.617-1.56-.41-.31-.955-.47-1.636-.47H3.204v3.9h3.5zm8.27-7.476c.374-.41.836-.735 1.383-.975.547-.24 1.14-.36 1.778-.36.677 0 1.29.13 1.83.38.54.25.995.6 1.364 1.06.37.46.648 1.01.834 1.66.186.65.28 1.36.28 2.13v.56H14.87c.052.87.32 1.546.81 2.03.488.484 1.14.726 1.953.726.647 0 1.197-.16 1.65-.49.454-.33.74-.68.855-1.06h2.97c-.455 1.42-1.15 2.44-2.09 3.06-.94.62-2.08.93-3.42.93-.927 0-1.764-.15-2.508-.45-.744-.3-1.375-.72-1.894-1.27-.518-.55-.913-1.2-1.187-1.95-.273-.75-.41-1.58-.41-2.49 0-.87.14-1.68.42-2.43.28-.75.68-1.39 1.2-1.92l-.003-.02zm5.54 1.6c-.41-.45-.995-.675-1.756-.675-.5 0-.913.093-1.24.277-.327.186-.59.41-.79.674-.2.265-.34.548-.42.847-.08.3-.127.585-.14.86h5.09c-.12-.83-.334-1.534-.744-1.983zm-4.85-4.523h5.6v1.494h-5.6V5.3z"/>
    </svg>
  );
}

// ── STAT PILL ────────────────────────────────────────────────────────────────

function BriefcaseStatIcon() { return <Briefcase size={20} className="text-purple-500" />; }
function LayersStatIcon() { return <Layers size={20} className="text-blue-500" />; }

function StatPill({ icon, iconBg, value, label }: { icon: React.ReactNode; iconBg?: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg || 'bg-purple-50'}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-lg sm:text-xl font-black text-gray-900 leading-none">{value}</p>
        <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

// ── ADMIN VIEW ───────────────────────────────────────────────────────────────

function AdminProfileView({ formData, setFormData, handleUpdateProfile, loading, profile, isEditing, setIsEditing }: any) {
  return (
    <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full p-6 sm:p-10 bg-white rounded-2xl border border-gray-100 shadow-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-100 mb-6 shadow-md flex-shrink-0">
            <img
              src={profile?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName || 'A')}&background=0052CC&color=fff&size=160`}
              alt="" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=A&background=0052CC&color=fff&size=160'; }}
              className="w-full h-full object-cover" referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center break-words max-w-full">{formData.displayName}</h2>
          <div className="px-4 py-2 mt-3 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">Administrator</div>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <InputGroup label="Full Name">
            <input disabled={!isEditing} value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-lg text-sm ${isEditing ? 'bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600' : 'bg-gray-50 border border-gray-200 text-gray-600'}`} />
          </InputGroup>
          <InputGroup label="Bio">
            <textarea disabled={!isEditing} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-lg text-sm min-h-[100px] ${isEditing ? 'bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600' : 'bg-gray-50 border border-gray-200 text-gray-600'}`}
              placeholder="Brief overview..." />
          </InputGroup>
          <div className="flex gap-3 pt-2">
            {!isEditing ? (
              <button type="button" onClick={() => setIsEditing(true)} className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-blue-700 transition-colors">Edit</button>
            ) : (
              <>
                <button type="button" onClick={() => setIsEditing(false)} className="w-full border-2 border-gray-300 text-gray-700 rounded-xl py-2.5 text-sm font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="w-full bg-green-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                  {loading ? 'Saving...' : <><Save size={16} /> Save</>}
                </button>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── SECTION WRAPPERS ─────────────────────────────────────────────────────────

function ProfileSection({ title, icon, children, isCollapsed, onToggle, sectionId }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      data-section={sectionId}
      className="p-4 sm:p-5 lg:p-7 bg-white border border-gray-100 rounded-2xl shadow-sm max-w-full overflow-hidden"
    >
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between gap-3 mb-6 group">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">{icon}</div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate text-left">{title}</h2>
        </div>
        <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.25 }} className="text-gray-400 flex-shrink-0">
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-full">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ModularSection({ title, icon, items = [], isCollapsed, onToggle, onAdd, itemRenderer, addButtonText, isEditing, sectionNote }: any) {
  const dataItems = Array.isArray(items) ? items : [];
  return (
    <ProfileSection title={title} icon={icon} isCollapsed={isCollapsed} onToggle={onToggle}>
      {sectionNote && (
        <p className="mb-4 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle size={14} />
          {sectionNote}
        </p>
      )}
      <div className="space-y-5">
        <AnimatePresence>{dataItems.map((item: any) => itemRenderer(item))}</AnimatePresence>
        {isEditing && (
          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            type="button" onClick={onAdd}
            className="w-full py-4 border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-all font-semibold text-sm group"
          >
            <Plus size={18} className="group-hover:text-blue-600" />
            {addButtonText}
          </motion.button>
        )}
      </div>
    </ProfileSection>
  );
}

// ── INCOMPLETE CARD BANNER ────────────────────────────────────────────────────

function IncompleteCardBanner({ missingFields, onDelete }: { missingFields: string[]; onDelete: () => void }) {
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex flex-col sm:flex-row items-start sm:justify-between gap-3 max-w-full">
      <div className="flex items-start gap-2 min-w-0">
        <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-red-700 break-words">This section is incomplete. Complete all required fields or delete this card.</p>
          {missingFields.length > 0 && (
            <p className="text-xs text-red-500 mt-0.5 break-words">Missing: {missingFields.join(', ')}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-lg transition-colors"
      >
        <Trash2 size={12} />
        Delete
      </button>
    </div>
  );
}

// ── ITEM COMPONENTS ───────────────────────────────────────────────────────────

function ExperienceItem({ exp, onUpdate, onDelete, isEditing, isIncomplete, missingFields }: any) {
  return (
    <motion.div
      layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      data-card-id={exp.id}
      className={`p-4 sm:p-5 lg:p-6 rounded-xl relative group transition-all max-w-full overflow-hidden ${
        isIncomplete && isEditing
          ? 'bg-red-50/40 border-2 border-red-300'
          : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
      }`}
    >
      {isEditing && isIncomplete && (
        <IncompleteCardBanner missingFields={missingFields} onDelete={onDelete} />
      )}
      {isEditing && !isIncomplete && (
        <motion.button whileHover={{ scale: 1.2 }} type="button" onClick={onDelete}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5">
          <Trash2 size={16} />
        </motion.button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Role / Position">
          <EditableInput isEditing={isEditing} value={exp.role} onChange={(e: any) => onUpdate('role', e)} placeholder="Software Engineer"
            hasError={isIncomplete && !exp.role?.trim()} />
        </InputGroup>
        <InputGroup label="Company / Organization">
          <EditableInput isEditing={isEditing} value={exp.company} onChange={(e: any) => onUpdate('company', e)} placeholder="Company Name"
            hasError={isIncomplete && !exp.company?.trim()} />
        </InputGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <InputGroup label="Type">
          <select disabled={!isEditing} value={exp.type} onChange={(e) => onUpdate('type', e.target.value)}
            className={`w-full px-4 py-2.5 rounded-lg text-sm ${isEditing ? 'bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
            {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </InputGroup>
        <InputGroup label="Location">
          <EditableInput isEditing={isEditing} value={exp.location} onChange={(e: any) => onUpdate('location', e)} placeholder="City, Country" />
        </InputGroup>
        <InputGroup label="Mode">
          <select disabled={!isEditing} value={exp.mode} onChange={(e) => onUpdate('mode', e.target.value)}
            className={`w-full px-4 py-2.5 rounded-lg text-sm ${isEditing ? 'bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600' : 'bg-gray-100 border border-gray-200 text-gray-200'}`}>
            {WORK_MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </InputGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Start Date">
          <div className="flex gap-2">
            <select disabled={!isEditing} value={exp.startMonth || ''} onChange={(e) => onUpdate('startMonth', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm ${isEditing ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select disabled={!isEditing} value={exp.startYear || ''} onChange={(e) => onUpdate('startYear', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm ${isEditing && !exp.startYear ? 'bg-white border-2 border-red-300 text-gray-900' : isEditing ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
        <InputGroup label="End Date">
          <div className="flex gap-2">
            <select disabled={!isEditing || exp.current} value={exp.endMonth || ''} onChange={(e) => onUpdate('endMonth', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm ${isEditing && !exp.current ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-500 opacity-60'}`}>
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select disabled={!isEditing || exp.current} value={exp.endYear || ''} onChange={(e) => onUpdate('endYear', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm ${isEditing && !exp.current ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-500 opacity-60'}`}>
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {isEditing && (
            <label className="mt-2 flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input type="checkbox" checked={exp.current} onChange={(e) => onUpdate('current', e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
              I currently work here
            </label>
          )}
        </InputGroup>
      </div>
      <div className="mb-5">
        <InputGroup label="Skills Used">
          <EditableInput isEditing={isEditing} value={exp.skills} onChange={(e: any) => onUpdate('skills', e)} placeholder="React, Node.js, TypeScript" />
        </InputGroup>
      </div>
      <InputGroup label="Description">
        <EditableTextarea isEditing={isEditing} value={exp.description} onChange={(e: any) => onUpdate('description', e)} placeholder="Responsibilities and achievements..." minHeight="min-h-[90px]" />
      </InputGroup>
    </motion.div>
  );
}

function ProjectItem({ proj, onUpdate, onDelete, isEditing, isIncomplete, missingFields }: any) {
  return (
    <motion.div
      layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      data-card-id={proj.id}
      className={`p-4 sm:p-5 lg:p-6 rounded-xl relative group transition-all max-w-full overflow-hidden ${
        isIncomplete && isEditing
          ? 'bg-red-50/40 border-2 border-red-300'
          : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
      }`}
    >
      {isEditing && isIncomplete && (
        <IncompleteCardBanner missingFields={missingFields} onDelete={onDelete} />
      )}
      {isEditing && !isIncomplete && (
        <motion.button whileHover={{ scale: 1.2 }} type="button" onClick={onDelete}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5">
          <Trash2 size={16} />
        </motion.button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Project Title">
          <EditableInput isEditing={isEditing} value={proj.title} onChange={(e: any) => onUpdate('title', e)} placeholder="Project Name"
            hasError={isIncomplete && !proj.title?.trim()} />
        </InputGroup>
        <InputGroup label="Category">
          <EditableInput isEditing={isEditing} value={proj.category} onChange={(e: any) => onUpdate('category', e)} placeholder="Web App, Mobile App" />
        </InputGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Start Date">
          <div className="flex gap-2">
            <select disabled={!isEditing} value={proj.startMonth || ''} onChange={(e) => onUpdate('startMonth', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm ${isEditing ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
              <option value="">Month</option>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select disabled={!isEditing} value={proj.startYear || ''} onChange={(e) => onUpdate('startYear', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm ${isEditing ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
              <option value="">Year</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
        <InputGroup label="End Date">
          <div className="flex gap-2">
            <select disabled={!isEditing} value={proj.endMonth || ''} onChange={(e) => onUpdate('endMonth', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm ${isEditing ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
              <option value="">Month</option>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select disabled={!isEditing} value={proj.endYear || ''} onChange={(e) => onUpdate('endYear', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm ${isEditing ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
              <option value="">Year</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Status">
          <select disabled={!isEditing} value={proj.status} onChange={(e) => onUpdate('status', e.target.value)}
            className={`w-full px-4 py-2.5 rounded-lg text-sm ${isEditing ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
            {PROJECT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </InputGroup>
        <InputGroup label="Technologies">
          <EditableInput isEditing={isEditing} value={proj.technologies} onChange={(e: any) => onUpdate('technologies', e)} placeholder="React, Node, MongoDB" />
        </InputGroup>
      </div>
      <InputGroup label="Description">
        <EditableTextarea isEditing={isEditing} value={proj.description} onChange={(e: any) => onUpdate('description', e)} placeholder="Project summary..." minHeight="min-h-[90px]"
          hasError={isIncomplete && !proj.description?.trim()} />
      </InputGroup>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        <SocialInput isEditing={isEditing} icon={<Github size={15} />} placeholder="Repository Link" value={proj.githubUrl} onChange={(v: any) => onUpdate('githubUrl', v)} />
        <SocialInput isEditing={isEditing} icon={<Globe size={15} />} placeholder="Demo URL" value={proj.demoUrl} onChange={(v: any) => onUpdate('demoUrl', v)} />
      </div>
    </motion.div>
  );
}

function EducationItem({ edu, onUpdate, onDelete, isEditing, isIncomplete, missingFields }: any) {
  return (
    <motion.div
      layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      data-card-id={edu.id}
      className={`p-4 sm:p-5 lg:p-6 rounded-xl relative group transition-all max-w-full overflow-hidden ${
        isIncomplete && isEditing
          ? 'bg-red-50/40 border-2 border-red-300'
          : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
      }`}
    >
      {isEditing && isIncomplete && (
        <IncompleteCardBanner missingFields={missingFields} onDelete={onDelete} />
      )}
      {isEditing && !isIncomplete && (
        <motion.button whileHover={{ scale: 1.2 }} type="button" onClick={onDelete}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5">
          <Trash2 size={16} />
        </motion.button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Institution Name">
          <EditableInput isEditing={isEditing} value={edu.institution} onChange={(e: any) => onUpdate('institution', e)} placeholder="University Name"
            hasError={isIncomplete && !edu.institution?.trim()} />
        </InputGroup>
        <InputGroup label="Degree / Course">
          <EditableInput isEditing={isEditing} value={edu.degree} onChange={(e: any) => onUpdate('degree', e)} placeholder="Bachelor of Science"
            hasError={isIncomplete && !edu.degree?.trim()} />
        </InputGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <InputGroup label="Department / Major">
          <EditableInput isEditing={isEditing} value={edu.department} onChange={(e: any) => onUpdate('department', e)} placeholder="Computer Science" />
        </InputGroup>
        <InputGroup label="Start Year">
          <select disabled={!isEditing} value={edu.startYear || ''} onChange={(e) => onUpdate('startYear', e.target.value)}
            className={`w-full px-4 py-2.5 rounded-lg text-sm ${isIncomplete && !edu.startYear ? 'border-2 border-red-300 bg-white' : isEditing ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
            <option value="">Year</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </InputGroup>
        <InputGroup label="End Year">
          <select disabled={!isEditing || edu.current} value={edu.endYear || ''} onChange={(e) => onUpdate('endYear', e.target.value)}
            className={`w-full px-4 py-2.5 rounded-lg text-sm ${isEditing && !edu.current ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-500 opacity-60'}`}>
            <option value="">Year</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {isEditing && (
            <label className="mt-2 flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input type="checkbox" checked={edu.current} onChange={(e) => onUpdate('current', e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
              Current Student
            </label>
          )}
        </InputGroup>
      </div>
    </motion.div>
  );
}

function CertificationItem({ cert, onUpdate, onDelete, isEditing, isIncomplete, missingFields }: any) {
  return (
    <motion.div
      layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      data-card-id={cert.id}
      className={`p-4 sm:p-5 lg:p-6 rounded-xl relative group transition-all max-w-full overflow-hidden ${
        isIncomplete && isEditing
          ? 'bg-red-50/40 border-2 border-red-300'
          : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
      }`}
    >
      {isEditing && isIncomplete && (
        <IncompleteCardBanner missingFields={missingFields} onDelete={onDelete} />
      )}
      {isEditing && !isIncomplete && (
        <motion.button whileHover={{ scale: 1.2 }} type="button" onClick={onDelete}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5">
          <Trash2 size={16} />
        </motion.button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Certification Name">
          <EditableInput isEditing={isEditing} value={cert.name} onChange={(e: any) => onUpdate('name', e)} placeholder="AWS Certified"
            hasError={isIncomplete && !cert.name?.trim()} />
        </InputGroup>
        <InputGroup label="Organization">
          <EditableInput isEditing={isEditing} value={cert.org} onChange={(e: any) => onUpdate('org', e)} placeholder="Amazon"
            hasError={isIncomplete && !cert.org?.trim()} />
        </InputGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputGroup label="Issue Date">
          <div className="flex gap-2">
            <select disabled={!isEditing} value={cert.issueMonth || ''} onChange={(e) => onUpdate('issueMonth', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm ${isEditing ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
              <option value="">Month</option>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select disabled={!isEditing} value={cert.issueYear || ''} onChange={(e) => onUpdate('issueYear', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm ${isEditing ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
              <option value="">Year</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
        <InputGroup label="Credential URL">
          <EditableInput isEditing={isEditing} value={cert.url} onChange={(e: any) => onUpdate('url', e)} placeholder="https://..." />
        </InputGroup>
      </div>
    </motion.div>
  );
}

function PublicationItem({ pub, onUpdate, onDelete, isEditing, isIncomplete, missingFields }: any) {
  return (
    <motion.div
      layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      data-card-id={pub.id}
      className={`p-4 sm:p-5 lg:p-6 rounded-xl relative group transition-all max-w-full overflow-hidden ${
        isIncomplete && isEditing
          ? 'bg-red-50/40 border-2 border-red-300'
          : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
      }`}
    >
      {isEditing && isIncomplete && (
        <IncompleteCardBanner missingFields={missingFields} onDelete={onDelete} />
      )}
      {isEditing && !isIncomplete && (
        <motion.button whileHover={{ scale: 1.2 }} type="button" onClick={onDelete}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5">
          <Trash2 size={16} />
        </motion.button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Title">
          <EditableInput isEditing={isEditing} value={pub.title} onChange={(e: any) => onUpdate('title', e)} placeholder="Paper Title"
            hasError={isIncomplete && !pub.title?.trim()} />
        </InputGroup>
        <InputGroup label="Publisher">
          <EditableInput isEditing={isEditing} value={pub.publisher} onChange={(e: any) => onUpdate('publisher', e)} placeholder="Journal, Medium, etc."
            hasError={isIncomplete && !pub.publisher?.trim()} />
        </InputGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputGroup label="Date">
          <div className="flex gap-2">
            <select disabled={!isEditing} value={pub.dateMonth || ''} onChange={(e) => onUpdate('dateMonth', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm ${isEditing ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
              <option value="">Month</option>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select disabled={!isEditing} value={pub.dateYear || ''} onChange={(e) => onUpdate('dateYear', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm ${isEditing ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
              <option value="">Year</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
        <InputGroup label="URL">
          <EditableInput isEditing={isEditing} value={pub.url} onChange={(e: any) => onUpdate('url', e)} placeholder="https://..." />
        </InputGroup>
      </div>
    </motion.div>
  );
}

// ── PRIMITIVE FORM COMPONENTS ─────────────────────────────────────────────────

function InputGroup({ label, children, required }: any) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-blue-600 mb-2 uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function EditableInput({ isEditing, value, onChange, placeholder, hasError }: any) {
  return (
    <input
      disabled={!isEditing} type="text" value={value || ''}
      onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full px-4 py-2.5 rounded-lg text-sm transition-all ${
        hasError ? 'border-2 border-red-400 bg-white focus:outline-none focus:border-red-500' :
        isEditing ? 'bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600 hover:border-gray-400' :
        'bg-transparent border-0 text-gray-700 cursor-default p-0'
      }`}
    />
  );
}

function EditableTextarea({ isEditing, value, onChange, placeholder, minHeight, hasError }: any) {
  return (
    <textarea
      disabled={!isEditing} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full px-4 py-2.5 rounded-lg text-sm transition-all resize-none ${minHeight} ${
        hasError ? 'border-2 border-red-400 bg-white focus:outline-none focus:border-red-500' :
        isEditing ? 'bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600 hover:border-gray-400' :
        'bg-transparent border-0 text-gray-600 cursor-default p-0'
      }`}
    />
  );
}

function SocialInput({ icon, value, onChange, placeholder, isEditing }: any) {
  return (
    <div className="relative flex items-center">
      <div className="absolute left-3.5 text-blue-500">{icon}</div>
      <input
        disabled={!isEditing} type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all ${
          isEditing ? 'bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600 hover:border-gray-400' :
          'bg-gray-50 border border-gray-200 text-gray-600'
        }`}
      />
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={<ProfileLoadingScreen />}>
      <ProfileContent />
    </Suspense>
  );
}