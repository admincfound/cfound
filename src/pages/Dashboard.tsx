import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  User, Settings, LogOut, ChevronRight, Plus, Trash2, ExternalLink, Github, Linkedin, Globe, ShieldCheck, Briefcase, BookOpen, Activity, Clock, ArrowRight, Layout, Layers, Gamepad2, Trophy, Zap, MapPin, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const { user, profile, isAdmin } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUserApplications();
    }
  }, [user]);

  const fetchUserApplications = async () => {
    setLoading(true);
    try {
      const qInternships = query(
        collection(db, 'internshipApplications'),
        where('userId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      );
      const qJobs = query(
        collection(db, 'jobApplications'),
        where('userId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      );
      const qAcademy = query(
        collection(db, 'courseEnrollments'),
        where('userId', '==', user?.uid),
        orderBy('appliedAt', 'desc')
      );
      
      const [internSnap, jobSnap, academySnap] = await Promise.all([
        getDocs(qInternships),
        getDocs(qJobs),
        getDocs(qAcademy)
      ]);

      const internApps = internSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), category: 'Internship' }));
      const jobApps = jobSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), category: 'Job' }));
      const academyApps = academySnap.docs.map(doc => ({ id: doc.id, ...doc.data(), category: 'Academy' }));

      const allApps = [...internApps, ...jobApps, ...academyApps].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.appliedAt).getTime();
        const dateB = new Date(b.createdAt || b.appliedAt).getTime();
        return dateB - dateA;
      });

      setApplications(allApps);
    } catch (err) {
      console.error("Dashboard error:", err);
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
      case 'enrolled': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'rejected': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'reviewed': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Internship': return <Briefcase size={16} className="text-blue-500" />;
      case 'Job': return <Zap size={16} className="text-green-500" />;
      case 'Academy': return <BookOpen size={16} className="text-purple-500" />;
      default: return <Activity size={16} />;
    }
  };

  const filteredApps = activeTab === 'All' 
    ? applications 
    : applications.filter(a => a.category === activeTab);

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Sidebar - Profile Summary */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3rem] shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck size={120} className="text-primary-600" />
              </div>
              
              <div className="relative z-10">
                <div className="mb-8 relative inline-block">
                  <img 
                    src={user?.photoURL || ''} 
                    alt="" 
                    className="w-24 h-24 rounded-[2rem] object-cover border-2 border-primary-600/30 p-1 bg-[var(--bg-main)]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-2 -right-2 p-2 bg-primary-600 text-white rounded-xl shadow-lg border-2 border-[var(--bg-main)]">
                    <Trophy size={14} />
                  </div>
                </div>
                
                <h1 className="text-3xl font-black font-display text-[var(--text-main)] mb-2 tracking-tight uppercase italic">{profile?.displayName}</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-8 opacity-60 flex items-center gap-2">
                  <Activity size={12} className="text-primary-600 animate-pulse" /> Signal Active / Identity Verified
                </p>

                <div className="space-y-3">
                  <Link to="/profile" className="w-full flex items-center justify-between p-5 bg-[var(--bg-main)] hover:bg-primary-600 hover:text-white border border-[var(--border-main)] rounded-2xl transition-all group/btn shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                       <Settings size={14} /> Modify Profile
                    </span>
                    <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="w-full flex items-center justify-between p-5 bg-primary-600 text-white border border-primary-500 rounded-2xl transition-all group/btn shadow-xl shadow-primary-600/20">
                      <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                        <ShieldCheck size={14} /> Admin Dashboard
                      </span>
                      <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-8 space-y-12">
            {/* Header Stats */}
            <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
               <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl shadow-sm text-center group hover:border-blue-500/30 transition-all">
                  <div className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-2 opacity-60">Internships</div>
                  <div className="text-3xl font-black font-display italic text-blue-500">{internsCount}</div>
               </div>
               <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl shadow-sm text-center group hover:border-green-500/30 transition-all">
                  <div className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-2 opacity-60">Jobs</div>
                  <div className="text-3xl font-black font-display italic text-green-500">{jobsCount}</div>
               </div>
               <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl shadow-sm text-center group hover:border-purple-500/30 transition-all">
                  <div className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-2 opacity-60">Academy</div>
                  <div className="text-3xl font-black font-display italic text-purple-500">{academyCount}</div>
               </div>
               <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl shadow-sm text-center group hover:border-yellow-500/30 transition-all">
                  <div className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-2 opacity-60">Pending</div>
                  <div className="text-3xl font-black font-display italic text-yellow-500">{pending}</div>
               </div>
               <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl shadow-sm text-center group hover:border-green-500/50 transition-all">
                  <div className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-2 opacity-60">Accepted</div>
                  <div className="text-3xl font-black font-display italic text-green-600">{accepted}</div>
               </div>
            </section>

            {/* Application Pipeline */}
            <section>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                 <h2 className="text-3xl font-black font-display uppercase italic tracking-tighter text-[var(--text-main)] shrink-0">My <span className="text-primary-600">Pipeline.</span></h2>
                 
                 <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-main)] p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
                   {['All', 'Internship', 'Job', 'Academy'].map((tab) => (
                     <button
                       key={tab}
                       onClick={() => setActiveTab(tab)}
                       className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                         activeTab === tab 
                         ? 'bg-primary-600 text-white shadow-lg' 
                         : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                       }`}
                     >
                       {tab}
                     </button>
                   ))}
                 </div>
              </div>

              <div className="space-y-6">
                 {loading ? (
                    <div className="p-20 text-center animate-pulse text-[var(--text-muted)] font-black text-[10px] uppercase tracking-[0.3em] bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem]">Loading Records...</div>
                 ) : filteredApps.length === 0 ? (
                    <div className="p-24 text-center bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem]">
                      <Briefcase size={48} className="mx-auto text-[var(--text-muted)] mb-6 opacity-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-8 opacity-60">
                        {activeTab === 'All' ? 'No applications found.' : `No ${activeTab.toLowerCase()} applications found.`}
                      </p>
                      <Link 
                        to={activeTab === 'Academy' ? '/courses' : activeTab === 'Job' ? '/careers' : '/internship'} 
                        className="btn-primary inline-flex"
                      >
                        Explore {activeTab === 'All' ? 'Openings' : `${activeTab}s`}
                      </Link>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredApps.map((app) => (
                        <motion.div 
                          layout
                          key={app.id} 
                          className="group bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] p-6 hover:border-primary-600/30 transition-all flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
                        >
                          <div className={`absolute top-0 left-0 w-1 h-full ${
                             app.category === 'Internship' ? 'bg-blue-500' :
                             app.category === 'Job' ? 'bg-green-500' : 'bg-purple-500'
                          }`} />
                          
                          <div className="flex items-center gap-6 flex-1 w-full">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                               app.category === 'Internship' ? 'bg-blue-500/10' :
                               app.category === 'Job' ? 'bg-green-500/10' : 'bg-purple-500/10'
                            }`}>
                              {getCategoryIcon(app.category)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-3 mb-1">
                                 <h3 className="text-lg font-black uppercase italic tracking-tighter text-[var(--text-main)] truncate">{app.targetTitle || app.jobTitle || 'Opportunity'}</h3>
                                 <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${getStatusColor(app.status)}`}>
                                   {app.status}
                                 </span>
                               </div>
                               <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-4">
                                  <span className="flex items-center gap-1.5"><Briefcase size={12} className="opacity-50" /> C FOUND</span>
                                  <span className="flex items-center gap-1.5"><Clock size={12} className="opacity-50" /> {new Date(app.createdAt || app.appliedAt).toLocaleDateString()}</span>
                               </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
                             <button 
                               onClick={() => setSelectedApp(app)}
                               className="flex-1 md:flex-none text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-white bg-primary-600/10 hover:bg-primary-600 px-6 py-3 rounded-xl transition-all"
                             >
                               View Details
                             </button>
                             <div className={`hidden md:block w-10 h-10 rounded-full border border-[var(--border-main)] flex items-center justify-center group-hover:border-primary-600/30 transition-all`}>
                               <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:text-primary-600 transition-colors" />
                             </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                 )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedApp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-start mb-8 pb-6 border-b border-[var(--border-main)]">
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">{selectedApp.targetTitle || selectedApp.jobTitle || 'Not Available'}</h3>
                  <p className="text-[var(--text-muted)] font-medium text-sm flex items-center gap-2 uppercase tracking-widest text-[9px]">
                    {getCategoryIcon(selectedApp.category)} C FOUND &bull; {selectedApp.category || 'Opportunity'}
                  </p>
                </div>
                <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Current Status</h4>
                    <span className={`inline-flex px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusColor(selectedApp.status)}`}>
                       {selectedApp.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Applied Date</h4>
                    <span className="text-sm font-medium text-[var(--text-main)]">
                      {new Date(selectedApp.createdAt || selectedApp.appliedAt).toLocaleDateString()} at {new Date(selectedApp.createdAt || selectedApp.appliedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Full Description</h4>
                    <p className="text-sm font-medium text-[var(--text-main)]">{selectedApp.description || 'Description not available for this role.'}</p>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedApp.skills || ['Not Available']).map((skill: string, i: number) => (
                        <span key={i} className="px-2 py-1 text-xs bg-[var(--bg-hover)] border border-[var(--border-main)] rounded-md font-bold">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedApp.hrRemarks && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-2">HR Remarks</h4>
                    <p className="text-sm font-medium text-blue-100">{selectedApp.hrRemarks}</p>
                  </div>
                )}

                {selectedApp.interviewDetails && (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-purple-500 mb-2">Interview Details</h4>
                    <p className="text-sm font-medium text-purple-100 whitespace-pre-wrap">{selectedApp.interviewDetails}</p>
                  </div>
                )}
                
                {selectedApp.rejectionReason && selectedApp.status === 'rejected' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-2">Feedback</h4>
                    <p className="text-sm font-medium text-red-100">{selectedApp.rejectionReason}</p>
                  </div>
                )}

                <div className="pt-6 border-t border-[var(--border-main)]">
                   <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">Activity Timeline</h4>
                   <div className="relative border-l-2 border-[var(--border-main)] ml-3 space-y-6">
                      <div className="relative pl-6">
                         <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary-600 border-4 border-[var(--bg-card)]"></div>
                         <h5 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] mb-1">Applied for {selectedApp.category}</h5>
                         <p className="text-xs text-[var(--text-muted)]">{new Date(selectedApp.createdAt || selectedApp.appliedAt).toLocaleDateString()}</p>
                      </div>
                      
                      {selectedApp.status === 'reviewed' || selectedApp.status === 'accepted' || selectedApp.hrRemarks ? (
                        <div className="relative pl-6">
                           <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-[var(--bg-card)]"></div>
                           <h5 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] mb-1">HR Reviewed Profile</h5>
                           <p className="text-xs text-[var(--text-muted)]">Application marked as reviewed</p>
                        </div>
                      ) : null}

                      {selectedApp.interviewDetails && (
                        <div className="relative pl-6">
                           <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-purple-500 border-4 border-[var(--bg-card)]"></div>
                           <h5 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] mb-1">Interview Scheduled</h5>
                           <p className="text-xs text-[var(--text-muted)]">Interview details shared</p>
                        </div>
                      )}

                      {selectedApp.status === 'accepted' && (
                        <div className="relative pl-6">
                           <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-4 border-[var(--bg-card)]"></div>
                           <h5 className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-1">Selected</h5>
                           <p className="text-xs text-green-500/70">Offer extended / Accepted</p>
                        </div>
                      )}

                      {selectedApp.status === 'rejected' && (
                        <div className="relative pl-6">
                           <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-red-500 border-4 border-[var(--bg-card)]"></div>
                           <h5 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Rejected</h5>
                           <p className="text-xs text-red-500/70">Application closed</p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="pt-6 border-t border-[var(--border-main)]">
                   <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">Applicant Data Submitted</h4>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[var(--text-muted)] block text-xs">Email:</span>
                        <span className="font-medium">{selectedApp.email}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block text-xs">Phone:</span>
                        <span className="font-medium">{selectedApp.phone || 'N/A'}</span>
                      </div>
                      {selectedApp.resume_url && selectedApp.resume_url !== 'N/A' && (
                        <div className="col-span-2">
                          <a href={selectedApp.resume_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-400 font-bold text-sm bg-primary-500/10 px-4 py-2 rounded-lg transition-colors">
                            <ExternalLink size={16} /> View Submitted Resume
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

