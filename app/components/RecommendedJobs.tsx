"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  collection, query, where, getDocs, doc, setDoc, updateDoc, increment
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { getProfileCompletion } from "../lib/profileUtils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase, MapPin, Zap, ArrowRight, Star, CheckCircle,
  GraduationCap, TrendingUp, ExternalLink, Loader2, AlertCircle,
  Building2, Clock, SlidersHorizontal, Eye
} from "lucide-react";
import { toast } from "react-hot-toast";
import { sendApplicationEmail } from "../services/emailService";
import ApplyPopup, { shouldSkipPopup } from "./ApplyPopup";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobRec {
  id: string;
  type: "internship" | "job";
  collection: "opportunities" | "careers";
  appCollection: "internshipApplications" | "jobApplications";
  title: string;
  companyName: string;
  location: string;
  mode: string;
  skills: string[];
  department: string;
  experience: string;
  freshersAllowed: boolean;
  educationRequirement: string;
  slug: string;
  minAmount?: number;
  maxAmount?: number;
  compType?: string;
  jobType?: string;
  internshipType?: string;
  status: string;
  matchScore: number;
  matchReasons: string[];
}

// ─── Matching Engine ──────────────────────────────────────────────────────────

function scoreJob(job: JobRec, profile: any, userSkills: string[], userRole: string, userCity: string, userCountry: string): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const titleLower = (job.title || "").toLowerCase();
  const deptLower = (job.department || "").toLowerCase();
  const jobSkills = job.skills.map(s => s.toLowerCase());
  const roleLower = userRole.toLowerCase();

  // ── Role / Title match (max 35pts) ────────────────────────────────────────
  if (roleLower) {
    const roleWords = roleLower.split(/\s+/).filter(w => w.length > 2);
    let titleHits = 0;
    roleWords.forEach(word => {
      if (titleLower.includes(word) || deptLower.includes(word)) titleHits++;
    });
    if (titleHits > 0) {
      const pts = Math.min(Math.round((titleHits / roleWords.length) * 35), 35);
      score += pts;
      reasons.push("Role match");
    }
  }

  // ── Skills overlap (max 40pts) ────────────────────────────────────────────
  if (userSkills.length > 0 && jobSkills.length > 0) {
    let matched = 0;
    userSkills.forEach(us => {
      if (jobSkills.some(js => js.includes(us) || us.includes(js))) matched++;
    });
    if (matched > 0) {
      const pts = Math.min(Math.round((matched / jobSkills.length) * 40), 40);
      score += pts;
      reasons.push(`${matched} skill${matched > 1 ? "s" : ""} match`);
    }
  }

  // ── Location match (max 15pts) ────────────────────────────────────────────
  const locLower = (job.location || "").toLowerCase();
  const modeLower = (job.mode || "").toLowerCase();
  if (modeLower === "remote") {
    score += 10;
    reasons.push("Remote");
  } else if (userCity && locLower.includes(userCity.toLowerCase())) {
    score += 15;
    reasons.push("Your city");
  } else if (userCountry && locLower.includes(userCountry.toLowerCase())) {
    score += 8;
    reasons.push("Your country");
  }

  // ── Education match (max 10pts) ───────────────────────────────────────────
  const userEdu = (profile?.education || []);
  const hasEdu = userEdu.some((e: any) => e.institution && e.degree);
  const eduReq = (job.educationRequirement || "").toLowerCase();
  if (!eduReq || eduReq === "any" || !hasEdu) {
    // no deduction
  } else {
    const eduTerms = ["degree", "bachelor", "master", "diploma", "phd", "10th", "12th"];
    const userDegrees = userEdu.map((e: any) => (e.degree || "").toLowerCase()).join(" ");
    const match = eduTerms.some(t => eduReq.includes(t) && userDegrees.includes(t));
    if (match) { score += 10; reasons.push("Education match"); }
  }

  // ── Freshers bonus (max 5pts) ─────────────────────────────────────────────
  const isFresher = profile?.experienceLevel === "Fresher";
  const hasNoExp = !profile?.experiences?.some((e: any) => e.role && e.company);
  if ((isFresher || hasNoExp) && job.freshersAllowed) {
    score += 5;
    reasons.push("Freshers welcome");
  }

  return { score: Math.min(score, 99), reasons };
}

// ─── Match Badge ──────────────────────────────────────────────────────────────

function MatchBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    score >= 40 ? "bg-blue-50 text-blue-700 border-blue-200" :
    "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase border rounded-full px-2 py-0.5 ${color}`}>
      <TrendingUp size={9} />
      {score > 0 ? `${score}% match` : "Suggested"}
    </span>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export default function RecommendedJobs() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [recs, setRecs] = useState<JobRec[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "internship" | "job">("all");
  const [showPopup, setShowPopup] = useState(false);
  const [pendingOpp, setPendingOpp] = useState<JobRec | null>(null);

  const completion = getProfileCompletion(profile);
  const isIncomplete = completion.percentage < 40;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !profile) return;

    const load = async () => {
      setLoading(true);
      try {
        const userSkills = Array.isArray(profile.skills)
          ? profile.skills.map((s: string) => s.toLowerCase().trim()).filter(Boolean)
          : [];
        const userRole = (profile.primaryRole || profile.secondaryRole || "").toLowerCase();
        const userCity = (profile.city || "").toLowerCase();
        const userCountry = (profile.country || "").toLowerCase();

        // Fetch both collections in parallel
        const [oppSnap, jobSnap, internAppSnap, jobAppSnap] = await Promise.all([
          getDocs(query(
            collection(db, "opportunities"),
            where("type", "==", "internship"),
            where("status", "in", ["active", "featured"])
          )),
          getDocs(query(
            collection(db, "careers"),
            where("type", "==", "job"),
            where("status", "==", "active")
          )),
          getDocs(query(
            collection(db, "internshipApplications"),
            where("userId", "==", user.uid)
          )).catch(() => ({ docs: [] } as any)),
          getDocs(query(
            collection(db, "jobApplications"),
            where("userId", "==", user.uid)
          )).catch(() => ({ docs: [] } as any)),
        ]);

        // Build applied set
        const applied = new Set<string>([
          ...internAppSnap.docs.map((d: any) => d.data().targetId),
          ...jobAppSnap.docs.map((d: any) => d.data().targetId),
        ]);
        setAppliedIds(applied);

        // Build candidate list
        const candidates: JobRec[] = [
          ...oppSnap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              type: "internship" as const,
              collection: "opportunities" as const,
              appCollection: "internshipApplications" as const,
              title: data.title || "Internship",
              companyName: data.companyName || "C Found Technologies",
              location: data.location || data.city
                ? [data.city, data.state, data.country].filter(Boolean).join(", ")
                : "India",
              mode: data.mode || "On-site",
              skills: Array.isArray(data.skills) ? data.skills : [],
              department: data.department || "",
              experience: data.experience || "",
              freshersAllowed: data.freshersAllowed ?? true,
              educationRequirement: data.educationRequirement || "",
              slug: data.slug || d.id,
              minAmount: data.minAmount,
              maxAmount: data.maxAmount,
              compType: data.paymentType || data.compType,
              internshipType: data.internshipType,
              status: data.status,
              matchScore: 0,
              matchReasons: [],
            };
          }),
          ...jobSnap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              type: "job" as const,
              collection: "careers" as const,
              appCollection: "jobApplications" as const,
              title: data.title || "Job",
              companyName: data.companyName || "C Found Technologies",
              location: data.location || data.officeLocation
                ? [data.city, data.state, data.country].filter(Boolean).join(", ")
                : "India",
              mode: data.mode || "On-site",
              skills: Array.isArray(data.skills) ? data.skills : [],
              department: data.department || "",
              experience: data.experience || "",
              freshersAllowed: data.freshersAllowed ?? false,
              educationRequirement: data.educationRequirement || "",
              slug: data.slug || d.id,
              minAmount: data.minAmount,
              maxAmount: data.maxAmount,
              compType: data.compType,
              jobType: data.jobType,
              status: data.status,
              matchScore: 0,
              matchReasons: [],
            };
          }),
        ];

        // Score and sort
        const scored = candidates.map(job => {
          const { score, reasons } = scoreJob(job, profile, userSkills, userRole, userCity, userCountry);
          return { ...job, matchScore: score, matchReasons: reasons };
        });

        // Sort: already-applied go to bottom; rest by score desc
        scored.sort((a, b) => {
          const aApplied = applied.has(a.id) ? 1 : 0;
          const bApplied = applied.has(b.id) ? 1 : 0;
          if (aApplied !== bApplied) return aApplied - bApplied;
          return b.matchScore - a.matchScore;
        });

        setRecs(scored.slice(0, 6));
      } catch (err) {
        console.error("Recommendations fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, profile]);

  // ── Apply flow ─────────────────────────────────────────────────────────────
  const handleApply = (job: JobRec) => {
    if (!user || !profile) { router.push("/login"); return; }
    if (!completion.isComplete) {
      toast.error("Complete your profile before applying.");
      router.push("/profile");
      return;
    }
    if (appliedIds.has(job.id)) {
      toast("Already applied!", { icon: "ℹ️" });
      return;
    }
    if (shouldSkipPopup()) {
      doQuickApply(job);
    } else {
      setPendingOpp(job);
      setShowPopup(true);
    }
  };

  const doQuickApply = async (job: JobRec) => {
    setShowPopup(false);
    setPendingOpp(null);
    setApplyingId(job.id);
    try {
      const appId = `${user!.uid}_${job.id}`;
      await setDoc(doc(db, job.appCollection, appId), {
        userId: user!.uid,
        userEmail: user!.email,
        phone: (profile as any).phone || "",
        userName: profile!.displayName,
        skills: profile!.skills || [],
        portfolioUrl: (profile as any).portfolioUrl || (profile as any).githubUrl || (profile as any).linkedinUrl || "",
        type: job.type,
        targetId: job.id,
        targetTitle: job.title,
        status: "pending",
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, job.collection, job.id), {
        applications: increment(1),
      }).catch(() => {}); // non-fatal

      try {
        await sendApplicationEmail({
          to_name: profile!.displayName,
          to_email: user!.email || "",
          role_title: job.title,
          application_type: job.type === "internship" ? "Internship" : "Job",
          user_name: profile!.displayName,
          phone: (profile as any).phone || "N/A",
          skills: profile!.skills ? profile!.skills.join(", ") : "N/A",
          portfolio_url: (profile as any).portfolioUrl || "N/A",
          user_id: user!.uid,
          profile: profile,
        });
      } catch {}

      setAppliedIds(prev => new Set([...prev, job.id]));
      toast.success(`Applied for ${job.title}!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply. Try again.");
    } finally {
      setApplyingId(null);
    }
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const visible = filter === "all" ? recs : recs.filter(r => r.type === filter);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <ApplyPopup
        open={showPopup}
        opportunity={pendingOpp ? { id: pendingOpp.id, title: pendingOpp.title, type: pendingOpp.type } : null}
        onQuickApply={() => pendingOpp && doQuickApply(pendingOpp)}
        onViewDetails={() => {
          setShowPopup(false);
          if (pendingOpp) router.push(`/${pendingOpp.type === "internship" ? "internship" : "careers"}/${pendingOpp.slug}`);
          setPendingOpp(null);
        }}
        onCancel={() => { setShowPopup(false); setPendingOpp(null); }}
        applying={!!applyingId}
      />

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Star size={17} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 tracking-tight uppercase italic">
                Recommended for You
              </h2>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                Matched to your skills, role & location
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter tabs */}
            <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-xl p-1">
              {(["all", "internship", "job"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    filter === f ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f === "all" ? "All" : f === "internship" ? "Intern" : "Jobs"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Incomplete profile nudge */}
          {isIncomplete && !loading && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5"
            >
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-800">Complete your profile for better recommendations</p>
                <p className="text-[10px] text-amber-600 mt-0.5">
                  Add your skills, role, and location to get highly accurate job matches.
                </p>
              </div>
              <Link href="/profile"
                className="shrink-0 text-[10px] font-black text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Update Now
              </Link>
            </motion.div>
          )}

          {/* Loading skeleton */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 animate-pulse">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-100 rounded-lg w-2/3" />
                      <div className="h-2.5 bg-gray-100 rounded-lg w-1/3" />
                    </div>
                    <div className="h-5 w-16 bg-gray-100 rounded-full" />
                  </div>
                  <div className="flex gap-1.5 mb-3">
                    {[1,2,3].map(j => <div key={j} className="h-5 w-14 bg-gray-100 rounded-lg" />)}
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 flex-1 bg-gray-100 rounded-xl" />
                    <div className="h-8 w-20 bg-gray-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Briefcase size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-500 mb-1">No openings found</p>
              <p className="text-xs text-gray-400 mb-4">
                {filter !== "all"
                  ? `No active ${filter} positions right now.`
                  : "No active openings match your profile yet."}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/internship"
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-colors"
                >
                  <GraduationCap size={13} /> Internships
                </Link>
                <Link href="/careers"
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-4 py-2 text-xs font-bold transition-colors"
                >
                  <Briefcase size={13} /> Jobs
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {visible.map((job, idx) => {
                  const alreadyApplied = appliedIds.has(job.id);
                  const isApplying = applyingId === job.id;
                  const detailHref = `/${job.type === "internship" ? "internship" : "careers"}/${job.slug}`;

                  const compString = (() => {
                    if (!job.minAmount && !job.maxAmount) return null;
                    const sym = job.compType === "stipend" ? "Stipend" : "₹";
                    if (job.minAmount && job.maxAmount)
                      return `${sym} ${Number(job.minAmount).toLocaleString()} – ${Number(job.maxAmount).toLocaleString()}`;
                    if (job.maxAmount) return `Up to ${sym} ${Number(job.maxAmount).toLocaleString()}`;
                    return null;
                  })();

                  return (
                    <motion.div
                      layout
                      key={job.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`group relative border rounded-xl overflow-hidden transition-all duration-200 ${
                        alreadyApplied
                          ? "border-green-100 bg-green-50/40"
                          : "border-gray-100 bg-white hover:border-blue-100 hover:shadow-md"
                      }`}
                    >
                      {/* Left accent bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                        job.type === "internship" ? "bg-blue-500" : "bg-green-500"
                      }`} />

                      <div className="pl-4 pr-4 pt-4 pb-3">
                        {/* Top row: type badge + match score */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              job.type === "internship"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-green-50 text-green-700"
                            }`}>
                              {job.type === "internship" ? "Internship" : "Full-time"}
                            </span>
                            {job.mode && (
                              <span className="text-[9px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                {job.mode}
                              </span>
                            )}
                            {job.freshersAllowed && (
                              <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                Freshers OK
                              </span>
                            )}
                          </div>
                          <MatchBadge score={job.matchScore} />
                        </div>

                        {/* Title + Company */}
                        <h3 className="font-black text-gray-900 uppercase italic tracking-tight text-sm leading-tight mb-0.5">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold mb-2">
                          <Building2 size={11} className="shrink-0" />
                          <span className="truncate">{job.companyName}</span>
                        </div>

                        {/* Location + comp */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 mb-3">
                          <span className="flex items-center gap-1 shrink-0">
                            <MapPin size={10} /> {job.location || "India"}
                          </span>
                          {compString && (
                            <span className="flex items-center gap-1 shrink-0 text-emerald-600 font-semibold">
                              {compString}
                            </span>
                          )}
                          {job.experience && (
                            <span className="flex items-center gap-1 shrink-0">
                              <Clock size={10} /> {job.experience}
                            </span>
                          )}
                        </div>

                        {/* Skills */}
                        {job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {job.skills.slice(0, 4).map((s, i) => (
                              <span key={i}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                                  (profile?.skills || []).map((us: string) => us.toLowerCase()).some(
                                    (us: string) => s.toLowerCase().includes(us) || us.includes(s.toLowerCase())
                                  )
                                    ? "bg-blue-50 border-blue-100 text-blue-700"
                                    : "bg-gray-50 border-gray-100 text-gray-500"
                                }`}
                              >
                                {s}
                              </span>
                            ))}
                            {job.skills.length > 4 && (
                              <span className="text-[10px] font-semibold text-gray-400 px-2 py-0.5">
                                +{job.skills.length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Match reasons */}
                        {job.matchReasons.length > 0 && !alreadyApplied && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {job.matchReasons.map((r, i) => (
                              <span key={i}
                                className="flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"
                              >
                                <CheckCircle size={9} /> {r}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-1">
                          {alreadyApplied ? (
                            <>
                              <div className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 border border-green-200 text-green-700 rounded-xl py-2 text-xs font-bold">
                                <CheckCircle size={13} /> Applied
                              </div>
                              <Link href={detailHref}
                                className="flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                              >
                                <Eye size={13} /> View
                              </Link>
                            </>
                          ) : (
                            <>
                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleApply(job)}
                                disabled={!!applyingId}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl py-2 text-xs font-black transition-colors"
                              >
                                {isApplying ? (
                                  <><Loader2 size={12} className="animate-spin" /> Applying…</>
                                ) : (
                                  <><Zap size={12} /> Quick Apply</>
                                )}
                              </motion.button>
                              <Link href={detailHref}
                                className="flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                              >
                                <ExternalLink size={12} /> Details
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Footer links */}
          {!loading && visible.length > 0 && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <Link href="/internship"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
              >
                <GraduationCap size={12} /> All Internships <ArrowRight size={11} />
              </Link>
              <div className="w-px bg-gray-100" />
              <Link href="/careers"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold text-green-700 hover:bg-green-50 transition-colors border border-transparent hover:border-green-100"
              >
                <Briefcase size={12} /> All Jobs <ArrowRight size={11} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
