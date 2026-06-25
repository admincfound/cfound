'use client';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  User, Github, Linkedin, Globe, Plus, Trash2, Save, 
  ChevronDown, ChevronUp, Briefcase, BookOpen, Award, Layers,
  Sparkles, Link as LinkIcon, BookMarked, AlertCircle, CheckCircle2, X, Edit3,
  ArrowUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getProfileCompletion } from '../lib/profileUtils';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Personal Project', 'Team Project', 'Volunteer', 'Other'];
const WORK_MODES = ['Remote', 'Hybrid', 'Onsite'];
const PROJECT_STATUS = ['Completed', 'In Progress', 'Planned'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = Array.from({length: 40}, (_, i) => new Date().getFullYear() - i).map(String);

const FieldWrapper = ({ show, children }: { show: boolean; children: React.ReactNode }) => {
  return show ? <>{children}</> : null;
};

interface ValidationError {
  section: string;
  message: string;
}

export default function Profile() {
  const { profile, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
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
        bio: profile.bio || '',
        role: profile.role || 'user',
        primaryRole: profile.primaryRole || '',
        experienceLevel: profile.experienceLevel || 'Fresher',
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
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const validateForm = (): boolean => {
    const errors: ValidationError[] = [];

    if (!formData.displayName?.trim()) {
      errors.push({ section: 'personal', message: 'Full name is required' });
    }

    if (!formData.primaryRole?.trim()) {
      errors.push({ section: 'personal', message: 'Primary role is required' });
    }

    if (!Array.isArray(formData.skills) || formData.skills.length === 0) {
      errors.push({ section: 'personal', message: 'At least one skill is required' });
    }

    if (isEditing && !formData.declarationAccepted) {
      errors.push({ section: 'declaration', message: 'You must accept the declaration' });
    }

    if (isEditing && formData.declarationAccepted && !formData.signature?.trim()) {
      errors.push({ section: 'declaration', message: 'Digital signature is required' });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      // Scroll to first error section
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

    if (!currentUser) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);

    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          ...formData,
          uid: currentUser.uid,
          email: currentUser.email || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      toast.success("Profile updated successfully! 🎉");
      setIsEditing(false);
      setHasChanges(false);
      setInitialData(JSON.stringify(formData));
      setValidationErrors([]);

    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const addItem = (section: string, defaultObj: any) => {
    setFormData({
      ...formData,
      [section]: [...formData[section], { ...defaultObj, id: crypto.randomUUID() }]
    });
  };

  const removeItem = (section: string, id: string) => {
    setFormData({
      ...formData,
      [section]: formData[section].filter((item: any) => item.id !== id)
    });
  };

  const updateItem = (section: string, id: string, field: string, value: any) => {
    setFormData({
      ...formData,
      [section]: formData[section].map((item: any) => 
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  const toggleCollapse = (section: keyof typeof collapsed) => {
    setCollapsed({ ...collapsed, [section]: !collapsed[section] });
  };

  const completion = useMemo(() => getProfileCompletion(formData), [formData]);

  if (authLoading || !formData) return (
    <div className="h-screen flex items-center justify-center bg-[var(--bg-main)]">
      <div className="text-center font-bold text-2xl bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent animate-pulse">
        Loading Profile...
      </div>
    </div>
  );

  if (isAdmin) {
    return <AdminProfileView 
      formData={formData} 
      setFormData={setFormData} 
      handleUpdateProfile={handleUpdateProfile}
      loading={loading}
      profile={profile}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
    />;
  }

  return (
    <div className="pt-28 pb-40 px-4 md:px-6 bg-[var(--bg-main)] min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 left-10 w-80 h-80 bg-primary-600/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10" ref={formRef}>
        
        {/* Validation Errors Alert */}
        <AnimatePresence>
          {validationErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-2xl backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-600 mb-2">Please complete required fields:</h3>
                  <ul className="space-y-1">
                    {validationErrors.map((err, idx) => (
                      <li key={idx} className="text-sm text-red-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header with Edit Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12"
        >
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 flex-1">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-[var(--bg-main)] bg-[var(--bg-card)] shadow-2xl">
                <img 
                  src={
                    profile?.photoURL ||
                    'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&size=160'
                  } 
                  alt="Profile"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&size=160';
                  }}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
                      
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center md:text-left flex-1"
            >
              <h1 className="text-4xl md:text-5xl font-black text-[var(--text-main)] mb-2">
                {formData.displayName || 'Your Name'}
              </h1>
              {(formData.primaryRole || isEditing) && (
                <p className="text-lg md:text-xl text-primary-500 font-bold mb-3">
                  {formData.primaryRole || 'Add your professional role'}
                </p>
              )}
              <p className="text-[var(--text-muted)] text-sm md:text-base max-w-2xl leading-relaxed">
                {formData.bio || (isEditing ? 'Add a compelling bio...' : '')}
              </p>
            </motion.div>
          </div>

          {/* Top Edit/Cancel Button */}
          {!isEditing ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-8 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Edit3 size={18} />
              Edit Profile
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                setFormData(JSON.parse(initialData));
                setHasChanges(false);
                setIsEditing(false);
                setValidationErrors([]);
              }}
              className="px-8 py-3.5 border-2 border-primary-500/30 text-[var(--text-main)] rounded-xl font-bold hover:bg-primary-500/10 transition-all"
            >
              Cancel
            </motion.button>
          )}
        </motion.div>

        {/* Profile Completion Tracker */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16 p-8 md:p-10 bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-[var(--bg-main)] border border-primary-500/20 rounded-2xl shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 md:w-32 md:h-32 bg-primary-500/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-600/10 rounded-full blur-3xl -z-10"></div>

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h3 className="text-2xl md:text-3xl font-black text-[var(--text-main)] flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${completion.percentage === 100 ? 'bg-green-500/20' : 'bg-primary-500/20'}`}>
                    <CheckCircle2 size={28} className={completion.percentage === 100 ? "text-green-500" : "text-primary-500"} />
                  </div>
                  Profile Strength
                </h3>
                <motion.span 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`px-4 py-2 text-xs uppercase font-black tracking-widest rounded-full backdrop-blur-sm border ${
                    completion.strength === 'Strong' ? 'bg-green-500/20 text-green-600 border-green-500/30' :
                    completion.strength === 'Average' ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' :
                    'bg-red-500/20 text-red-600 border-red-500/30'
                  }`}>
                  {completion.strength}
                </motion.span>
              </div>
              <p className="text-sm font-medium text-[var(--text-muted)] opacity-80">Complete your profile to unlock opportunities</p>
            </div>
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="font-black text-5xl md:text-6xl bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent"
            >
              {completion.percentage}%
            </motion.span>
          </div>

          <div className="h-3 w-full bg-[var(--bg-hover)]/50 rounded-full overflow-hidden mb-6 border border-primary-500/20 relative z-10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completion.percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${completion.percentage >= 100 ? 'from-green-500 to-green-600' : (completion.percentage >= 71 ? 'from-primary-500 to-primary-600' : (completion.percentage >= 41 ? 'from-yellow-500 to-yellow-600' : 'from-red-500 to-red-600'))} rounded-full shadow-lg`}
            />
          </div>

          {!completion.isComplete && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 text-red-600 border border-red-500/30 p-4 rounded-xl text-sm backdrop-blur-sm"
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <ul className="space-y-1 flex-1">
                  {completion.missing.map((req: string, idx: number) => (
                    <li key={idx} className="text-sm">{req}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {completion.isComplete && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/15 text-green-600 border border-green-500/30 p-4 rounded-xl text-sm font-semibold flex items-center gap-3 backdrop-blur-sm"
            >
              <CheckCircle2 size={18} className="flex-shrink-0" />
              Your profile is complete! You're ready to apply. 🚀
            </motion.div>
          )}
        </motion.div>

        <form onSubmit={handleUpdateProfile} className="space-y-8">
          
          {/* 1. Personal Details */}
          <ProfileSection 
            title="Personal Details" 
            icon={<User size={24} />} 
            isCollapsed={collapsed.personal} 
            onToggle={() => toggleCollapse('personal')}
            sectionId="personal"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="Full Name *" required>
                <EditableInput
                  isEditing={isEditing}
                  value={formData.displayName}
                  onChange={(v) => setFormData({ ...formData, displayName: v })}
                  placeholder="e.g. John Doe"
                  hasError={validationErrors.some(e => e.message.includes('Full name'))}
                />
              </InputGroup>

              <InputGroup label="Email Address">
                <input 
                  disabled={true}
                  type="email" 
                  value={formData.email || profile?.email || ""}
                  readOnly
                  className="w-full bg-transparent border-none text-[var(--text-main)] rounded-xl p-3.5 text-sm opacity-60 cursor-not-allowed"
                  placeholder="Email Address"
                />
              </InputGroup>
              <FieldWrapper show={isEditing || formData.phone}>
                <InputGroup label="Phone Number">
                  <EditableInput
                    isEditing={isEditing}
                    value={formData.phone}
                    onChange={(v) => setFormData({ ...formData, phone: v })}
                    placeholder="+1 234 567 890"
                  />
                </InputGroup>
              </FieldWrapper>
              <FieldWrapper show={isEditing || formData.country}>
                <InputGroup label="Country">
                  <EditableInput
                    isEditing={isEditing}
                    value={formData.country}
                    onChange={(v) => setFormData({ ...formData, country: v })}
                    placeholder="e.g. India"
                  />
                </InputGroup>
              </FieldWrapper>
              <FieldWrapper show={isEditing || formData.state}>
                <InputGroup label="State / Province">
                  <EditableInput
                    isEditing={isEditing}
                    value={formData.state}
                    onChange={(v) => setFormData({ ...formData, state: v })}
                    placeholder="e.g. Tamil Nadu"
                  />
                </InputGroup>
              </FieldWrapper>
              <FieldWrapper show={isEditing || formData.city}>
                <InputGroup label="City">
                  <EditableInput
                    isEditing={isEditing}
                    value={formData.city}
                    onChange={(v) => setFormData({ ...formData, city: v })}
                    placeholder="e.g. Chennai"
                  />
                </InputGroup>
              </FieldWrapper>
            </div>
            <div className="mt-6">
              <FieldWrapper show={isEditing || formData.bio}>
                <InputGroup label="About / Bio">
                  <EditableTextarea
                    isEditing={isEditing}
                    value={formData.bio}
                    onChange={(v) => setFormData({ ...formData, bio: v })}
                    placeholder="Write a compelling professional summary..."
                    minHeight="min-h-[120px]"
                  />
                </InputGroup>
              </FieldWrapper>
            </div>
            
            <div className="mt-8 pt-8 border-t border-primary-500/20 grid grid-cols-1 md:grid-cols-2 gap-6">
               <InputGroup label="Primary Role / Interest *" required>
                  <EditableInput
                    isEditing={isEditing}
                    value={formData.primaryRole}
                    onChange={(v) => setFormData({ ...formData, primaryRole: v })}
                    placeholder="e.g. Frontend Developer"
                    hasError={validationErrors.some(e => e.message.includes('Primary role'))}
                  />
               </InputGroup>
               <InputGroup label="Experience Level">
                   <select 
                    disabled={!isEditing}
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    className={`w-full rounded-xl p-3.5 text-sm transition-all font-semibold ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 cursor-pointer hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] cursor-default opacity-70'}`}
                  >
                     <option value="Fresher">Fresher</option>
                     <option value="1–2 Years">1–2 Years</option>
                     <option value="2–5 Years">2–5 Years</option>
                     <option value="5–10 Years">5–10 Years</option>
                     <option value="10+ Years">10+ Years</option>
                  </select>
               </InputGroup>
               <div className="md:col-span-2">
                 <InputGroup label="Top Skills (Minimum 1) *" required>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(Array.isArray(formData.skills) ? formData.skills : []).map((skill: string, idx: number) => (
                        <motion.div 
                          key={idx}
                          layout
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="flex items-center gap-2 bg-gradient-to-r from-primary-500/20 to-primary-600/20 border border-primary-500/40 text-primary-600 px-4 py-2 rounded-full text-sm font-bold group hover:border-primary-500/60 transition-all"
                        >
                          {skill}
                          {isEditing && (
                            <button type="button" onClick={() => {
                              const newSkills = [...formData.skills];
                              newSkills.splice(idx, 1);
                              setFormData({ ...formData, skills: newSkills });
                            }} className="hover:text-red-500 transition-colors ml-1 opacity-60 group-hover:opacity-100">
                              <X size={14} />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex gap-2">
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
                          className="flex-1 bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] rounded-xl p-3.5 text-sm focus:outline-none focus:border-primary-500 transition-all font-medium hover:border-primary-500/50"
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
                          className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl px-5 hover:shadow-lg hover:shadow-primary-500/30 transition-all font-bold"
                        >
                          <Plus size={22} />
                        </button>
                      </div>
                    )}
                 </InputGroup>
               </div>
            </div>
          </ProfileSection>

          {/* 2. Experience */}
          {(isEditing || formData.experiences?.length > 0) && (
            <ModularSection 
              title="Experience" 
              icon={<Briefcase size={24} />} 
              items={formData.experiences}
              isCollapsed={collapsed.experience}
              onToggle={() => toggleCollapse('experience')}
              onAdd={() => addItem('experiences', {
                role: '',
                company: '',
                type: 'Full-time',
                startMonth: '',
                startYear: '',
                endMonth: '',
                endYear: '',
                current: false,
                location: '',
                mode: 'Onsite',
                skills: '',
                description: ''
              })}
              itemRenderer={(exp: any) => (
                <ExperienceItem 
                  isEditing={isEditing}
                  key={exp.id} 
                  exp={exp} 
                  onUpdate={(f: any, v: any) => updateItem('experiences', exp.id, f, v)}
                  onDelete={() => removeItem('experiences', exp.id)}
                />
              )}
              addButtonText="Add Experience"
              isEditing={isEditing}
            />
          )}

          {/* 3. Projects */}
          {(isEditing || formData.projects?.length > 0) && (
            <ModularSection 
              title="Projects" 
              icon={<Layers size={24} />} 
              items={formData.projects}
              isCollapsed={collapsed.projects}
              onToggle={() => toggleCollapse('projects')}
              onAdd={() => addItem('projects', {
                title: '',
                category: '',
                description: '',
                skills: '',
                technologies: '',
                startMonth: '',
                startYear: '',
                endMonth: '',
                endYear: '',
                status: 'Completed',
                demoUrl: '',
                githubUrl: ''
              })}
              itemRenderer={(proj: any) => (
                <ProjectItem 
                  isEditing={isEditing}
                  key={proj.id} 
                  proj={proj}
                  onUpdate={(f: any, v: any) => updateItem('projects', proj.id, f, v)}
                  onDelete={() => removeItem('projects', proj.id)}
                />
              )}
              addButtonText="Add Project"
              isEditing={isEditing}
            />
          )}

          {/* 4. Profiles & Links */}
          {(isEditing || [formData.portfolioUrl, formData.githubUrl, formData.linkedinUrl, formData.behanceUrl, formData.artstationUrl].some(url => url)) && (
            <ProfileSection 
              title="Profiles & Links" 
              icon={<LinkIcon size={24} />} 
              isCollapsed={collapsed.links} 
              onToggle={() => toggleCollapse('links')}
              sectionId="links"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SocialInput
                  isEditing={isEditing} icon={<Globe size={18}/>} placeholder="Portfolio Website" value={formData.portfolioUrl} onChange={(v:any) => setFormData({...formData, portfolioUrl: v})} />
                <SocialInput
                  isEditing={isEditing} icon={<Github size={18}/>} placeholder="GitHub Profile" value={formData.githubUrl} onChange={(v:any) => setFormData({...formData, githubUrl: v})} />
                <SocialInput
                  isEditing={isEditing} icon={<Linkedin size={18}/>} placeholder="LinkedIn Profile" value={formData.linkedinUrl} onChange={(v:any) => setFormData({...formData, linkedinUrl: v})} />
                <SocialInput
                  isEditing={isEditing} icon={<Layers size={18}/>} placeholder="Behance" value={formData.behanceUrl} onChange={(v:any) => setFormData({...formData, behanceUrl: v})} />
                <SocialInput
                  isEditing={isEditing} icon={<BookOpen size={18}/>} placeholder="ArtStation" value={formData.artstationUrl} onChange={(v:any) => setFormData({...formData, artstationUrl: v})} />
                <SocialInput
                  isEditing={isEditing} icon={<LinkIcon size={18}/>} placeholder="Other Link" value={formData.otherUrl} onChange={(v:any) => setFormData({...formData, otherUrl: v})} />
              </div>
            </ProfileSection>
          )}

          {/* 5. Education */}
          {(isEditing || formData.education?.length > 0) && (
            <ModularSection 
              title="Education" 
              icon={<BookOpen size={24} />} 
              items={formData.education}
              isCollapsed={collapsed.education}
              onToggle={() => toggleCollapse('education')}
              onAdd={() => addItem('education', {
                institution: '',
                degree: '',
                department: '',
                startYear: '',
                endYear: '',
                current: false
              })}
              itemRenderer={(edu: any) => (
                <EducationItem 
                  isEditing={isEditing}
                  key={edu.id}
                  edu={edu}
                  onUpdate={(f:any, v:any) => updateItem('education', edu.id, f, v)}
                  onDelete={() => removeItem('education', edu.id)}
                />
              )}
              addButtonText="Add Education"
              isEditing={isEditing}
            />
          )}

          {/* 6. Certifications */}
          {(isEditing || formData.certifications?.length > 0) && (
            <ModularSection 
              title="Certifications" 
              icon={<Award size={24} />} 
              items={formData.certifications}
              isCollapsed={collapsed.certifications}
              onToggle={() => toggleCollapse('certifications')}
              onAdd={() => addItem('certifications', {
                name: '',
                org: '',
                issueMonth: '',
                issueYear: '',
                url: ''
              })}
              itemRenderer={(cert: any) => (
                <CertificationItem 
                  isEditing={isEditing}
                  key={cert.id}
                  cert={cert}
                  onUpdate={(f:any, v:any) => updateItem('certifications', cert.id, f, v)}
                  onDelete={() => removeItem('certifications', cert.id)}
                />
              )}
              addButtonText="Add Certification"
              isEditing={isEditing}
            />
          )}

          {/* 7. Publications */}
          {(isEditing || formData.publications?.length > 0) && (
            <ModularSection 
              title="Publications" 
              icon={<BookMarked size={24} />} 
              items={formData.publications}
              isCollapsed={collapsed.publications}
              onToggle={() => toggleCollapse('publications')}
              onAdd={() => addItem('publications', {
                title: '',
                publisher: '',
                dateMonth: '',
                dateYear: '',
                url: ''
              })}
              itemRenderer={(pub: any) => (
                <PublicationItem 
                  isEditing={isEditing}
                  key={pub.id}
                  pub={pub}
                  onUpdate={(f:any, v:any) => updateItem('publications', pub.id, f, v)}
                  onDelete={() => removeItem('publications', pub.id)}
                />
              )}
              addButtonText="Add Publication"
              isEditing={isEditing}
            />
          )}

          {/* Mandatory Agreement Section */}
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              data-section="declaration"
              className={`p-8 md:p-10 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-main)] border rounded-2xl shadow-lg ${
                validationErrors.some(e => e.section === 'declaration') 
                  ? 'border-red-500/50' 
                  : 'border-primary-500/20'
              }`}
            >
              <h2 className="text-2xl font-black text-[var(--text-main)] mb-6 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary-500/20">
                  <CheckCircle2 size={24} className="text-primary-500" />
                </div>
                Declaration & Consent
              </h2>
              <div className="space-y-6">
                <label className="flex items-start gap-4 cursor-pointer group">
                    <input
                      type="checkbox" 
                      checked={formData.declarationAccepted} 
                      onChange={(e) => setFormData({ ...formData, declarationAccepted: e.target.checked })} 
                      className="mt-1 w-6 h-6 rounded-lg border-2 border-primary-500/50 text-primary-600 focus:ring-primary-600 bg-[var(--bg-card)] accent-primary-600 cursor-pointer" 
                    />
                   <span className="text-base font-medium text-[var(--text-main)] leading-relaxed group-hover:text-primary-600 transition-colors">
                     I confirm that the information provided in my profile is accurate and can be used for internship applications, job hiring evaluation, course enrollments, and professional communication purposes. *
                   </span>
                 </label>

                 {formData.declarationAccepted && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="pt-6 border-t border-primary-500/20"
                   >
                     <InputGroup label="Digital Signature (Type Full Name) *" required>
                        <input 
                          type="text" 
                          value={formData.signature}
                          onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                          className={`w-full md:w-1/2 bg-[var(--bg-card)] border-2 rounded-xl p-3.5 text-sm focus:outline-none transition-all font-serif italic placeholder:not-italic hover:border-primary-500/50 ${
                            validationErrors.some(e => e.message.includes('signature'))
                              ? 'border-red-500/50 focus:border-red-500'
                              : 'border-primary-500/30 focus:border-primary-500'
                          }`}
                          placeholder="Your Full Name"
                        />
                     </InputGroup>
                   </motion.div>
                 )}
              </div>
            </motion.div>
          )}

          {/* Bottom spacing for floating buttons */}
          <div className="h-20"></div>
        </form>
      </div>

      {/* Floating Action Buttons */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 flex gap-3 z-40 max-w-xs"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                setFormData(JSON.parse(initialData));
                setHasChanges(false);
                setIsEditing(false);
                setValidationErrors([]);
              }}
              className="flex-1 px-6 py-3 border-2 border-primary-500/30 text-[var(--text-main)] rounded-xl font-bold hover:bg-primary-500/10 hover:border-primary-500/60 transition-all"
            >
              Cancel
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading}
              onClick={handleUpdateProfile}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-black shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Save size={18} /> Save</>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-32 right-6 p-3 bg-primary-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function AdminProfileView({ formData, setFormData, handleUpdateProfile, loading, profile, isEditing, setIsEditing }: any) {
  return (
    <div className="pt-28 pb-40 px-6 bg-[var(--bg-main)] min-h-screen flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full p-10 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-main)] border border-primary-500/20 rounded-2xl shadow-lg"
      >
        
        <div className="flex flex-col items-center mb-8">
          <div className="relative group mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--bg-main)] bg-[var(--bg-card)]">
              <img 
                src={
                  profile?.photoURL ||
                  'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff'
                }
                alt=""
                onError={(e) => {
                  e.currentTarget.src =
                    'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff';
                }}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <h2 className="text-3xl font-black text-[var(--text-main)]">{formData.displayName}</h2>
          <div className="px-4 py-2 mt-3 bg-gradient-to-r from-primary-500/20 to-primary-600/20 text-primary-600 rounded-lg text-xs font-bold border border-primary-500/30">Administrator</div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <InputGroup label="Full Name">
            <input 
              disabled={!isEditing} 
              value={formData.displayName} 
              onChange={(e) => setFormData({...formData, displayName: e.target.value})} 
              className={`w-full rounded-xl p-3.5 text-sm transition-all ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`} 
            />
          </InputGroup>
          <InputGroup label="Bio">
            <textarea 
              disabled={!isEditing} 
              value={formData.bio} 
              onChange={(e) => setFormData({...formData, bio: e.target.value})} 
              className={`w-full rounded-xl p-3.5 text-sm transition-all min-h-[100px] ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}  
              placeholder="Brief overview..."
            />
          </InputGroup>
          <div className="flex gap-3 pt-2">
            {!isEditing ? (
              <button 
                type="button" 
                onClick={() => setIsEditing(true)} 
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl py-3.5 text-sm font-bold hover:shadow-lg hover:shadow-primary-500/30 transition-all"
              >
                Edit
              </button>
            ) : (
              <>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="w-full bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] rounded-xl py-3.5 text-sm font-bold hover:bg-primary-500/10 hover:border-primary-500/60 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-70"
                >
                  {loading ? "Saving..." : <><Save size={16} /> Save</>}
                </button>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ProfileSection({ title, icon, children, isCollapsed, onToggle, sectionId }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-section={sectionId}
      className={`p-8 md:p-10 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-main)] border border-primary-500/20 rounded-2xl transition-all hover:border-primary-500/40 group shadow-lg`}
    >
      <button 
        type="button" 
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-6 group/header"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary-500/20 text-primary-500 group-hover/header:bg-primary-500/30 transition-colors">
            {icon}
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-main)] group-hover/header:text-primary-600 transition-colors">{title}</h2>
        </div>
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.3 }}
          className="text-primary-500"
        >
          {isCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
        </motion.div>
      </button>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ModularSection({ title, icon, items = [], isCollapsed, onToggle, onAdd, itemRenderer, addButtonText, isEditing }: any) {
  const dataItems = Array.isArray(items) ? items : [];
  return (
    <ProfileSection title={title} icon={icon} isCollapsed={isCollapsed} onToggle={onToggle}>
      <div className="space-y-6">
        <AnimatePresence>
          {dataItems.map((item: any) => itemRenderer(item))}
        </AnimatePresence>
        
        {isEditing && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button" 
            onClick={onAdd}
            className="w-full py-4 border-2 border-dashed border-primary-500/40 bg-primary-500/5 rounded-2xl flex items-center justify-center gap-3 text-primary-600 hover:border-primary-500/80 hover:bg-primary-500/10 transition-all font-bold text-base group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            {addButtonText}
          </motion.button>
        )}
      </div>
    </ProfileSection>
  );
}

// Item Components (Experience, Project, Education, etc.) - Same as before
function ExperienceItem({ exp, onUpdate, onDelete, isEditing }: any) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-6 bg-[var(--bg-main)] border border-primary-500/20 rounded-2xl relative group/item shadow-sm hover:border-primary-500/40 transition-all"
    >
      {isEditing && (
        <motion.button 
          whileHover={{ scale: 1.2 }}
          type="button" 
          onClick={onDelete} 
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100 p-2 hover:bg-red-500/10 rounded-lg"
        >
          <Trash2 size={18} />
        </motion.button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Role / Position">
          <EditableInput isEditing={isEditing} value={exp.role} onChange={(e) => onUpdate('role', e)} placeholder="Software Engineer" />
        </InputGroup>
        <InputGroup label="Company / Organization">
          <EditableInput isEditing={isEditing} value={exp.company} onChange={(e) => onUpdate('company', e)} placeholder="Acme Inc" />
        </InputGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <InputGroup label="Employment Type">
          <select disabled={!isEditing} value={exp.type} onChange={(e) => onUpdate('type', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}>
            {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </InputGroup>
        <InputGroup label="Location">
           <EditableInput isEditing={isEditing} value={exp.location} onChange={(e) => onUpdate('location', e)} placeholder="City, Country" />
        </InputGroup>
        <InputGroup label="Work Mode">
          <select disabled={!isEditing} value={exp.mode} onChange={(e) => onUpdate('mode', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}>
            {WORK_MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </InputGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Start Date">
          <div className="flex gap-2">
             <select disabled={!isEditing} value={exp.startMonth || ''} onChange={(e) => onUpdate('startMonth', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}>
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
             <select disabled={!isEditing} value={exp.startYear || ''} onChange={(e) => onUpdate('startYear', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}>
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
        <InputGroup label="End Date">
          <div className="flex gap-2">
             <select disabled={!isEditing || exp.current} value={exp.endMonth || ''} onChange={(e) => onUpdate('endMonth', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'} ${!isEditing || exp.current ? 'opacity-50' : ''}`}>
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
             <select disabled={!isEditing || exp.current} value={exp.endYear || ''} onChange={(e) => onUpdate('endYear', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'} ${!isEditing || exp.current ? 'opacity-50' : ''}`}>
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {isEditing && (
            <div className="mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-muted)] group/checkbox hover:text-primary-600 transition-colors">
                <input 
                  type="checkbox" 
                  checked={exp.current} 
                  onChange={(e) => onUpdate('current', e.target.checked)} 
                  className="w-4 h-4 rounded border-2 border-primary-500/50 text-primary-600 focus:ring-primary-600 bg-[var(--bg-card)] accent-primary-600 cursor-pointer group-hover/checkbox:border-primary-500" 
                />
                I currently work here
              </label>
            </div>
          )}
        </InputGroup>
      </div>
      
      <div className="mb-5">
         <InputGroup label="Skills Used (Comma separated)">
            <EditableInput isEditing={isEditing} value={exp.skills} onChange={(e) => onUpdate('skills', e)} placeholder="React, Node.js, TypeScript" />
         </InputGroup>
      </div>

      <InputGroup label="Description">
        <EditableTextarea isEditing={isEditing} value={exp.description} onChange={(e) => onUpdate('description', e)} placeholder="Key responsibilities and achievements..." minHeight="min-h-[120px]" />
      </InputGroup>
    </motion.div>
  );
}

function ProjectItem({ proj, onUpdate, onDelete, isEditing }: any) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-6 bg-[var(--bg-main)] border border-primary-500/20 rounded-2xl relative group/item shadow-sm hover:border-primary-500/40 transition-all"
    >
      {isEditing && (
        <motion.button 
          whileHover={{ scale: 1.2 }}
          type="button" 
          onClick={onDelete} 
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100 p-2 hover:bg-red-500/10 rounded-lg"
        >
          <Trash2 size={18} />
        </motion.button>
      )}  
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Project Title">
          <EditableInput isEditing={isEditing} value={proj.title} onChange={(e) => onUpdate('title', e)} placeholder="Project Name" />
        </InputGroup>
        <InputGroup label="Category">
           <EditableInput isEditing={isEditing} value={proj.category} onChange={(e) => onUpdate('category', e)} placeholder="Web App, Mobile App, etc." />
        </InputGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Start Date">
          <div className="flex gap-2">
             <select disabled={!isEditing} value={proj.startMonth || ''} onChange={(e) => onUpdate('startMonth', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}>
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
             <select disabled={!isEditing} value={proj.startYear || ''} onChange={(e) => onUpdate('startYear', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}>
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
        <InputGroup label="End Date">
          <div className="flex gap-2">
             <select disabled={!isEditing} value={proj.endMonth || ''} onChange={(e) => onUpdate('endMonth', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}>
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
             <select disabled={!isEditing} value={proj.endYear || ''} onChange={(e) => onUpdate('endYear', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}>
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Status">
          <select disabled={!isEditing} value={proj.status} onChange={(e) => onUpdate('status', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}>
            {PROJECT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </InputGroup>
        <InputGroup label="Technologies Used">
           <EditableInput isEditing={isEditing} value={proj.technologies} onChange={(e) => onUpdate('technologies', e)} placeholder="React, Node, MongoDB" />
        </InputGroup>
      </div>

      <InputGroup label="Description">
        <EditableTextarea isEditing={isEditing} value={proj.description} onChange={(e) => onUpdate('description', e)} placeholder="Brief project summary..." minHeight="min-h-[120px]" />
      </InputGroup>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        <SocialInput
                isEditing={isEditing} icon={<Github size={16}/>} placeholder="Repository Link" value={proj.githubUrl} onChange={(v:any) => onUpdate('githubUrl', v)} />
        <SocialInput
                isEditing={isEditing} icon={<Globe size={16}/>} placeholder="Demo URL" value={proj.demoUrl} onChange={(v:any) => onUpdate('demoUrl', v)} />
      </div>
    </motion.div>
  );
}

function EducationItem({ edu, onUpdate, onDelete, isEditing }: any) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-6 bg-[var(--bg-main)] border border-primary-500/20 rounded-2xl relative group/item shadow-sm hover:border-primary-500/40 transition-all"
    >
      {isEditing && (
        <motion.button 
          whileHover={{ scale: 1.2 }}
          type="button" 
          onClick={onDelete} 
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-lg"
        >
          <Trash2 size={18} />
        </motion.button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Institution Name">
          <EditableInput isEditing={isEditing} value={edu.institution} onChange={(e) => onUpdate('institution', e)} placeholder="University of Technology" />
        </InputGroup>
        <InputGroup label="Degree / Course">
          <EditableInput isEditing={isEditing} value={edu.degree} onChange={(e) => onUpdate('degree', e)} placeholder="Bachelor of Science" />
        </InputGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <InputGroup label="Department / Major">
           <EditableInput isEditing={isEditing} value={edu.department} onChange={(e) => onUpdate('department', e)} placeholder="Computer Science" />
        </InputGroup>
        <InputGroup label="Start Year">
            <select disabled={!isEditing} value={edu.startYear || ''} onChange={(e) => onUpdate('startYear', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}>
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
           </select>
        </InputGroup>
        <InputGroup label="End Year">
            <select disabled={!isEditing || edu.current} value={edu.endYear || ''} onChange={(e) => onUpdate('endYear', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'} ${!isEditing || edu.current ? 'opacity-50' : ''}`}>
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
           </select>
           {isEditing && (
             <div className="mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-muted)] group/checkbox hover:text-primary-600 transition-colors">
                <input 
                  type="checkbox" 
                  checked={edu.current} 
                  onChange={(e) => onUpdate('current', e.target.checked)} 
                  className="w-4 h-4 rounded border-2 border-primary-500/50 text-primary-600 focus:ring-primary-600 bg-[var(--bg-card)] accent-primary-600 cursor-pointer group-hover/checkbox:border-primary-500" 
                />
                Current Student
              </label>
             </div>
           )}
        </InputGroup>
      </div>
    </motion.div>
  );
}

function CertificationItem({ cert, onUpdate, onDelete, isEditing }: any) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-6 bg-[var(--bg-main)] border border-primary-500/20 rounded-2xl relative group/item shadow-sm hover:border-primary-500/40 transition-all"
    >
      {isEditing && (
        <motion.button 
          whileHover={{ scale: 1.2 }}
          type="button" 
          onClick={onDelete} 
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-lg"
        >
          <Trash2 size={18} />
        </motion.button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Certification Name">
          <EditableInput isEditing={isEditing} value={cert.name} onChange={(e) => onUpdate('name', e)} placeholder="AWS Certified Architect" />
        </InputGroup>
        <InputGroup label="Issuing Organization">
          <EditableInput isEditing={isEditing} value={cert.org} onChange={(e) => onUpdate('org', e)} placeholder="Amazon Web Services" />
        </InputGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputGroup label="Issue Date">
          <div className="flex gap-2">
             <select disabled={!isEditing} value={cert.issueMonth || ''} onChange={(e) => onUpdate('issueMonth', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}>
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
             <select disabled={!isEditing} value={cert.issueYear || ''} onChange={(e) => onUpdate('issueYear', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}>
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
        <InputGroup label="Credential URL">
          <EditableInput isEditing={isEditing} value={cert.url} onChange={(e) => onUpdate('url', e)} placeholder="https://..." />
        </InputGroup>
      </div>
    </motion.div>
  );
}

function PublicationItem({ pub, onUpdate, onDelete, isEditing }: any) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-6 bg-[var(--bg-main)] border border-primary-500/20 rounded-2xl relative group/item shadow-sm hover:border-primary-500/40 transition-all"
    >
      {isEditing && (
        <motion.button 
          whileHover={{ scale: 1.2 }}
          type="button" 
          onClick={onDelete} 
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-lg"
        >
          <Trash2 size={18} />
        </motion.button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Title">
          <EditableInput isEditing={isEditing} value={pub.title} onChange={(e) => onUpdate('title', e)} placeholder="Research paper or article title" />
        </InputGroup>
        <InputGroup label="Publisher">
          <EditableInput isEditing={isEditing} value={pub.publisher} onChange={(e) => onUpdate('publisher', e)} placeholder="Journal, Medium, etc." />
        </InputGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputGroup label="Date">
          <div className="flex gap-2">
             <select disabled={!isEditing} value={pub.dateMonth || ''} onChange={(e) => onUpdate('dateMonth', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}>
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
             <select disabled={!isEditing} value={pub.dateYear || ''} onChange={(e) => onUpdate('dateYear', e.target.value)} className={`w-full rounded-xl p-3 text-sm transition-all font-medium ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] opacity-70'}`}>
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
        <InputGroup label="URL">
          <EditableInput isEditing={isEditing} value={pub.url} onChange={(e) => onUpdate('url', e)} placeholder="https://..." />
        </InputGroup>
      </div>
    </motion.div>
  );
}

function InputGroup({ label, children, required }: any) {
  return (
    <div>
      <label className="block text-xs font-bold text-primary-600 mb-2.5 uppercase tracking-widest">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function EditableInput({ isEditing, value, onChange, placeholder, hasError }: any) {
  return (
    <input
      disabled={!isEditing}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-xl p-3.5 text-sm transition-all ${
        hasError
          ? 'border-2 border-red-500/50 focus:border-red-500'
          : isEditing 
            ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 cursor-text hover:border-primary-500/50' 
            : 'bg-transparent border-none text-[var(--text-main)] cursor-default opacity-70'
      }`}
    />
  );
}

function EditableTextarea({ isEditing, value, onChange, placeholder, minHeight }: any) {
  return (
    <textarea
      disabled={!isEditing}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-xl p-3.5 text-sm transition-all ${minHeight} ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 cursor-text hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] cursor-default opacity-70'}`}
    />
  );
}

function SocialInput({ icon, value, onChange, placeholder, isEditing }: any) {
  return (
    <div className="relative group flex items-center">
      <div className="absolute left-4 text-primary-600">
        {icon}
      </div>
        <input
          disabled={!isEditing}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl pl-12 pr-4 py-3.5 text-sm transition-all ${isEditing ? 'bg-[var(--bg-card)] border-2 border-primary-500/30 text-[var(--text-main)] focus:outline-none focus:border-primary-500 cursor-text hover:border-primary-500/50' : 'bg-transparent border-none text-[var(--text-main)] cursor-default opacity-70'}`}
        />
    </div>
  );
}