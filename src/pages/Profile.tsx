import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { uploadFile } from '../lib/storage';
import { 
  User, Github, Linkedin, Globe, Plus, Trash2, Save, Camera, 
  ChevronDown, ChevronUp, Briefcase, BookOpen, Award, Layers,
  Sparkles, Link as LinkIcon, BookMarked, AlertCircle, CheckCircle2, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getProfileCompletion } from '../lib/profileUtils';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Personal Project', 'Team Project', 'Volunteer', 'Other'];
const WORK_MODES = ['Remote', 'Hybrid', 'Onsite'];
const PROJECT_STATUS = ['Completed', 'In Progress', 'Planned'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = Array.from({length: 40}, (_, i) => new Date().getFullYear() - i).map(String);

export default function Profile() {
  const { profile, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
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

  useEffect(() => {
    if (profile && !formData) {
      setFormData({
        displayName: profile.displayName || '',
        email: profile.email || auth.currentUser?.email || '',
        phone: profile.phone || '',
        country: profile.country || '',
        state: profile.state || '',
        city: profile.city || '',
        photoURL: profile.photoURL || '',
        bio: profile.bio || '',
        role: profile.role || 'user',
        primaryRole: profile.primaryRole || '',
        experienceLevel: profile.experienceLevel || 'Fresher',
        skills: Array.isArray(profile.skills) ? profile.skills : (typeof profile.skills === 'string' && profile.skills.trim() !== '' ? profile.skills.split(',').map((s: string) => s.trim()) : []),
        
        declarationAccepted: profile.declarationAccepted || false,
        signature: profile.signature || '',
        
        // Profiles & Links
        portfolioUrl: profile.portfolioUrl || '',
        githubUrl: profile.githubUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        behanceUrl: profile.behanceUrl || '',
        artstationUrl: profile.artstationUrl || '',
        youtubeUrl: profile.youtubeUrl || '',
        otherUrl: profile.otherUrl || '',
        
        // Arrays for modular sections
        experiences: Array.isArray(profile.experiences) ? profile.experiences : [],
        projects: Array.isArray(profile.projects) ? profile.projects : [],
        education: Array.isArray(profile.education) ? profile.education : [],
        certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
        publications: Array.isArray(profile.publications) ? profile.publications : [],
      });
    }
  }, [profile, formData]);

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    
    setUploadingImage(true);
    let url = '';
    try {
      url = await uploadFile(file, `profiles/${profile.uid}/avatar`);
    } catch (err) {
      console.error("Storage upload failed, falling back to Base64:", err);
      // Fallback to Base64 (Compressed)
      const reader = new FileReader();
      url = await new Promise((resolve) => {
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400;
            const MAX_HEIGHT = 400;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height *= MAX_WIDTH / width));
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width *= MAX_HEIGHT / height));
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    }

    if (url) {
      setFormData({ ...formData, photoURL: url });
      // Auto-save the photoURL right away
      try {
        await updateDoc(doc(db, 'users', profile.uid), { photoURL: url });
        toast.success("Profile image updated and saved.");
      } catch(e) {
         toast.success("Profile image updated locally. Click 'Save Profile' to persist.");
      }
    } else {
      toast.error("Image upload failed.");
    }
    
    setUploadingImage(false);
  };

  const addItem = (section: string, defaultObj: any) => {
    setFormData({
      ...formData,
      [section]: [...formData[section], { ...defaultObj, id: Math.random().toString(36).substr(2, 9) }]
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
      <div className="text-center font-medium text-primary-600 animate-pulse text-xl">
        Loading Profile...
      </div>
    </div>
  );

  if (isAdmin) {
    return <AdminProfileView 
      formData={formData} 
      setFormData={setFormData} 
      handleImageUpload={handleImageUpload}
      handleUpdateProfile={handleUpdateProfile}
      loading={loading}
      uploadingImage={uploadingImage}
      profile={profile}
    />;
  }

  return (
    <div className="pt-32 pb-40 px-6 bg-[var(--bg-main)] min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-10 mb-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border border-[var(--border-main)] bg-[var(--bg-card)] shadow-md relative transition-transform duration-300 group-hover:scale-105">
              <img 
                src={formData.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=neutral'} 
                alt="Profile" 
                className="w-full h-full object-cover bg-[var(--bg-main)]"
                referrerPolicy="no-referrer"
              />
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                  <Sparkles size={20} className="text-white animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-3 bg-white text-black rounded-full shadow-lg border border-gray-200 cursor-pointer hover:scale-110 transition-all">
              <Camera size={16} />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
            </label>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-main)] mb-2">
              {formData.displayName || 'Your Name'}
            </h1>
            <p className="text-[var(--text-muted)] text-base font-medium max-w-xl">
              {formData.bio || 'Add a short bio or professional headline here.'}
            </p>
          </div>
        </div>

        {/* Profile Completion Tracker */}
        <div className="mb-10 lg:mb-14 p-6 md:p-8 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-main)] border border-[var(--border-main)] rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <CheckCircle2 size={100} />
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 relative z-10 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                  <CheckCircle2 size={24} className={completion.percentage === 100 ? "text-green-500" : "text-primary-500"} />
                  Profile Completion
                </h3>
                <span className={`px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-full ${
                  completion.strength === 'Strong' ? 'bg-green-500/10 text-green-600' :
                  completion.strength === 'Average' ? 'bg-yellow-500/10 text-yellow-600' :
                  'bg-red-500/10 text-red-600'
                }`}>
                  {completion.strength} Profile
                </span>
              </div>
              <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest opacity-60">Unlock opportunities by completing your profile</p>
            </div>
            <span className="font-black text-5xl italic text-primary-600 tracking-tighter">{completion.percentage}%</span>
          </div>
          <div className="h-4 w-full bg-[var(--bg-hover)] rounded-full overflow-hidden mb-6 border border-[var(--border-main)] relative z-10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completion.percentage}%` }}
              className={`h-full ${completion.percentage >= 100 ? 'bg-green-500' : (completion.percentage >= 71 ? 'bg-primary-500' : (completion.percentage >= 41 ? 'bg-yellow-500' : 'bg-red-500'))}`}
            />
          </div>
          {!completion.isComplete && (
            <div className="bg-red-500/5 text-red-500 border border-red-500/10 p-4 rounded-xl text-sm">
              <div className="flex items-center gap-2 font-bold mb-2">
                <AlertCircle size={16} /> Remaining Mandatory Requirements:
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {completion.missing.map((req: string, idx: number) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}
          {completion.isComplete && (
             <div className="bg-green-500/10 text-green-600 border border-green-500/20 p-4 rounded-xl text-sm font-semibold flex flex-col gap-2">
               <div className="flex items-center gap-2">
                 <CheckCircle2 size={16} />
                 Your profile is complete! You can now apply to internships, jobs, and enroll in courses.
               </div>
             </div>
          )}
          {completion.suggestions && completion.suggestions.length > 0 && (
            <div className="mt-4 bg-primary-500/5 text-primary-600 border border-primary-500/10 p-4 rounded-xl text-sm">
              <div className="flex items-center gap-2 font-bold mb-2">
                <Sparkles size={16} /> Suggestions to Stand Out:
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {completion.suggestions.map((sug: string, idx: number) => (
                  <li key={idx} className="font-medium">{sug}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-8">
          
          {/* 1. Personal Details */}
          <ProfileSection 
            title="Personal Details" 
            icon={<User size={20} />} 
            isCollapsed={collapsed.personal} 
            onToggle={() => toggleCollapse('personal')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="Full Name">
                <input 
                  type="text" 
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all"
                  placeholder="e.g. John Doe"
                />
              </InputGroup>

              <InputGroup label="Email Address">
                <input 
                  type="email" 
                  value={formData.email || profile?.email || ""}
                  readOnly
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm opacity-70 cursor-not-allowed"
                  placeholder="Email Address"
                />
              </InputGroup>
              <InputGroup label="Phone Number">
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all"
                  placeholder="+1 234 567 890"
                />
              </InputGroup>
              <InputGroup label="Country">
                <input 
                  type="text" 
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all"
                  placeholder="e.g. United States"
                />
              </InputGroup>
              <InputGroup label="State / Province">
                <input 
                  type="text" 
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all"
                  placeholder="e.g. California"
                />
              </InputGroup>
              <InputGroup label="City">
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all"
                  placeholder="e.g. San Francisco"
                />
              </InputGroup>
            </div>
            <div className="mt-6">
               <InputGroup label="About / Bio">
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all min-h-[120px]"
                    placeholder="Write a brief professional summary..."
                  />
               </InputGroup>
            </div>
            
            <div className="mt-8 pt-8 border-t border-[var(--border-main)] grid grid-cols-1 md:grid-cols-2 gap-6">
               <InputGroup label="Primary Role / Interest">
                  <input 
                    type="text" 
                    value={formData.primaryRole}
                    onChange={(e) => setFormData({ ...formData, primaryRole: e.target.value })}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all"
                    placeholder="e.g. Frontend Developer, Business Analyst"
                  />
               </InputGroup>
               <InputGroup label="Experience Level">
                  <select 
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all font-medium"
                  >
                     <option value="Fresher">Fresher</option>
                     <option value="1–2 Years">1–2 Years</option>
                     <option value="2–5 Years">2–5 Years</option>
                     <option value="5–10 Years">5–10 Years</option>
                     <option value="10+ Years">10+ Years</option>
                  </select>
               </InputGroup>
               <div className="md:col-span-2">
                 <InputGroup label="Top Skills (Minimum 1)">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(Array.isArray(formData.skills) ? formData.skills : []).map((skill: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] px-3 py-1.5 rounded-full text-xs font-bold">
                          {skill}
                          <button type="button" onClick={() => {
                            const newSkills = [...formData.skills];
                            newSkills.splice(idx, 1);
                            setFormData({ ...formData, skills: newSkills });
                          }} className="hover:text-red-500 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
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
                        className="flex-1 bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all font-medium"
                        placeholder="Type a skill and press Enter or +"
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
                        className="bg-primary-600 text-white rounded-lg p-3 hover:bg-primary-700 transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                 </InputGroup>
               </div>
            </div>
          </ProfileSection>

          {/* 2. Experience */}
          <ModularSection 
            title="Experience" 
            icon={<Briefcase size={20} />} 
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
                key={exp.id} 
                exp={exp} 
                onUpdate={(f: any, v: any) => updateItem('experiences', exp.id, f, v)}
                onDelete={() => removeItem('experiences', exp.id)}
              />
            )}
            addButtonText="Add Experience"
          />

          {/* 3. Projects */}
          <ModularSection 
            title="Projects" 
            icon={<Layers size={20} />} 
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
                key={proj.id} 
                proj={proj}
                onUpdate={(f: any, v: any) => updateItem('projects', proj.id, f, v)}
                onDelete={() => removeItem('projects', proj.id)}
              />
            )}
            addButtonText="Add Project"
          />

          {/* 4. Profiles & Links */}
          <ProfileSection 
            title="Profiles & Links" 
            icon={<LinkIcon size={20} />} 
            isCollapsed={collapsed.links} 
            onToggle={() => toggleCollapse('links')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SocialInput icon={<Globe size={16}/>} placeholder="Portfolio Website" value={formData.portfolioUrl} onChange={(v:any) => setFormData({...formData, portfolioUrl: v})} />
              <SocialInput icon={<Github size={16}/>} placeholder="GitHub Profile" value={formData.githubUrl} onChange={(v:any) => setFormData({...formData, githubUrl: v})} />
              <SocialInput icon={<Linkedin size={16}/>} placeholder="LinkedIn Profile" value={formData.linkedinUrl} onChange={(v:any) => setFormData({...formData, linkedinUrl: v})} />
              <SocialInput icon={<Layers size={16}/>} placeholder="Behance" value={formData.behanceUrl} onChange={(v:any) => setFormData({...formData, behanceUrl: v})} />
              <SocialInput icon={<BookOpen size={16}/>} placeholder="ArtStation" value={formData.artstationUrl} onChange={(v:any) => setFormData({...formData, artstationUrl: v})} />
              <SocialInput icon={<LinkIcon size={16}/>} placeholder="Other Link" value={formData.otherUrl} onChange={(v:any) => setFormData({...formData, otherUrl: v})} />
            </div>
          </ProfileSection>

          {/* 5. Education */}
          <ModularSection 
            title="Education" 
            icon={<BookOpen size={20} />} 
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
                key={edu.id}
                edu={edu}
                onUpdate={(f:any, v:any) => updateItem('education', edu.id, f, v)}
                onDelete={() => removeItem('education', edu.id)}
              />
            )}
            addButtonText="Add Education"
          />

          {/* 6. Certifications */}
          <ModularSection 
            title="Certifications" 
            icon={<Award size={20} />} 
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
                key={cert.id}
                cert={cert}
                onUpdate={(f:any, v:any) => updateItem('certifications', cert.id, f, v)}
                onDelete={() => removeItem('certifications', cert.id)}
              />
            )}
            addButtonText="Add Certification"
          />

          {/* 7. Publications */}
          <ModularSection 
            title="Publications" 
            icon={<BookMarked size={20} />} 
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
                key={pub.id}
                pub={pub}
                onUpdate={(f:any, v:any) => updateItem('publications', pub.id, f, v)}
                onDelete={() => removeItem('publications', pub.id)}
              />
            )}
            addButtonText="Add Publication"
          />

          {/* Mandatory Agreement Section */}
          <div className="p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-primary-500" /> Declaration & Consent
            </h2>
            <div className="space-y-6">
               <label className="flex items-start gap-3 cursor-pointer">
                 <input 
                   type="checkbox" 
                   checked={formData.declarationAccepted} 
                   onChange={(e) => setFormData({ ...formData, declarationAccepted: e.target.checked })} 
                   className="mt-1 w-5 h-5 rounded border-[var(--border-main)] text-primary-600 focus:ring-primary-600 bg-[var(--bg-main)]" 
                 />
                 <span className="text-sm font-medium text-[var(--text-main)] leading-relaxed">
                   I confirm that the information provided in my profile is accurate and can be used for internship applications, job hiring evaluation, course enrollments, and professional communication purposes.
                 </span>
               </label>

               <div className="pt-4 border-t border-[var(--border-main)]">
                 <InputGroup label="Digital Signature (Type Full Name)">
                    <input 
                      type="text" 
                      value={formData.signature}
                      onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                      className="w-full md:w-1/2 bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all font-serif italic placeholder:not-italic"
                      placeholder="John Doe"
                    />
                 </InputGroup>
               </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 z-50 flex justify-center pb-6 pt-8 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)] to-transparent mt-4">
            <button 
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-primary-600 text-white rounded-full text-sm font-semibold flex items-center gap-3 shadow-xl hover:bg-primary-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:scale-105"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <><Save size={18} /> Save Profile</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function AdminProfileView({ formData, setFormData, handleImageUpload, handleUpdateProfile, loading, uploadingImage, profile }: any) {
  return (
    <div className="pt-32 pb-40 px-6 bg-[var(--bg-main)] min-h-screen">
      <div className="max-w-xl mx-auto p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl shadow-sm">
        
        <div className="flex flex-col items-center mb-8">
          <div className="relative group mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border border-[var(--border-main)] bg-[var(--bg-main)]">
              <img src={formData.photoURL || profile?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {uploadingImage && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Sparkles size={16} className="text-white animate-spin" /></div>}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-full shadow-md cursor-pointer hover:scale-110 transition-all">
              <Camera size={14} />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-main)]">{formData.displayName}</h2>
          <div className="px-3 py-1 mt-2 bg-primary-600/10 text-primary-600 rounded-md text-xs font-semibold">Administrator</div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <InputGroup label="Full Name">
            <input value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" />
          </InputGroup>
          <InputGroup label="Bio">
            <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all min-h-[80px]" placeholder="Brief overview..." />
          </InputGroup>
          <button disabled={loading} className="w-full bg-primary-600 text-white rounded-xl py-4 text-sm font-semibold mt-4 flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors">
            {loading ? "Saving..." : <><Save size={16} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProfileSection({ title, icon, children, isCollapsed, onToggle }: any) {
  return (
    <div className={`p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl transition-all ${isCollapsed ? 'hover:border-primary-500/30' : ''}`}>
      <button 
        type="button" 
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="text-[var(--text-muted)] group-hover:text-primary-500">
            {icon}
          </div>
          <h2 className="text-xl font-bold text-[var(--text-main)]">{title}</h2>
        </div>
        {isCollapsed ? <ChevronDown size={20} className="text-[var(--text-muted)]" /> : <ChevronUp size={20} className="text-[var(--text-muted)]" />}
      </button>
      
      {!isCollapsed && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

function ModularSection({ title, icon, items = [], isCollapsed, onToggle, onAdd, itemRenderer, addButtonText }: any) {
  const dataItems = Array.isArray(items) ? items : [];
  return (
    <ProfileSection title={title} icon={icon} isCollapsed={isCollapsed} onToggle={onToggle}>
      <div className="space-y-6">
        <AnimatePresence>
          {dataItems.map((item: any) => itemRenderer(item))}
        </AnimatePresence>
        
        <button 
          type="button" 
          onClick={onAdd}
          className="w-full py-4 border-2 border-dashed border-[var(--border-main)] bg-[var(--bg-main)]/50 rounded-xl flex items-center justify-center gap-2 text-[var(--text-muted)] hover:border-primary-500/50 hover:text-primary-500 transition-colors font-medium text-sm"
        >
          <Plus size={16} />
          {addButtonText}
        </button>
      </div>
    </ProfileSection>
  );
}

function ExperienceItem({ exp, onUpdate, onDelete }: any) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl relative group/item shadow-sm"
    >
      <button type="button" onClick={onDelete} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100 p-2"><Trash2 size={16} /></button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Role / Position">
          <input value={exp.role} onChange={(e) => onUpdate('role', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="Software Engineer" />
        </InputGroup>
        <InputGroup label="Company / Organization">
          <input value={exp.company} onChange={(e) => onUpdate('company', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="Acme Inc" />
        </InputGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <InputGroup label="Employment Type">
          <select value={exp.type} onChange={(e) => onUpdate('type', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all">
            {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </InputGroup>
        <InputGroup label="Location">
           <input value={exp.location} onChange={(e) => onUpdate('location', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="City, Country" />
        </InputGroup>
        <InputGroup label="Work Mode">
          <select value={exp.mode} onChange={(e) => onUpdate('mode', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all">
            {WORK_MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </InputGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Start Date">
          <div className="flex gap-2">
            <select value={exp.startMonth || ''} onChange={(e) => onUpdate('startMonth', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all">
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={exp.startYear || ''} onChange={(e) => onUpdate('startYear', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all">
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
        <InputGroup label="End Date">
          <div className="flex gap-2">
            <select value={exp.endMonth || ''} onChange={(e) => onUpdate('endMonth', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm disabled:opacity-50 focus:outline-none focus:border-primary-500 transition-all" disabled={exp.current}>
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={exp.endYear || ''} onChange={(e) => onUpdate('endYear', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm disabled:opacity-50 focus:outline-none focus:border-primary-500 transition-all" disabled={exp.current}>
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="mt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-muted)]">
              <input type="checkbox" checked={exp.current} onChange={(e) => onUpdate('current', e.target.checked)} className="rounded text-primary-600 focus:ring-primary-600 border-[var(--border-main)] bg-[var(--bg-card)]" />
              I currently work here
            </label>
          </div>
        </InputGroup>
      </div>
      
      <div className="mb-5">
         <InputGroup label="Skills Used (Comma separated)">
            <input value={exp.skills} onChange={(e) => onUpdate('skills', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="React, Node.js, TypeScript" />
         </InputGroup>
      </div>

      <InputGroup label="Description">
        <textarea value={exp.description} onChange={(e) => onUpdate('description', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:border-primary-500 transition-all" placeholder="Key responsibilities and achievements..." />
      </InputGroup>
    </motion.div>
  );
}

function ProjectItem({ proj, onUpdate, onDelete }: any) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl relative group/item shadow-sm"
    >
      <button type="button" onClick={onDelete} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100 p-2"><Trash2 size={16} /></button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Project Title">
          <input value={proj.title} onChange={(e) => onUpdate('title', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="Project Name" />
        </InputGroup>
        <InputGroup label="Category">
           <input value={proj.category} onChange={(e) => onUpdate('category', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="Web App, Mobile App, etc." />
        </InputGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Start Date">
          <div className="flex gap-2">
            <select value={proj.startMonth || ''} onChange={(e) => onUpdate('startMonth', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all">
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={proj.startYear || ''} onChange={(e) => onUpdate('startYear', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all">
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
        <InputGroup label="End Date">
          <div className="flex gap-2">
            <select value={proj.endMonth || ''} onChange={(e) => onUpdate('endMonth', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all">
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={proj.endYear || ''} onChange={(e) => onUpdate('endYear', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all">
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Status">
          <select value={proj.status} onChange={(e) => onUpdate('status', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all">
            {PROJECT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </InputGroup>
        <InputGroup label="Technologies Used">
           <input value={proj.technologies} onChange={(e) => onUpdate('technologies', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="React, Node, MongoDB" />
        </InputGroup>
      </div>

      <InputGroup label="Description">
        <textarea value={proj.description} onChange={(e) => onUpdate('description', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:border-primary-500 transition-all" placeholder="Brief project summary..." />
      </InputGroup>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        <SocialInput icon={<Github size={14}/>} placeholder="Repository Link" value={proj.githubUrl} onChange={(v:any) => onUpdate('githubUrl', v)} />
        <SocialInput icon={<Globe size={14}/>} placeholder="Demo URL" value={proj.demoUrl} onChange={(v:any) => onUpdate('demoUrl', v)} />
      </div>
    </motion.div>
  );
}

function EducationItem({ edu, onUpdate, onDelete }: any) {
  return (
    <motion.div layout className="p-6 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl relative group/item shadow-sm">
      <button type="button" onClick={onDelete} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-2"><Trash2 size={16} /></button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Institution Name">
          <input value={edu.institution} onChange={(e) => onUpdate('institution', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="University of Technology" />
        </InputGroup>
        <InputGroup label="Degree / Course">
          <input value={edu.degree} onChange={(e) => onUpdate('degree', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="Bachelor of Science" />
        </InputGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <InputGroup label="Department / Major">
           <input value={edu.department} onChange={(e) => onUpdate('department', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="Computer Science" />
        </InputGroup>
        <InputGroup label="Start Year">
           <select value={edu.startYear || ''} onChange={(e) => onUpdate('startYear', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all">
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
           </select>
        </InputGroup>
        <InputGroup label="End Year">
           <select value={edu.endYear || ''} onChange={(e) => onUpdate('endYear', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm disabled:opacity-50 focus:outline-none focus:border-primary-500 transition-all" disabled={edu.current}>
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
           </select>
           <div className="mt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-muted)]">
              <input type="checkbox" checked={edu.current} onChange={(e) => onUpdate('current', e.target.checked)} className="rounded text-primary-600 focus:ring-primary-600 border-[var(--border-main)] bg-[var(--bg-card)]" />
              Current Student
            </label>
           </div>
        </InputGroup>
      </div>
    </motion.div>
  );
}

function CertificationItem({ cert, onUpdate, onDelete }: any) {
  return (
    <motion.div layout className="p-6 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl relative group/item shadow-sm">
      <button type="button" onClick={onDelete} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-2"><Trash2 size={16} /></button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Certification Name">
          <input value={cert.name} onChange={(e) => onUpdate('name', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="AWS Certified Architect" />
        </InputGroup>
        <InputGroup label="Issuing Organization">
          <input value={cert.org} onChange={(e) => onUpdate('org', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="Amazon Web Services" />
        </InputGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputGroup label="Issue Date">
          <div className="flex gap-2">
            <select value={cert.issueMonth || ''} onChange={(e) => onUpdate('issueMonth', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all">
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={cert.issueYear || ''} onChange={(e) => onUpdate('issueYear', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all">
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
        <InputGroup label="Credential URL">
          <input value={cert.url} onChange={(e) => onUpdate('url', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="https://..." />
        </InputGroup>
      </div>
    </motion.div>
  );
}

function PublicationItem({ pub, onUpdate, onDelete }: any) {
  return (
    <motion.div layout className="p-6 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl relative group/item shadow-sm">
      <button type="button" onClick={onDelete} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-2"><Trash2 size={16} /></button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <InputGroup label="Title">
          <input value={pub.title} onChange={(e) => onUpdate('title', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="Research paper or article title" />
        </InputGroup>
        <InputGroup label="Publisher">
          <input value={pub.publisher} onChange={(e) => onUpdate('publisher', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="Journal, Medium, etc." />
        </InputGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputGroup label="Date">
          <div className="flex gap-2">
            <select value={pub.dateMonth || ''} onChange={(e) => onUpdate('dateMonth', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all">
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={pub.dateYear || ''} onChange={(e) => onUpdate('dateYear', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all">
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </InputGroup>
        <InputGroup label="URL">
          <input value={pub.url} onChange={(e) => onUpdate('url', e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 transition-all" placeholder="https://..." />
        </InputGroup>
      </div>
    </motion.div>
  );
}

function InputGroup({ label, children }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function SocialInput({ icon, value, onChange, placeholder }: any) {
  return (
    <div className="relative group flex items-center">
       <div className="absolute left-4 text-[var(--text-muted)]">
          {icon}
       </div>
       <input 
         type="text"
         value={value}
         onChange={(e) => onChange(e.target.value)}
         placeholder={placeholder}
         className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary-500 transition-all"
       />
    </div>
  );
}
