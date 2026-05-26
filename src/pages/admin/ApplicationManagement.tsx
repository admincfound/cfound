import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, getDocs, doc, updateDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CheckCircle2, XCircle, Clock, Eye, Mail, Phone, ExternalLink, Github, Linkedin, User, Activity, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ApplicationManagement() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const internshipsReq = getDocs(query(collection(db, 'internshipApplications'), orderBy('createdAt', 'desc')));
      const jobsReq = getDocs(query(collection(db, 'applications'), orderBy('createdAt', 'desc')));
      const coursesReq = getDocs(query(collection(db, 'courseEnrollments'), orderBy('appliedAt', 'desc')));

      const [internshipsSnap, jobsSnap, coursesSnap] = await Promise.all([internshipsReq, jobsReq, coursesReq]);

      const data: any[] = [];
      internshipsSnap.docs.forEach(doc => data.push({ id: doc.id, _collection: 'internshipApplications', ...doc.data() }));
      jobsSnap.docs.forEach(doc => data.push({ id: doc.id, _collection: 'applications', ...doc.data() }));
      coursesSnap.docs.forEach(doc => data.push({ id: doc.id, _collection: 'courseEnrollments', ...doc.data() }));

      data.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.appliedAt).getTime();
        const timeB = new Date(b.createdAt || b.appliedAt).getTime();
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
        reviewedAt: new Date().toISOString()
      });
      setApplications(apps => apps.map(app => app.id === appId ? { ...app, status: newStatus } : app));
      if (selectedApp?.id === appId) setSelectedApp({ ...selectedApp, status: newStatus });
      toast.success(`Candidate ${newStatus === 'accepted' ? 'authorized' : 'denied'}.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
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
      toast.success("Record purged successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Access denied: Could not purge record.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="pt-16 pb-32 px-6 min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-20 border-b border-[var(--border-main)] pb-12">
          <div>
            <span className="text-primary-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">Candidate Review</span>
            <h1 className="text-5xl md:text-7xl font-black font-display tracking-tight text-[var(--text-main)] uppercase italic">Intake <span className="text-primary-600">Queue.</span></h1>
            <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-2">{applications.length} Records in pipeline</p>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] bg-[var(--bg-card)] border border-[var(--border-main)] px-8 py-4 rounded-2xl shadow-xl italic">
            Management Console
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Applications List */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              [1, 2, 3, 4].map(n => <div key={n} className="h-32 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] animate-pulse" />)
            ) : applications.length > 0 ? (
              applications.map((app) => (
                <motion.div 
                  layout
                  key={app.id} 
                  onClick={() => setSelectedApp(app)}
                  className={`p-8 bg-[var(--bg-card)] border rounded-[3rem] flex items-center justify-between cursor-pointer transition-all hover:border-primary-600/30 shadow-xl group ${selectedApp?.id === app.id ? 'border-primary-600 ring-8 ring-primary-600/5' : 'border-[var(--border-main)]'}`}
                >
                  <div className="flex items-center gap-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary-600/10 flex items-center justify-center font-black text-xl text-primary-600 border border-primary-600/20 shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-all">{app.userName?.[0]}</div>
                    <div>
                      <h4 className="font-black text-sm text-[var(--text-main)] mb-1 uppercase italic tracking-tight">{app.userName}</h4>
                      <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] opacity-60">Target: {app.targetTitle} // {app.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                      app.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {app.status}
                    </span>
                    <button className="p-4 text-[var(--text-muted)] hover:text-primary-600 transition-all bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-2xl shadow-lg hover:scale-110 active:scale-95"><Eye size={18}/></button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-24 px-12 text-center border-2 border-dashed border-[var(--border-main)] rounded-[3rem] bg-[var(--bg-card)]/30 group">
                <div className="w-16 h-16 bg-[var(--bg-main)] rounded-2xl mx-auto flex items-center justify-center mb-6 border border-[var(--border-main)] shadow-sm group-hover:scale-110 transition-transform">
                  <Activity size={24} className="text-[var(--text-muted)] opacity-40" />
                </div>
                <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.2em] mb-2 italic">Pipeline Clear</h3>
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-relaxed opacity-60">No pending applications detected in the current session.</p>
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="relative">
            <div className="sticky top-32">
              {selectedApp ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-10 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-primary-600 font-display font-black text-[15rem] pointer-events-none group-hover:scale-110 transition-transform duration-1000 uppercase">A</div>
                  <div className="flex items-center gap-6 mb-12 relative z-10">
                    <div className="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-[0_20px_40px_-10px_rgba(147,51,234,0.3)] italic">
                      {selectedApp.userName?.[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] mb-1 uppercase italic">{selectedApp.userName}</h3>
                      <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest opacity-60">Session Ref: {selectedApp.id.slice(0, 8)}</p>
                    </div>
                  </div>

                  <div className="absolute top-6 right-6 flex gap-2 z-20">
                    <button 
                      onClick={() => handleDelete(selectedApp.id, selectedApp._collection)}
                      disabled={updating === selectedApp.id}
                      className={`p-3 border rounded-xl transition-all shadow-xl group/del ${deletingId === selectedApp.id ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/30'}`}
                      title={deletingId === selectedApp.id ? "Confirm Purge" : "Purge Record"}
                    >
                      <Trash2 size={16} className={`transition-transform ${deletingId === selectedApp.id ? 'animate-bounce' : 'group-hover/del:scale-110'}`} />
                    </button>
                  </div>

                  <div className="space-y-8 mb-12 relative z-10">
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
                  </div>

                  <div className="pt-10 border-t border-[var(--border-main)] space-y-8 relative z-10">
                     <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] opacity-60 italic">CANDIDATE INTELLIGENCE</p>
                     
                     <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl flex items-center gap-3">
                           <Mail size={16} className="text-primary-600" />
                           <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] truncate">{selectedApp.userEmail}</div>
                        </div>
                        <div className="p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl flex items-center gap-3">
                           <Phone size={16} className="text-primary-600" />
                           <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">{selectedApp.phone || 'N/A'}</div>
                        </div>
                     </div>

                     {/* Skills */}
                     {selectedApp.skills && selectedApp.skills.length > 0 && (
                       <div className="mb-6">
                         <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] mb-3 opacity-60">ARSENAL PROTOCOLS</p>
                         <div className="flex flex-wrap gap-2">
                            {selectedApp.skills.map((s: string) => (
                              <span key={s} className="px-3 py-1 bg-primary-600 text-white rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-sm">{s}</span>
                            ))}
                         </div>
                       </div>
                     )}

                     {/* Links */}
                     <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em] opacity-60 italic">PROFESSIONAL FOOTPRINT</p>
                     <div className="grid grid-cols-2 gap-4">
                        {selectedApp.portfolioUrl && (
                           <a href={selectedApp.portfolioUrl} target="_blank" rel="noopener noreferrer" className="p-5 bg-[var(--bg-main)] border border-[var(--border-main)] hover:border-primary-600/30 text-[var(--text-muted)] hover:text-primary-600 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl hover:scale-105 active:scale-95 group/btn">
                              <ExternalLink size={18} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Portfolio</span>
                           </a>
                        )}
                        {selectedApp.resumeUrl ? (
                           <a href={selectedApp.resumeUrl} target="_blank" rel="noopener noreferrer" className="p-5 bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl hover:scale-105 active:scale-95 group/btn">
                              <ExternalLink size={18} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Decrypted Resume</span>
                           </a>
                        ) : (
                           <div className="p-5 bg-[var(--bg-main)] border border-[var(--border-main)] border-dashed text-[var(--text-muted)] opacity-50 rounded-2xl flex items-center justify-center gap-3">
                              <XCircle size={18} />
                              <span className="text-[10px] font-black uppercase tracking-widest">No Resume</span>
                           </div>
                        )}
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
