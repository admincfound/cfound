import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getProfileCompletion } from '../../lib/profileUtils';
import { 
  Search, 
  Filter, 
  User, 
  ExternalLink, 
  FileText, 
  Github, 
  Linkedin, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  X,
  CheckCircle2
} from 'lucide-react';
import { ROLES, SKILLS } from '../../constants/profile';

export default function UserLookup() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), limit(50));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || user.targetRole === selectedRole;
    const matchesSkill = !selectedSkill || user.skills?.includes(selectedSkill);
    return matchesSearch && matchesRole && matchesSkill;
  });

  return (
    <div className="pt-16 pb-32 px-6 min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-20">
          <div>
            <span className="text-primary-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">Talent Acquisition</span>
            <h1 className="text-5xl md:text-7xl font-black font-display tracking-tight text-[var(--text-main)] uppercase italic">Personnel <span className="text-primary-600">Database.</span></h1>
            <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-2">{filteredUsers.length} Identified Entities</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative group min-w-[300px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-hover:text-primary-600 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search Identity / Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl pl-16 pr-6 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary-600 transition-all shadow-xl"
              />
            </div>
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary-600 shadow-xl"
            >
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select 
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary-600 shadow-xl"
            >
              <option value="">All Arsenal Protocols</option>
              {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            [1, 2, 3, 4, 5, 6, 7, 8].map(n => <div key={n} className="h-48 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] animate-pulse" />)
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
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
                  <img src={user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=neutral'} alt="" className="w-14 h-14 rounded-2xl bg-[var(--bg-main)] object-cover border border-primary-600/20" />
                  <div>
                    <h3 className="font-black text-sm text-[var(--text-main)] uppercase italic tracking-tight">{user.displayName || 'Anonymous'}</h3>
                    <p className="text-[9px] text-primary-500 font-black uppercase tracking-[0.2em] mb-1">{user.targetRole || 'Civilian'}</p>
                    <div className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">Profile Comp: {getProfileCompletion(user).percentage}%</div>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  {user.city && (
                    <div className="flex items-center gap-3 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest italic">
                      <MapPin size={12} className="text-primary-600" /> {user.city}, {user.state}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest italic">
                    <Briefcase size={12} className="text-primary-600" /> {user.experienceLevel || 'Beginner'} Level
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 opacity-60">
                   {user.skills?.slice(0, 3).map((s: string) => (
                     <span key={s} className="px-2 py-0.5 bg-primary-600/5 text-primary-600 rounded text-[7px] font-black uppercase tracking-tighter border border-primary-600/10">{s}</span>
                   ))}
                   {(user.skills?.length || 0) > 3 && <span className="text-[7px] font-black uppercase tracking-tighter opacity-40">+{user.skills.length - 3}</span>}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-[var(--border-main)] rounded-[4rem] bg-[var(--bg-card)]/20">
               <X size={48} className="mx-auto mb-6 text-red-500 opacity-20" />
               <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">No Target Identified</p>
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
              <div className="p-12">
                <div className="flex items-center justify-between mb-16">
                   <div className="flex items-center gap-8">
                     <img src={selectedUser.photoURL} alt="" className="w-24 h-24 rounded-[2rem] border-4 border-primary-600/20" />
                     <div>
                        <h2 className="text-4xl font-black font-display uppercase italic text-[var(--text-main)] mb-2">{selectedUser.displayName}</h2>
                        <div className="flex gap-4">
                           <span className="px-4 py-1.5 bg-primary-600 text-[9px] font-black uppercase tracking-widest text-white rounded-lg italic">Talent Asset</span>
                           <span className="px-4 py-1.5 bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-main)] text-[9px] font-black uppercase tracking-widest rounded-lg italic">{selectedUser.id.slice(0, 10).toUpperCase()}</span>
                        </div>
                     </div>
                   </div>
                   <button onClick={() => setSelectedUser(null)} className="p-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl hover:text-red-500 transition-all hover:rotate-90">
                     <X size={24}/>
                   </button>
                </div>

                <div className="mb-12 p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-4">Profile Compliance</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        {(() => {
                           const comp = getProfileCompletion(selectedUser);
                           return (
                             <>
                               <div className="text-2xl font-black text-primary-600">{comp.percentage}%</div>
                               <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Completion Level</div>
                               {!comp.isComplete && (
                                  <div className="mt-2 text-[9px] text-red-500 font-bold">Missing: {comp.missing.join(', ')}</div>
                               )}
                             </>
                           );
                        })()}
                      </div>
                      <div>
                        {selectedUser.declarationAccepted ? (
                           <div className="text-emerald-500 font-bold text-sm uppercase flex items-center gap-2"><CheckCircle2 size={16}/> Accepted</div>
                        ) : (
                           <div className="text-red-500 font-bold text-sm uppercase flex items-center gap-2"><X size={16}/> Pending</div>
                        )}
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">Declaration & Consent</div>
                      </div>
                      <div>
                        {selectedUser.signature ? (
                           <div className="text-emerald-500 font-bold text-sm flex items-center gap-2 font-serif italic"><CheckCircle2 size={16}/> {selectedUser.signature}</div>
                        ) : (
                           <div className="text-red-500 font-bold text-sm uppercase flex items-center gap-2"><X size={16}/> Missing</div>
                        )}
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">Digital Signature</div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
                   <div className="space-y-8">
                      <DetailCard title="Primary Core" icon={<Briefcase size={16}/>}>
                         <div className="text-sm font-black text-[var(--text-main)] uppercase italic tracking-widest mb-1">{selectedUser.targetRole || 'Not Specified'}</div>
                         <div className="text-[10px] font-black text-primary-500 uppercase tracking-widest opacity-60">Experience: {selectedUser.experienceLevel || 'Beginner'}</div>
                      </DetailCard>
                      <DetailCard title="Connect Intel" icon={<Mail size={16}/>}>
                         <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                           <Mail size={12} className="text-primary-600" /> {selectedUser.email}
                         </div>
                         <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                           <Phone size={12} className="text-primary-600" /> {selectedUser.phone || 'No Comms'}
                         </div>
                      </DetailCard>
                   </div>
                   <div className="space-y-8">
                      <DetailCard title="Arsenal protocols (Skills)" icon={<Layers size={16}/>}>
                         <div className="flex flex-wrap gap-2">
                           {selectedUser.skills?.map((s: string) => (
                             <span key={s} className="px-3 py-1 bg-primary-600 text-white rounded-lg text-[8px] font-black uppercase tracking-tighter">{s}</span>
                           ))}
                         </div>
                      </DetailCard>
                      {selectedUser.resumeUrl && (
                        <a href={selectedUser.resumeUrl} target="_blank" rel="noopener noreferrer" className="block p-8 bg-emerald-600/10 border border-emerald-600/20 rounded-[2rem] group/res hover:bg-emerald-600 transition-all">
                           <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 group-hover/res:text-white mb-2">Decrypted Resume</h4>
                                <p className="text-[9px] font-bold text-emerald-600/60 group-hover/res:text-white/60 uppercase italic tracking-widest">{selectedUser.resumeName || 'Master_CV.pdf'}</p>
                              </div>
                              <FileText size={20} className="text-emerald-600 group-hover/res:text-white group-hover/res:scale-125 transition-all" />
                           </div>
                        </a>
                      )}
                   </div>
                </div>

                <div className="space-y-12 mb-20">
                   <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[var(--text-muted)] pl-2 opacity-60 italic border-l-2 border-primary-600">Operational Log (Experience)</h3>
                   <div className="space-y-6">
                      {selectedUser.experiences?.map((exp: any, i: number) => (
                        <div key={i} className="p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3rem] relative overflow-hidden group/exp">
                           <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-black text-[var(--text-main)] uppercase italic tracking-tight">{exp.role} @ {exp.company}</h4>
                              <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest">{exp.type}</span>
                           </div>
                           <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest italic mb-6 opacity-60">
                             {exp.startDate} — {exp.current ? 'ACTIVE ENGAGEMENT' : exp.endDate} // {exp.mode}
                           </p>
                           <p className="text-xs font-medium text-[var(--text-muted)] leading-relaxed italic border-l border-[var(--border-main)] pl-6">
                             {exp.description}
                           </p>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-12">
                   <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[var(--text-muted)] pl-2 opacity-60 italic border-l-2 border-primary-600">Archive Entries (Projects)</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedUser.projects?.map((proj: any, i: number) => (
                        <div key={i} className="p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] group/proj">
                           <h4 className="text-sm font-black text-[var(--text-main)] uppercase italic tracking-tight mb-2">{proj.title} <span className="text-[8px] opacity-40 ml-2">// {proj.status}</span></h4>
                           <p className="text-[9px] font-bold text-[var(--text-muted)] leading-relaxed uppercase tracking-widest mb-6 opacity-60 truncate">{proj.description}</p>
                           <div className="flex gap-3">
                              {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-[var(--bg-main)] rounded-xl text-[var(--text-muted)] hover:text-primary-600 transition-all"><Github size={14}/></a>}
                              {proj.demoUrl && <a href={proj.demoUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-[var(--bg-main)] rounded-xl text-[var(--text-muted)] hover:text-primary-600 transition-all"><Globe size={14}/></a>}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="mt-20 pt-10 border-t border-[var(--border-main)]">
                   <div className="flex items-center justify-between">
                      <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-40">Identity Footprint Validated</div>
                      <div className="flex gap-4">
                        {selectedUser.linkedinUrl && <a href={selectedUser.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-primary-600"><Linkedin size={18}/></a>}
                        {selectedUser.githubUrl && <a href={selectedUser.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-primary-600"><Github size={18}/></a>}
                        {selectedUser.portfolioUrl && <a href={selectedUser.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-primary-600"><Globe size={18}/></a>}
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
