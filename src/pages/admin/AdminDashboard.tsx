import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, getDocs, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Users, 
  Briefcase, 
  Layers, 
  TrendingUp, 
  Bell, 
  Settings,
  ShieldCheck,
  Activity,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ users: 0, applications: 0, projects: 0, posts: 0 });
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const chartData = [
    { name: 'Mon', apps: 4 },
    { name: 'Tue', apps: 7 },
    { name: 'Wed', apps: 5 },
    { name: 'Thu', apps: 8 },
    { name: 'Fri', apps: 12 },
    { name: 'Sat', apps: 6 },
    { name: 'Sun', apps: 9 },
  ];

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [usersSnap, projectsSnap, postsSnap, internshipsSnap, jobsSnap, coursesSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'projects')),
          getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(3))),
          getDocs(query(collection(db, 'internshipApplications'), orderBy('createdAt', 'desc'), limit(5))),
          getDocs(query(collection(db, 'applications'), orderBy('createdAt', 'desc'), limit(5))),
          getDocs(query(collection(db, 'courseEnrollments'), orderBy('appliedAt', 'desc'), limit(5)))
        ]);

        const allApps = [
          ...internshipsSnap.docs.map(d => ({ id: d.id, _collection: 'internshipApplications', ...d.data() })),
          ...jobsSnap.docs.map(d => ({ id: d.id, _collection: 'applications', ...d.data() })),
          ...coursesSnap.docs.map(d => ({ id: d.id, _collection: 'courseEnrollments', ...d.data() }))
        ];

        allApps.sort((a, b) => {
          const timeA = new Date((a as any).createdAt || (a as any).appliedAt).getTime();
          const timeB = new Date((b as any).createdAt || (b as any).appliedAt).getTime();
          return timeB - timeA;
        });

        // For dashboard total stats, counting these can be slow if big, but for now we sum the sizes of recent limits. 
        // Oh wait, for total we might need true sizes. But let's just use what we have or do full fetch if need exact size.
        // Or we can just sum the snapshot sizes. But wait, we limited them.
        // Let's do a fast count using a normal getDocs for sizing.
        const [size1, size2, size3] = await Promise.all([
          getDocs(collection(db, 'internshipApplications')),
          getDocs(collection(db, 'applications')),
          getDocs(collection(db, 'courseEnrollments'))
        ]);

        setStats({
          users: usersSnap.size,
          applications: size1.size + size2.size + size3.size,
          projects: projectsSnap.size,
          posts: postsSnap.size,
        });

        setRecentApps(allApps.slice(0, 5));
        setRecentPosts(postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  return (
    <div className="pt-16 pb-32 px-6 min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 text-primary-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-3">
              Admin Access / Command Center
            </div>
            <h1 className="text-4xl md:text-7xl font-black font-display tracking-tight text-[var(--text-main)] mb-2 uppercase italic">
              Dashboard <span className="text-primary-500">Overview.</span>
            </h1>
            <p className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-widest">Logged in as: {profile?.displayName || 'Administrator'}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-wrap gap-4"
          >
             <Link to="/admin/api-settings" className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] font-bold px-8 py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shadow-2xl group">
               <Settings size={14} className="group-hover:rotate-90 transition-transform" /> System Config
             </Link>
             <Link to="/admin/applications" className="btn-primary px-8 py-4 flex items-center gap-2">
               <Briefcase size={14} /> Intake Queue
             </Link>
          </motion.div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
           <AdminStatCard icon={<Users size={20} />} label="Total Members" value={stats.users} color="text-primary-500" />
           <AdminStatCard icon={<Briefcase size={20} />} label="Active Funnel" value={stats.applications} color="text-primary-500" />
           <AdminStatCard icon={<Layers size={20} />} label="Live Projects" value={stats.projects} color="text-primary-500" />
           <AdminStatCard icon={<GraduationCap size={20} />} label="Journal Entries" value={stats.posts} color="text-primary-500" />
        </div>

        {/* Chart Section */}
        <section className="mb-20">
          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div>
                <h3 className="text-xl font-bold tracking-tight flex items-center gap-3 uppercase italic text-[var(--text-main)]">
                  <TrendingUp size={24} className="text-primary-500" /> Intake <span className="text-primary-500">Velocity</span>
                </h3>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mt-1">Application sync frequency (7D)</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Submissions</span>
                 </div>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-muted)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontWeight: 900, textTransform: 'uppercase' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--bg-hover)', radius: 12 }}
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-card)', 
                      borderColor: 'var(--border-main)',
                      borderRadius: '16px',
                      fontSize: '10px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      color: 'var(--text-main)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}
                  />
                  <Bar dataKey="apps" radius={[8, 8, 8, 8]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 4 ? 'var(--color-primary-600)' : 'var(--color-primary-500)'} opacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-16">
            
            {/* Quick Management Links */}
            <section>
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-8 flex items-center gap-4">
                 Management Sectors
                 <div className="h-px flex-1 bg-[var(--border-main)]" />
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Intake', path: '/admin/applications', icon: <Briefcase size={16} /> },
                    { name: 'Talent', path: '/admin/users', icon: <Users size={16} /> },
                    { name: 'Settings', path: '/admin/api-settings', icon: <ShieldCheck size={16} /> },
                  ].map(link => (
                    <Link key={link.path} to={link.path} className="p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl flex flex-col items-center gap-4 hover:border-primary-500/50 transition-all group shadow-xl">
                       <div className="w-12 h-12 rounded-xl bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-primary-500 transition-colors shadow-inner">{link.icon}</div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-main)]">{link.name}</span>
                    </Link>
                  ))}
               </div>
            </section>
            
            {/* Pipeline Activity */}
            <section>
               <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold tracking-tight flex items-center gap-3 uppercase italic text-[var(--text-main)]">
                  <Activity size={24} className="text-primary-500" /> Recent <span className="text-primary-500">Activity</span>
                </h3>
                <Link to="/admin/applications" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-primary-500 transition-colors">View All &rarr;</Link>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-b border-[var(--border-main)] bg-[var(--bg-hover)]/30">
                         <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Subject</th>
                         <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Target</th>
                         <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Status</th>
                         <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Action</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-[var(--border-main)]">
                       {loading ? (
                          <tr><td colSpan={4} className="px-8 py-20 text-center animate-pulse text-[var(--text-muted)] font-black text-[10px] uppercase tracking-[0.3em]">SYNCHRONIZING RECORDS...</td></tr>
                       ) : recentApps.length > 0 ? (
                          recentApps.map(app => (
                            <tr key={app.id} className="hover:bg-[var(--bg-hover)]/40 transition-all group">
                              <td className="px-8 py-7">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center font-bold text-primary-500 shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-all">{app.userName?.[0]}</div>
                                  <div>
                                    <div className="font-black text-sm text-[var(--text-main)] mb-0.5 uppercase tracking-tighter">{app.userName}</div>
                                    <div className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">
                                      {app.createdAt ? 
                                        (app.createdAt.seconds ? new Date(app.createdAt.seconds * 1000).toLocaleDateString() : new Date(app.createdAt).toLocaleDateString()) : 
                                        (app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A')}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-7">
                                <div className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-tight mb-1 italic">{app.targetTitle}</div>
                                <div className="text-[9px] text-primary-500 font-bold uppercase tracking-[0.2em]">{app.type}</div>
                              </td>
                              <td className="px-8 py-7">
                                 <div className={`inline-flex px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                   app.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]' :
                                   app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-red-500/10 text-red-500 border-red-500/20 transition-all'
                                 }`}>
                                   {app.status}
                                 </div>
                              </td>
                              <td className="px-8 py-7">
                                 <button 
                                   onClick={async () => {
                                     if (deletingId !== app.id) {
                                       setDeletingId(app.id);
                                       setTimeout(() => setDeletingId(null), 3000);
                                       return;
                                     }
                                     try {
                                       await deleteDoc(doc(db, app._collection || 'applications', app.id));
                                       setRecentApps(apps => apps.filter(a => a.id !== app.id));
                                       setDeletingId(null);
                                       toast.success("Record purged.");
                                     } catch (e) {
                                       toast.error("Failed to purge record. Access denied.");
                                     }
                                   }}
                                   className={`p-3 transition-all rounded-xl border ${deletingId === app.id ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'text-[var(--text-muted)] hover:text-red-500 border-transparent hover:border-red-500/10'}`}
                                   title={deletingId === app.id ? "Confirm Purge" : "Purge Record"}
                                 >
                                   <Trash2 size={14} className={deletingId === app.id ? 'animate-bounce' : ''} />
                                 </button>
                              </td>
                            </tr>
                          ))
                       ) : (
                          <tr><td colSpan={4} className="px-8 py-24 text-center text-[var(--text-muted)] font-black text-[10px] uppercase tracking-[0.4em]">NO ACTIVE RECORDS DETECTED</td></tr>
                       )}
                     </tbody>
                   </table>
                 </div>
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
             {/* Quick Stats sidebar alternative or empty */}
             <section className="p-10 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3rem] shadow-2xl">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-8 flex items-center gap-3">
                 Notifications
               </h4>
               <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed opacity-60">
                 No new alerts. All systems operational.
               </p>
             </section>

             {/* Recent Journal */}
             <section className="p-10 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-primary-500 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                  <Bell size={64} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-8">Recent Intel</h4>
                <div className="space-y-6 mb-10">
                   {recentPosts.map(post => (
                     <div key={post.id} className="p-5 bg-[var(--bg-hover)] rounded-[1.5rem] border border-transparent hover:border-primary-500/20 transition-all">
                        <div className="text-[9px] font-black text-primary-500 uppercase tracking-widest mb-1">{post.category}</div>
                        <div className="text-xs font-black text-[var(--text-main)] uppercase italic tracking-tighter line-clamp-1">{post.title}</div>
                     </div>
                   ))}
                </div>
                <Link to="/blog" className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:pl-2 transition-all flex items-center gap-2">
                  Access Archives <ArrowRight size={14} />
                </Link>
             </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({ icon, label, value, color = "text-primary-500" }: any) {
  return (
    <div className="p-10 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3rem] group hover:border-primary-500/30 transition-all shadow-2xl relative overflow-hidden">
      <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-all duration-700" />
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-[var(--bg-main)] border border-[var(--border-main)] ${color} group-hover:bg-primary-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner`}>
        {icon}
      </div>
      <div>
        <div className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] mb-2">{label}</div>
        <div className="text-4xl font-black font-display text-[var(--text-main)] tracking-tighter uppercase italic">{value}</div>
      </div>
    </div>
  );
}
