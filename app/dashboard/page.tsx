"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  collection, query, where, getDocs, orderBy, doc, getDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { getProfileCompletion } from "../lib/profileUtils";
import AuthLoadingScreen from "../components/AuthLoadingScreen";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, Settings, X, ExternalLink, ShieldCheck, Briefcase, BookOpen,
  Activity, Clock, ArrowRight, Zap, CheckCircle, Bell, Eye, Calendar,
  Users, Download, Star, TrendingUp, GraduationCap, Lightbulb,
  SlidersHorizontal, AtSign, MapPin, FileText, Bookmark, Search
} from "lucide-react";
import { toast } from "react-hot-toast";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, color, sub
}: {
  label: string; value: number | string; icon: React.ReactNode; color: string; sub?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
      className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-black text-gray-900">{value}</div>
      {sub && (
        <div className="text-[10px] text-gray-400 font-medium">{sub}</div>
      )}
    </motion.div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 28, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
  return (
    <svg width="72" height="72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} strokeWidth="5" stroke="#e5e7eb" fill="none" />
      <circle cx="36" cy="36" r={r} strokeWidth="5" stroke="#2563eb" fill="none"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      <text x="36" y="36" dominantBaseline="middle" textAnchor="middle"
        className="fill-gray-800" style={{ fontSize: 13, fontWeight: 900 }}
        transform="rotate(90 36 36)">{pct}%</text>
    </svg>
  );
}

