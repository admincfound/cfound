'use client';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/app/context/AuthContext';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import {
  Users,
  Briefcase,
  Layers,
  Newspaper,
  GraduationCap,
  ShieldCheck,
  Settings,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileEdit,
  Database,
  Mail,
  Image as ImageIcon,
  Search as SearchIcon,
  Rocket,
  UserPlus,
  Building2,
  BadgeCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLoadingScreen from '@/app/components/AuthLoadingScreen';

type AnyDoc = { id: string; _collection?: string; [k: string]: any };

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const toDate = (val: any): Date | null => {
  if (!val) return null;
  if (val.seconds) return new Date(val.seconds * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

export default function AdminDashboard() {
  const { profile, loading, profileLoading, isAdmin, user } = useAuth();
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [firestoreOk, setFirestoreOk] = useState<boolean | null>(null);

  const [users, setUsers] = useState<AnyDoc[]>([]);
  const [careers, setCareers] = useState<AnyDoc[]>([]);
  const [posts, setPosts] = useState<AnyDoc[]>([]);
  const [projects, setProjects] = useState<AnyDoc[]>([]);
  const [courses, setCourses] = useState<AnyDoc[]>([]);
  const [applications, setApplications] = useState<AnyDoc[]>([]);

  const authResolved = !loading && !profileLoading;
  useEffect(() => {
    if (!authResolved) return;
    if (!user || !isAdmin) router.replace('/login');
  }, [authResolved, user, isAdmin, router]);

  useEffect(() => {
    if (!authResolved || !user || !isAdmin) return;

    const fetchAll = async () => {
      try {
        const [usersSnap, careersSnap, postsSnap, projectsSnap, coursesSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(query(collection(db, 'careers'), orderBy('createdAt', 'desc'), limit(50))),
          getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50))),
          getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(20))),
          getDocs(query(collection(db, 'courses'), orderBy('createdAt', 'desc'), limit(20))),
        ]);

        setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCareers(careersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setProjects(projectsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setFirestoreOk(true);

        const [internSnap, jobAppSnap, courseEnrollSnap] = await Promise.all([
          getDocs(query(collection(db, 'internshipApplications'), orderBy('createdAt', 'desc'), limit(30))),
          getDocs(query(collection(db, 'jobApplications'), orderBy('createdAt', 'desc'), limit(30))),
          getDocs(query(collection(db, 'courseEnrollments'), orderBy('appliedAt', 'desc'), limit(30))),
        ]);

        const merged: AnyDoc[] = [
          ...internSnap.docs.map<AnyDoc>(d => ({
            id: d.id,
            _collection: 'internshipApplications',
            ...d.data(),
          })),
          ...jobAppSnap.docs.map<AnyDoc>(d => ({
            id: d.id,
            _collection: 'jobApplications',
            ...d.data(),
          })),
          ...courseEnrollSnap.docs.map<AnyDoc>(d => ({
            id: d.id,
            _collection: 'courseEnrollments',
            ...d.data(),
          })),
        ].sort((a, b) => {
          const ta = toDate(a.createdAt || a.appliedAt)?.getTime() || 0;
          const tb = toDate(b.createdAt || b.appliedAt)?.getTime() || 0;
          return tb - ta;
        });

        setApplications(merged);
      } catch (err) {
        console.error('Dashboard fetch failed', err);
        setFirestoreOk(false);
      } finally {
        setPageLoading(false);
      }
    };

    fetchAll();
  }, [authResolved, user, isAdmin]);

  if (!authResolved) return <AuthLoadingScreen message="Loading admin console…" />;
  if (!user || !isAdmin) return null;

  // ── Derived, real numbers only ──────────────────────────────────────────
  const today = startOfToday();
  const isToday = (d: any) => {
    const dt = toDate(d);
    return dt ? dt >= today : false;
  };

  const usersToday = users.filter(u => isToday(u.createdAt)).length;
  const jobsToday = careers.filter(c => isToday(c.createdAt)).length;
  const appsToday = applications.filter(a => isToday(a.createdAt || a.appliedAt)).length;
  const postsToday = posts.filter(p => isToday(p.createdAt)).length;

  const draftJobs = careers.filter(c => c.status === 'draft');
  const pendingApps = applications.filter(a => a.status === 'pending');
  const draftPosts = posts.filter(p => p.status && p.status !== 'active');

  const pendingTasksCount = draftJobs.length + pendingApps.length + draftPosts.length;

  const recentApps = applications.slice(0, 6);
  const recentJobs = careers.slice(0, 5);
  const recentPosts = posts.slice(0, 4);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="pt-16 pb-32 px-6 min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="max-w-7xl mx-auto">

        {/* Command Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 text-primary-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-3">
              C Found / Operations Console
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-display tracking-tight text-[var(--text-main)] mb-2 uppercase italic">
              {greeting}, <span className="text-primary-500">{(profile?.displayName || 'Founder').split(' ')[0]}.</span>
            </h1>
            <p className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-widest">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-wrap gap-4">
            <Link href="/admin/api-settings" className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] font-bold px-8 py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shadow-2xl group">
              <Settings size={14} className="group-hover:rotate-90 transition-transform" /> System Config
            </Link>
            <Link href="/admin/jobs/new" className="btn-primary px-8 py-4 flex items-center gap-2">
              <Briefcase size={14} /> Post a Job
            </Link>
          </motion.div>
        </div>

        {/* Today's Overview */}
        <section className="mb-16">
          <SectionLabel>Today's Overview</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<UserPlus size={20} />} label="Joined Today" value={usersToday} sub={`${users.length} total members`} />
            <StatCard icon={<Briefcase size={20} />} label="Jobs Posted Today" value={jobsToday} sub={`${careers.length} total listings`} />
            <StatCard icon={<Layers size={20} />} label="Applications Today" value={appsToday} sub={`${applications.length} tracked (recent)`} />
            <StatCard icon={<Newspaper size={20} />} label="Blog Activity Today" value={postsToday} sub={`${posts.length} total posts`} />
          </div>
        </section>

        {/* Pending Tasks — the "what needs my attention" row */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <SectionLabel noMargin>Pending Tasks</SectionLabel>
            {pendingTasksCount === 0 ? (
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                <CheckCircle2 size={14} /> Inbox zero
              </span>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500">{pendingTasksCount} item{pendingTasksCount === 1 ? '' : 's'} need action</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TaskCard
              icon={<FileEdit size={18} />}
              title="Jobs in Draft"
              count={draftJobs.length}
              href="/admin/jobs"
              emptyLabel="No draft jobs awaiting publish"
              items={draftJobs.slice(0, 3).map(j => j.title || 'Untitled role')}
            />
            <TaskCard
              icon={<Clock size={18} />}
              title="Applications Pending Review"
              count={pendingApps.length}
              href="/admin/applications"
              emptyLabel="No applications waiting on you"
              items={pendingApps.slice(0, 3).map(a => `${a.userName || 'Applicant'} — ${a.targetTitle || 'Role'}`)}
            />
            <TaskCard
              icon={<Newspaper size={18} />}
              title="Blogs Needing Publish"
              count={draftPosts.length}
              href="/blog"
              emptyLabel="No unpublished drafts"
              items={draftPosts.slice(0, 3).map(p => p.title || 'Untitled post')}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-16">

            {/* Recruitment Activity */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold tracking-tight flex items-center gap-3 uppercase italic text-[var(--text-main)]">
                  <Layers size={24} className="text-primary-500" /> Recruitment <span className="text-primary-500">Activity</span>
                </h3>
                <Link href="/admin/applications" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-primary-500 transition-colors">View All &rarr;</Link>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--border-main)] bg-[var(--bg-hover)]/30">
                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Applicant</th>
                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Target</th>
                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-main)]">
                      {pageLoading ? (
                        <tr><td colSpan={3} className="px-8 py-20 text-center animate-pulse text-[var(--text-muted)] font-black text-[10px] uppercase tracking-[0.3em]">SYNCING RECORDS…</td></tr>
                      ) : recentApps.length > 0 ? (
                        recentApps.map(app => (
                          <tr key={`${app._collection}-${app.id}`} className="hover:bg-[var(--bg-hover)]/40 transition-all group">
                            <td className="px-8 py-7">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center font-bold text-primary-500 shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-all">
                                  {(app.userName || '?')[0]}
                                </div>
                                <div>
                                  <div className="font-black text-sm text-[var(--text-main)] mb-0.5 uppercase tracking-tighter">{app.userName || 'Unknown'}</div>
                                  <div className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">
                                    {toDate(app.createdAt || app.appliedAt)?.toLocaleDateString() || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-7">
                              <div className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-tight mb-1 italic">{app.targetTitle || app.courseTitle || '—'}</div>
                              <div className="text-[9px] text-primary-500 font-bold uppercase tracking-[0.2em]">{app._collection === 'courseEnrollments' ? 'Academy' : app._collection === 'internshipApplications' ? 'Internship' : 'Job'}</div>
                            </td>
                            <td className="px-8 py-7">
                              <div className={`inline-flex px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                app.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                              }`}>
                                {app.status || 'unknown'}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <EmptyRow colSpan={3} label="No applications yet" />
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Recent Jobs */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold tracking-tight flex items-center gap-3 uppercase italic text-[var(--text-main)]">
                  <Briefcase size={24} className="text-primary-500" /> Recent <span className="text-primary-500">Jobs</span>
                </h3>
                <Link href="/admin/jobs" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-primary-500 transition-colors">Manage &rarr;</Link>
              </div>

              {recentJobs.length === 0 ? (
                <EmptyState label="No jobs posted yet" cta="Post your first role" href="/admin/jobs/new" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentJobs.map(job => (
                    <div key={job.id} className="p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-xl flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-black text-sm uppercase italic tracking-tight truncate">{job.title || 'Untitled role'}</div>
                        <div className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">{job.companyName || 'C Found Technologies'}</div>
                      </div>
                      <span className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        job.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        job.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>{job.status || 'active'}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Content Studio */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold tracking-tight flex items-center gap-3 uppercase italic text-[var(--text-main)]">
                  <Newspaper size={24} className="text-primary-500" /> Content <span className="text-primary-500">Studio</span>
                </h3>
                <Link href="/blog" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-primary-500 transition-colors">Manage &rarr;</Link>
              </div>

              {recentPosts.length === 0 ? (
                <EmptyState label="No blog posts yet" cta="Write your first post" href="/blog" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentPosts.map(post => (
                    <div key={post.id} className="p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-xl">
                      <div className="text-[9px] font-black text-primary-500 uppercase tracking-widest mb-1">{post.category || 'General'}</div>
                      <div className="text-xs font-black text-[var(--text-main)] uppercase italic tracking-tighter line-clamp-1">{post.title || 'Untitled'}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">

            {/* Platform Health */}
            <section className="p-10 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3rem] shadow-2xl">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-8 flex items-center gap-3">
                <ShieldCheck size={16} className="text-primary-500" /> Platform Health
              </h4>
              <div className="space-y-4">
                <HealthRow icon={<Database size={14} />} label="Firestore" status={pageLoading ? 'checking' : firestoreOk ? 'ok' : 'error'} detail={firestoreOk ? 'Live reads succeeding' : 'Checking connection…'} />
                <HealthRow icon={<Rocket size={14} />} label="Latest Deployment" status="unknown" detail="Not connected — wire Vercel webhook" />
                <HealthRow icon={<Mail size={14} />} label="EmailJS" status="unknown" detail="Not connected — no send logs tracked" />
                <HealthRow icon={<ImageIcon size={14} />} label="ImageKit" status="unknown" detail="Not connected — no usage data" />
                <HealthRow icon={<SearchIcon size={14} />} label="Search Console" status="unknown" detail="Not connected — no indexing data" />
              </div>
            </section>

            {/* Employer Verification Queue */}
            <section className="p-10 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3rem] shadow-2xl">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-6 flex items-center gap-3">
                <Building2 size={16} className="text-primary-500" /> Employer Verification
              </h4>
              <div className="text-center py-8">
                <BadgeCheck size={28} className="mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-relaxed">
                  No employer verification collection yet.<br />Add one when you start onboarding companies directly.
                </p>
              </div>
            </section>

            {/* Success Stories / Academy quick counts */}
            <section className="p-10 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3rem] shadow-2xl">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-6">Success Stories &amp; Academy</h4>
              <div className="space-y-4">
                <MiniStat icon={<Layers size={14} />} label="Projects / Success Stories" value={projects.length} href="/projects" />
                <MiniStat icon={<GraduationCap size={14} />} label="Academy Courses" value={courses.length} href="/courses" />
              </div>
            </section>

            {/* Quick Actions */}
            <section className="p-10 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3rem] shadow-2xl">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-6">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <QuickAction icon={<Briefcase size={16} />} label="New Job" href="/admin/jobs/new" />
                <QuickAction icon={<Users size={16} />} label="Talent" href="/dashboard/admin/users" />
                <QuickAction icon={<Newspaper size={16} />} label="Blog" href="/blog" />
                <QuickAction icon={<Settings size={16} />} label="Config" href="/admin/api-settings" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Building blocks ─────────────────────────────────────────────────────

function SectionLabel({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) {
  return (
    <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] flex items-center gap-4 ${noMargin ? '' : 'mb-8'}`}>
      {children}
      <div className="h-px flex-1 bg-[var(--border-main)]" />
    </h3>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <div className="p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] group hover:border-primary-500/30 transition-all shadow-2xl relative overflow-hidden">
      <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-all duration-700" />
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-[var(--bg-main)] border border-[var(--border-main)] text-primary-500 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-inner">
        {icon}
      </div>
      <div className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-[0.2em] mb-2">{label}</div>
      <div className="text-3xl font-black font-display text-[var(--text-main)] tracking-tighter uppercase italic mb-1">{value}</div>
      <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest opacity-60">{sub}</div>
    </div>
  );
}

function TaskCard({ icon, title, count, href, items, emptyLabel }: { icon: React.ReactNode; title: string; count: number; href: string; items: string[]; emptyLabel: string }) {
  return (
    <Link href={href} className="block p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] shadow-xl hover:border-primary-500/30 transition-all group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 text-[var(--text-main)]">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center text-primary-500">{icon}</div>
          <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
        </div>
        <span className={`text-lg font-black italic ${count > 0 ? 'text-yellow-500' : 'text-emerald-500'}`}>{count}</span>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight truncate">— {it}</li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50">{emptyLabel}</p>
      )}
    </Link>
  );
}

function HealthRow({ icon, label, status, detail }: { icon: React.ReactNode; label: string; status: 'ok' | 'error' | 'checking' | 'unknown'; detail: string }) {
  const color = status === 'ok' ? 'text-emerald-500' : status === 'error' ? 'text-red-500' : status === 'checking' ? 'text-yellow-500' : 'text-[var(--text-muted)]';
  const dot = status === 'ok' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : status === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-[var(--text-muted)] opacity-40';
  return (
    <div className="flex items-center justify-between p-4 bg-[var(--bg-hover)] rounded-2xl">
      <div className="flex items-center gap-3">
        <span className="text-[var(--text-muted)]">{icon}</span>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">{label}</div>
          <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight opacity-70">{detail}</div>
        </div>
      </div>
      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
    </div>
  );
}

function MiniStat({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 bg-[var(--bg-hover)] rounded-2xl hover:bg-primary-500/10 transition-all group">
      <div className="flex items-center gap-3">
        <span className="text-primary-500">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">{label}</span>
      </div>
      <span className="text-sm font-black italic text-[var(--text-main)] group-hover:text-primary-500">{value}</span>
    </Link>
  );
}

function QuickAction({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link href={href} className="p-5 bg-[var(--bg-hover)] rounded-2xl flex flex-col items-center gap-2 hover:bg-primary-600 hover:text-white transition-all group text-[var(--text-main)]">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest text-center">{label}</span>
    </Link>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-8 py-24 text-center">
        <AlertCircle size={24} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
        <div className="text-[var(--text-muted)] font-black text-[10px] uppercase tracking-[0.3em]">{label}</div>
      </td>
    </tr>
  );
}

function EmptyState({ label, cta, href }: { label: string; cta: string; href: string }) {
  return (
    <div className="p-12 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] shadow-xl text-center">
      <AlertCircle size={28} className="mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-6">{label}</p>
      <Link href={href} className="inline-flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:pl-2 transition-all">
        {cta} <ArrowRight size={14} />
      </Link>
    </div>
  );
}