function PipelineTimeline({ stages, activeIdx }: { stages: string[]; activeIdx: number }) {
  return (
    <div className="flex items-center gap-0 mt-3 w-full">
      {stages.map((stage, i) => (
        <div key={stage} className="flex-1 flex flex-col items-center">
          <div className="flex items-center w-full">
            {i > 0 && <div className={`flex-1 h-[2px] ${i <= activeIdx ? "bg-blue-500" : "bg-gray-200"}`} />}
            <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
              i < activeIdx ? "bg-blue-500 border-blue-500" :
              i === activeIdx ? "bg-blue-500 border-blue-500 ring-2 ring-blue-200" :
              "bg-white border-gray-300"
            }`} />
            {i < stages.length - 1 && <div className={`flex-1 h-[2px] ${i < activeIdx ? "bg-blue-500" : "bg-gray-200"}`} />}
          </div>
          <span className={`text-[9px] font-semibold mt-1 ${i === activeIdx ? "text-blue-600" : "text-gray-400"}`}>
            {stage}
          </span>
        </div>
      ))}
    </div>
  );
}

const JOB_STAGES = ["Applied", "Shortlisted", "Interview", "Offer", "Joined"];
const ACADEMY_STAGES = ["Enrolled", "In Progress", "Assessment", "Completed", "Certificate"];

function getStageIndex(app: any): number {
  const s = app.status;
  if (s === "pending") return 0;
  if (s === "reviewed") return 1;
  if (s === "interviewScheduled" || app.interviewDetails) return 2;
  if (s === "accepted" || s === "enrolled") return app.category === "Academy" ? 0 : 3;
  return 0;
}

function getCategoryColor(cat: string) {
  if (cat === "Internship") return "bg-blue-500";
  if (cat === "Job") return "bg-green-500";
  return "bg-purple-500";
}

function getCategoryIconBg(cat: string) {
  if (cat === "Internship") return "bg-blue-50 text-blue-500";
  if (cat === "Job") return "bg-green-50 text-green-500";
  return "bg-purple-50 text-purple-500";
}

function getStatusColor(status: string) {
  switch (status) {
    case "accepted":
    case "enrolled": return "text-green-600 bg-green-50 border-green-200";
    case "rejected": return "text-red-600 bg-red-50 border-red-200";
    case "reviewed": return "text-blue-600 bg-blue-50 border-blue-200";
    default: return "text-amber-600 bg-amber-50 border-amber-200";
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "Internship": return <Briefcase size={16} />;
    case "Job": return <Zap size={16} />;
    case "Academy": return <BookOpen size={16} />;
    default: return <Activity size={16} />;
  }
}

// ─── Username Modal ───────────────────────────────────────────────────────────

function UsernameRequiredModal({ open, onClose, onChoose }: {
  open: boolean; onClose: () => void; onChoose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="um-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" />
          <motion.div key="um-modal" initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="fixed inset-0 z-[101] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-6 relative">
              <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1">
                <X size={18} />
              </button>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <AtSign size={22} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-black text-gray-900 mb-1">Choose a Username</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                You need a username before your public profile can be shared.
              </p>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={onChoose} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors">
                  Choose Username
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Application Detail Modal ────────────────────────────────────────────────

function AppDetailModal({ app, user, onClose }: { app: any; user: any; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div initial={{ scale: 0.97, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 16 }}
        className="bg-white border border-gray-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tight text-gray-900">
              {app.targetTitle || app.jobTitle || "Opportunity"}
            </h3>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1 flex items-center gap-2">
              <span className={`w-4 h-4 rounded flex items-center justify-center ${getCategoryIconBg(app.category)}`}>
                {getCategoryIcon(app.category)}
              </span>
              C Found · {app.category}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Current Status</p>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(app.status)}`}>
                {app.status}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Applied Date</p>
              <p className="text-sm font-semibold text-gray-700">
                {new Date(app.createdAt || app.appliedAt).toLocaleDateString()} at{" "}
                {new Date(app.createdAt || app.appliedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed">{app.description || "Description not available."}</p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Required Skills</p>
            <div className="flex flex-wrap gap-2">
              {(app.skills || ["Not Available"]).map((skill: string, i: number) => (
                <span key={i} className="px-2.5 py-1 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg text-gray-700">{skill}</span>
              ))}
            </div>
          </div>

          {app.hrRemarks && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1.5">HR Remarks</p>
              <p className="text-sm text-blue-800 font-medium">{app.hrRemarks}</p>
            </div>
          )}

          {app.interviewDetails && (
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-1.5">Interview Details</p>
              <p className="text-sm text-purple-800 font-medium whitespace-pre-wrap">{app.interviewDetails}</p>
            </div>
          )}

          {app.rejectionReason && app.status === "rejected" && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1.5">Feedback</p>
              <p className="text-sm text-red-800 font-medium">{app.rejectionReason}</p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Activity Timeline</p>
            <div className="relative border-l-2 border-gray-100 ml-3 space-y-4">
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow" />
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Applied for {app.category}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(app.createdAt || app.appliedAt).toLocaleDateString()}</p>
              </div>
              {(app.status === "reviewed" || app.status === "accepted" || app.hrRemarks) && (
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow" />
                  <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">HR Reviewed Profile</p>
                  <p className="text-xs text-gray-400 mt-0.5">Application marked as reviewed</p>
                </div>
              )}
              {app.interviewDetails && (
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-purple-500 border-4 border-white shadow" />
                  <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Interview Scheduled</p>
                  <p className="text-xs text-gray-400 mt-0.5">Interview details shared</p>
                </div>
              )}
              {app.status === "accepted" && (
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow" />
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Selected</p>
                  <p className="text-xs text-green-400 mt-0.5">Offer extended / Accepted</p>
                </div>
              )}
              {app.status === "rejected" && (
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-red-500 border-4 border-white shadow" />
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Rejected</p>
                  <p className="text-xs text-red-400 mt-0.5">Application closed</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Submitted Data</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-gray-400 block mb-0.5">Email</span>
                <span className="font-semibold text-gray-800 break-all">{app.email || app.userEmail || user?.email || "N/A"}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-0.5">Phone</span>
                <span className="font-semibold text-gray-800">{app.phone || "N/A"}</span>
              </div>
              {app.resume_url && app.resume_url !== "N/A" && (
                <div className="sm:col-span-2">
                  <a href={app.resume_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
                  >
                    <ExternalLink size={14} /> View Submitted Resume
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyPipeline({ tab }: { tab: string }) {
  const href = tab === "Academy" ? "/courses" : tab === "Job" ? "/careers" : "/internship";
  const label = tab === "All" ? "Openings" : `${tab}s`;
  return (
    <div className="py-16 text-center">
      <Briefcase size={36} className="mx-auto text-gray-200 mb-3" />
      <p className="text-sm font-semibold text-gray-400 mb-4">
        {tab === "All" ? "No applications yet." : `No ${tab.toLowerCase()} applications.`}
      </p>
      <Link href={href}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-colors"
      >
        Explore {label} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

// ─── Notification type ────────────────────────────────────────────────────────

interface Notification {
  icon: React.ReactNode;
  bg: string;
  text: string;
  time: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, profile, loading, profileLoading, isAdmin } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [sortOrder, setSortOrder] = useState<"recent" | "newest" | "oldest">("recent");
  const [showSort, setShowSort] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameWarningDismissed, setUsernameWarningDismissed] = useState(false);
  const [profileViews, setProfileViews] = useState<number | null>(null);
  const [savedJobs, setSavedJobs] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ── Auth Guard: wait until auth + profile resolved, then route ──────────────
  const authResolved = !loading && !profileLoading;

  useEffect(() => {
    if (!authResolved) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (isAdmin) {
      router.replace("/admin");
    }
  }, [authResolved, user, isAdmin, router]);

  // ── Fetch data (only for non-admin users) ─────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user || isAdmin) return;
    setDataLoading(true);
    try {
      const [appSnap, internSnap, academySnap, savedSnap] = await Promise.all([
        getDocs(query(collection(db, "applications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "internshipApplications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "courseEnrollments"), where("userId", "==", user.uid), orderBy("appliedAt", "desc"))),
        getDocs(query(collection(db, "savedJobs"), where("userId", "==", user.uid))).catch(() => ({ docs: [] } as any)),
      ]);

      const apps = appSnap.docs.map(d => ({ id: d.id, ...d.data(), category: d.data().type || "Job" }));
      const internApps = internSnap.docs.map(d => ({ id: d.id, ...d.data(), category: "Internship" }));
      const academyApps = academySnap.docs.map(d => ({ id: d.id, ...d.data(), category: "Academy" }));

      const allApps = [...apps, ...internApps, ...academyApps].sort((a: any, b: any) => {
        const da = new Date(a.createdAt || a.appliedAt).getTime();
        const db2 = new Date(b.createdAt || b.appliedAt).getTime();
        return db2 - da;
      });

      setApplications(allApps);
      setSavedJobs(savedSnap.docs.length);

      // Profile views from user doc
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setProfileViews(userDoc.data().profileViews || 0);
        }
      } catch {}

      // Build real notifications from applications
      const notifs: Notification[] = [];
      const recentApps = allApps.slice(0, 5);
      recentApps.forEach((a: any) => {
        if (a.status === "reviewed" || a.hrRemarks) {
          notifs.push({
            icon: <Eye size={16} className="text-blue-500" />,
            bg: "bg-blue-50",
            text: `Your application for "${a.targetTitle || a.jobTitle}" was reviewed`,
            time: new Date(a.createdAt || a.appliedAt).toLocaleDateString()
          });
        }
        if (a.interviewDetails) {
          notifs.push({
            icon: <Calendar size={16} className="text-purple-500" />,
            bg: "bg-purple-50",
            text: `Interview scheduled for "${a.targetTitle || a.jobTitle}"`,
            time: "Check email for details"
          });
        }
        if (a.status === "accepted") {
          notifs.push({
            icon: <CheckCircle size={16} className="text-green-500" />,
            bg: "bg-green-50",
            text: `Offer received for "${a.targetTitle || a.jobTitle}"`,
            time: new Date(a.createdAt || a.appliedAt).toLocaleDateString()
          });
        }
      });
      if (notifs.length === 0) {
        notifs.push({
          icon: <Bell size={16} className="text-gray-400" />,
          bg: "bg-gray-50",
          text: "No notifications yet. Apply to start tracking.",
          time: ""
        });
      }
      setNotifications(notifs.slice(0, 4));
    } catch (err) {
      console.error("Dashboard data error:", err);
    } finally {
      setDataLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (authResolved && user && !isAdmin) {
      fetchData();
    }
  }, [authResolved, user, isAdmin, fetchData]);

  // ── Show loading until auth resolved ─────────────────────────────────────
  if (!authResolved) {
    return <AuthLoadingScreen message="Verifying your identity…" />;
  }
  // Prevent flashing wrong dashboard
  if (!user || isAdmin) return null;

  // ── Derived stats ────────────────────────────────────────────────────────
  const internsCount = applications.filter(a => a.category === "Internship").length;
  const jobsCount = applications.filter(a => a.category === "Job").length;
  const academyCount = applications.filter(a => a.category === "Academy").length;
  const pending = applications.filter(a => a.status === "pending").length;
  const accepted = applications.filter(a => a.status === "accepted" || a.status === "enrolled").length;

  const completion = getProfileCompletion(profile);
  const profileCompletion = completion.percentage;

  const filteredApps = (() => {
    let list = activeTab === "All" ? applications : applications.filter(a => a.category === activeTab);
    if (sortOrder === "newest") list = [...list].sort((a, b) => new Date(b.createdAt || b.appliedAt).getTime() - new Date(a.createdAt || a.appliedAt).getTime());
    if (sortOrder === "oldest") list = [...list].sort((a, b) => new Date(a.createdAt || a.appliedAt).getTime() - new Date(b.createdAt || b.appliedAt).getTime());
    return list;
  })();

  const handleChooseUsername = () => {
    setShowUsernameModal(false);
    router.push("/profile?action=choose-username");
  };

  const handleDownloadResume = () => {
    router.push("/profile?action=download-resume");
  };

  const handleViewPublicProfile = () => {
    const username = (profile as any)?.username;
    if (username) {
      window.open(`/${username}`, "_blank", "noopener,noreferrer");
    } else {
      setShowUsernameModal(true);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-20 px-4 md:px-6">
      <UsernameRequiredModal
        open={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onChoose={handleChooseUsername}
      />

      <AnimatePresence>
        {selectedApp && (
          <AppDetailModal app={selectedApp} user={user} onClose={() => setSelectedApp(null)} />
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto">

        {/* Username warning */}
        {!(profile as any)?.username && !usernameWarningDismissed && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-start gap-4 bg-white border-2 border-blue-200 rounded-2xl p-4 shadow-sm"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <AtSign size={18} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm leading-tight">Choose your username</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">People can&apos;t visit your public profile until you create one.</p>
              <div className="flex items-center gap-3 mt-3">
                <button onClick={handleChooseUsername}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Choose Username
                </button>
                <button onClick={() => setUsernameWarningDismissed(true)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            <button onClick={() => setUsernameWarningDismissed(true)}
              className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 p-0.5"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* ── Left Sidebar ────────────────────────────────────────────── */}
          <aside className="xl:col-span-3 space-y-4">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
            >
              {/* Avatar */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-3">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt={profile?.displayName || "Profile"}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gray-200 border-4 border-white shadow-md flex items-center justify-center">
                      <User size={32} className="text-gray-500" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow">
                    <ShieldCheck size={12} className="text-white" />
                  </div>
                </div>
                <h2 className="text-lg font-black tracking-tight text-gray-900 italic uppercase">
                  {profile?.displayName || user?.displayName}
                </h2>
                {(profile as any)?.username && (
                  <p className="text-sm font-semibold text-gray-400 mt-0.5">@{(profile as any).username}</p>
                )}
                <div className="flex items-center gap-1 mt-0.5">
                  <CheckCircle size={12} className="text-green-500" />
                  <span className="text-xs font-semibold text-gray-500">Identity Verified</span>
                </div>
                <div className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                  {(profile as any)?.primaryRole || "Member"}
                </div>
                <div className="flex items-center gap-1 mt-1.5 text-gray-400 text-xs">
                  <MapPin size={11} />
                  <span>{profile?.city ? `${profile.city}, ` : ""}{profile?.country || "India"}</span>
                </div>
              </div>

              {/* Profile Completion */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-gray-600">Profile Completion</span>
                  <span className="text-xs font-black text-blue-600">{profileCompletion}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompletion}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>
                {completion.missing.length > 0 && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Missing: {completion.missing.slice(0, 2).join(", ")}
                    {completion.missing.length > 2 && ` +${completion.missing.length - 2} more`}
                  </p>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="space-y-2 mb-6">
                <Link href="/profile"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors"
                >
                  <Settings size={14} /> Edit Profile
                </Link>
                <button
                  onClick={handleDownloadResume}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                >
                  <Download size={14} /> Download Resume
                </button>
                <button
                  onClick={handleViewPublicProfile}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                >
                  <Eye size={14} /> View Public Profile
                </button>
              </div>

              {/* Stats strip */}
              <div className="border-t border-gray-100 pt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-1">
                    <Briefcase size={14} className="text-blue-500" />
                  </div>
                  <div className="text-lg font-black text-gray-900">{applications.length}</div>
                  <div className="text-[10px] text-gray-400 font-medium">Applied</div>
                </div>
                <div>
                  <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-1">
                    <Eye size={14} className="text-green-500" />
                  </div>
                  <div className="text-lg font-black text-gray-900">
                    {profileViews !== null ? profileViews : "—"}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium">Views</div>
                </div>
                <div>
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-1">
                    <Bookmark size={14} className="text-amber-500" />
                  </div>
                  <div className="text-lg font-black text-gray-900">{savedJobs}</div>
                  <div className="text-[10px] text-gray-400 font-medium">Saved</div>
                </div>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
            >
              <h3 className="font-black text-gray-900 text-sm mb-3">Quick Links</h3>
              <div className="space-y-1">
                {[
                  { href: "/internship", icon: <GraduationCap size={14} />, label: "Browse Internships" },
                  { href: "/careers", icon: <Briefcase size={14} />, label: "Browse Jobs" },
                  { href: "/courses", icon: <BookOpen size={14} />, label: "Academy" },
                  { href: "/profile", icon: <FileText size={14} />, label: "My Resume" },
                ].map(link => (
                  <Link key={link.href} href={link.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors group"
                  >
                    <span className="text-gray-400 group-hover:text-blue-500 transition-colors">{link.icon}</span>
                    {link.label}
                    <ArrowRight size={12} className="ml-auto text-gray-300 group-hover:text-blue-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </aside>

          {/* ── Center ─────────────────────────────────────────────────── */}
          <main className="xl:col-span-6 space-y-6">

            {/* Stat Cards */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-5 gap-3"
            >
              <StatCard label="Internships" value={internsCount} color="bg-blue-50 text-blue-500"
                icon={<GraduationCap size={16} />}
                sub={internsCount === 0 ? "None yet" : `${internsCount} total`}
              />
              <StatCard label="Jobs" value={jobsCount} color="bg-green-50 text-green-500"
                icon={<Briefcase size={16} />}
                sub={jobsCount === 0 ? "None yet" : `${jobsCount} total`}
              />
              <StatCard label="Academy" value={academyCount} color="bg-purple-50 text-purple-500"
                icon={<BookOpen size={16} />}
                sub={academyCount === 0 ? "None yet" : `${academyCount} total`}
              />
              <StatCard label="Pending" value={pending} color="bg-amber-50 text-amber-500"
                icon={<Clock size={16} />}
                sub={pending === 0 ? "All reviewed" : "Awaiting review"}
              />
              <StatCard label="Accepted" value={accepted} color="bg-emerald-50 text-emerald-500"
                icon={<CheckCircle size={16} />}
                sub={accepted === 0 ? "Keep applying!" : "Congratulations!"}
              />
            </motion.div>

            {/* Pipeline */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">My Pipeline</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
                    {["All", "Internship", "Job", "Academy"].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          activeTab === tab ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <button onClick={() => setShowSort(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      {sortOrder === "recent" ? "Recent" : sortOrder === "newest" ? "Newest" : "Oldest"}
                      <SlidersHorizontal size={12} />
                    </button>
                    <AnimatePresence>
                      {showSort && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                          className="absolute right-0 top-10 z-20 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden w-36"
                        >
                          {(["recent", "newest", "oldest"] as const).map(o => (
                            <button key={o} onClick={() => { setSortOrder(o); setShowSort(false); }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${sortOrder === o ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
                            >
                              {o === "recent" ? "Recent First" : o === "newest" ? "Newest" : "Oldest"}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {dataLoading ? (
                  <div className="py-16 text-center">
                    <div className="flex items-end justify-center gap-1.5 h-8 mb-3">
                      {[0,1,2,3,4].map(i => (
                        <motion.div key={i} className="w-1.5 bg-blue-400 rounded-full"
                          animate={{ height: ["10px","22px","10px"], opacity: [0.4,1,0.4] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">Loading your applications…</p>
                  </div>
                ) : filteredApps.length === 0 ? (
                  <EmptyPipeline tab={activeTab} />
                ) : (
                  filteredApps.map((app, idx) => {
                    const stages = app.category === "Academy" ? ACADEMY_STAGES : JOB_STAGES;
                    const activeIdx = getStageIndex(app);
                    return (
                      <motion.div layout key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="group border border-gray-100 rounded-xl overflow-hidden hover:border-blue-100 hover:shadow-md transition-all bg-white"
                      >
                        <div className="flex items-start gap-3 px-4 pt-4 pb-2">
                          <div className={`w-1 self-stretch rounded-full shrink-0 ${getCategoryColor(app.category)}`} />
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getCategoryIconBg(app.category)}`}>
                            {getCategoryIcon(app.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-black text-gray-900 uppercase italic text-sm tracking-tight truncate">
                                {app.targetTitle || app.jobTitle || "Opportunity"}
                              </h3>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(app.status)}`}>
                                {app.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 font-medium">
                              <span className="flex items-center gap-1"><Briefcase size={10} /> C Found</span>
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(app.createdAt || app.appliedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => setSelectedApp(app)}
                              className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg transition-all"
                            >
                              Details
                            </button>
                            <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:border-blue-200 transition-all">
                              <ArrowRight size={13} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                          </div>
                        </div>
                        <div className="px-6 pb-4">
                          <PipelineTimeline stages={stages} activeIdx={activeIdx} />
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {filteredApps.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-3 flex gap-3">
                  <Link href="/internship"
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors py-1"
                  >
                    <Search size={13} /> Browse Internships
                  </Link>
                  <div className="w-px bg-gray-100" />
                  <Link href="/careers"
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors py-1"
                  >
                    <Briefcase size={13} /> Browse Jobs
                  </Link>
                </div>
              )}
            </motion.div>
          </main>

          {/* ── Right Sidebar ──────────────────────────────────────────── */}
          <aside className="xl:col-span-3 space-y-4">

            {/* Notifications */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-900 text-base">Notifications</h3>
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                  {notifications.length} recent
                </span>
              </div>
              <div className="space-y-3">
                {notifications.map((n, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${n.bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
                      {n.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 leading-snug">{n.text}</p>
                      {n.time && <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Activity Summary */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <h3 className="font-black text-gray-900 text-base mb-4">Recent Activity</h3>
              {applications.length === 0 ? (
                <div className="text-center py-6">
                  <Activity size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">No activity yet</p>
                  <Link href="/internship"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Start applying <ArrowRight size={11} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 4).map((app, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${getCategoryIconBg(app.category)}`}>
                        {getCategoryIcon(app.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {app.targetTitle || app.jobTitle || "Opportunity"}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(app.createdAt || app.appliedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                  {applications.length > 4 && (
                    <p className="text-[10px] text-center text-gray-400 font-medium pt-1">
                      +{applications.length - 4} more applications
                    </p>
                  )}
                </div>
              )}
            </motion.div>

            {/* Profile Tip */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-amber-500" />
                  <h3 className="font-black text-gray-900 text-base">Profile Strength</h3>
                </div>
                <ProgressRing pct={profileCompletion} />
              </div>
              {completion.missing.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    Complete your profile to improve visibility with recruiters.
                  </p>
                  <ul className="mt-2 space-y-1">
                    {completion.missing.slice(0, 3).map((m, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        {m}
                      </li>
                    ))}
                  </ul>
                  <Link href="/profile"
                    className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 mt-3 transition-colors"
                  >
                    Complete Now <ArrowRight size={13} />
                  </Link>
                </>
              ) : (
                <p className="text-sm text-green-600 font-semibold mt-3">
                  ✓ Profile complete! You&apos;re ready to apply.
                </p>
              )}
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  );
}
