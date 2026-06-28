"use client";
<<<<<<< Updated upstream
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Settings, ExternalLink, ShieldCheck, Briefcase, BookOpen, Activity, Clock,
  ArrowRight, Zap, MapPin, X, Bell, Eye, Calendar, Users, Download, TrendingUp,
  CheckCircle, GraduationCap, Lightbulb, SlidersHorizontal, AtSign, Star,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getProfileCompletion } from '../lib/profileUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Application {
  id: string;
  category: 'Internship' | 'Job' | 'Academy';
  status: string;
  targetTitle?: string;
  jobTitle?: string;
  title?: string;
  createdAt?: string;
  appliedAt?: string;
  description?: string;
  skills?: string[];
  hrRemarks?: string;
  interviewDetails?: string;
  rejectionReason?: string;
  email?: string;
  userEmail?: string;
  phone?: string;
  resume_url?: string;
}

interface RecommendedItem {
  id: string;
  title: string;
  type: 'Job' | 'Internship' | 'Course';
  mode?: string;
  category?: string;
  matchedSkills: string[];
  matchScore: number;
  href: string;
}

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  time: string;
  timestamp: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const JOB_STAGES = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Joined'];
const ACADEMY_STAGES = ['Enrolled', 'In Progress', 'Assessment', 'Completed', 'Certificate'];
=======
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
import RecommendedJobs from "../components/RecommendedJobs";

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
>>>>>>> Stashed changes

function getStageIndex(app: Application): number {
  const s = app.status;
<<<<<<< Updated upstream
  if (s === 'interviewScheduled' || app.interviewDetails) return 2;
  if (s === 'accepted') return app.category === 'Academy' ? 3 : 3;
  if (s === 'enrolled') return 0;
  if (s === 'reviewed') return 1;
  if (s === 'rejected') return app.category === 'Academy' ? 4 : 4;
=======
  if (s === "pending") return 0;
  if (s === "reviewed") return 1;
  if (s === "interviewScheduled" || app.interviewDetails) return 2;
  if (s === "accepted" || s === "enrolled") return app.category === "Academy" ? 0 : 3;
>>>>>>> Stashed changes
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

function getCategoryIcon(category: string) {
  if (category === 'Internship') return <Briefcase size={16} />;
  if (category === 'Job') return <Zap size={16} />;
  if (category === 'Academy') return <BookOpen size={16} />;
  return <Activity size={16} />;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'accepted':
    case 'enrolled': return 'text-green-600 bg-green-50 border-green-200';
    case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
    case 'reviewed': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'interviewScheduled': return 'text-purple-600 bg-purple-50 border-purple-200';
    default: return 'text-amber-600 bg-amber-50 border-amber-200';
  }
}

function formatStatusLabel(status: string) {
  switch (status) {
    case 'interviewScheduled': return 'Interview';
    case 'enrolled': return 'Enrolled';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function safeDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'object' && val !== null && 'toDate' in val) {
    try { return (val as { toDate(): Date }).toDate(); } catch { return null; }
  }
  return null;
}

function formatDate(val: unknown): string {
  const d = safeDate(val);
  if (!d) return 'N/A';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(val: unknown): string {
  const d = safeDate(val);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function skillMatchScore(itemSkills: string[], userSkills: string[]): number {
  if (!userSkills.length || !itemSkills.length) return 0;
  const userLower = userSkills.map(s => s.toLowerCase());
  const matched = itemSkills.filter(s => userLower.includes(s.toLowerCase()));
  return Math.round((matched.length / Math.max(itemSkills.length, userSkills.length)) * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: {
  label: string; value: number; icon: React.ReactNode; color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-black text-gray-900">{value}</div>
    </motion.div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="72" height="72" className="-rotate-90" aria-label={`${pct}% complete`}>
      <circle cx="36" cy="36" r={r} strokeWidth="5" stroke="#e5e7eb" fill="none" />
      <circle cx="36" cy="36" r={r} strokeWidth="5" stroke="#2563eb" fill="none"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      <text x="36" y="36" dominantBaseline="middle" textAnchor="middle"
        fill="#1f2937" fontSize={13} fontWeight={900}
        transform="rotate(90 36 36)">{pct}%</text>
    </svg>
  );
}

function PipelineTimeline({ stages, activeIdx }: { stages: string[]; activeIdx: number }) {
  return (
    <div className="flex items-center gap-0 mt-3 w-full overflow-x-auto pb-1">
      {stages.map((stage, i) => (
        <div key={`${stage}-${i}`} className="flex-1 flex flex-col items-center min-w-0">
          <div className="flex items-center w-full">
            {i > 0 && <div className={`flex-1 h-[2px] ${i <= activeIdx ? 'bg-blue-500' : 'bg-gray-200'}`} />}
            <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
              i < activeIdx ? 'bg-blue-500 border-blue-500' :
              i === activeIdx ? 'bg-blue-500 border-blue-500 ring-2 ring-blue-200' :
              'bg-white border-gray-300'
            }`} />
            {i < stages.length - 1 && <div className={`flex-1 h-[2px] ${i < activeIdx ? 'bg-blue-500' : 'bg-gray-200'}`} />}
          </div>
          <span className={`text-[8px] font-semibold mt-1 text-center leading-tight ${i === activeIdx ? 'text-blue-600' : 'text-gray-400'}`}>
            {stage}
          </span>
        </div>
      ))}
    </div>
  );
}

function UsernameRequiredModal({ open, onClose, onChoose }: {
  open: boolean; onClose: () => void; onChoose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
<<<<<<< Updated upstream
  const { user, profile, isAdmin } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommended, setRecommended] = useState<RecommendedItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [sortOrder, setSortOrder] = useState<'recent' | 'newest' | 'oldest'>('recent');
  const [showSort, setShowSort] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameWarningDismissed, setUsernameWarningDismissed] = useState(false);
  const router = useRouter();

  const profileData = profile as Record<string, unknown> | null;
  const userSkills: string[] = Array.isArray(profileData?.skills)
    ? (profileData!.skills as string[])
    : [];
  const profileCompletion = useMemo(() => getProfileCompletion(profile), [profile]);

  useEffect(() => {
    if (isAdmin) router.push('/admin');
  }, [isAdmin, router]);

  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchRecommended();
    }
  }, [user, userSkills.join(',')]);

  // ── Fetch user applications ──────────────────────────────────────────────

  const fetchApplications = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [appSnap, internSnap, academySnap] = await Promise.all([
        getDocs(query(collection(db, 'jobApplications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'internshipApplications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'courseEnrollments'), where('userId', '==', user.uid), orderBy('appliedAt', 'desc'))),
      ]);

      const jobs: Application[] = appSnap.docs.map(d => ({
        id: d.id,
        ...d.data() as Omit<Application, 'id' | 'category'>,
        category: 'Job' as const,
      }));
      const interns: Application[] = internSnap.docs.map(d => ({
        id: d.id,
        ...d.data() as Omit<Application, 'id' | 'category'>,
        category: 'Internship' as const,
      }));
      const academy: Application[] = academySnap.docs.map(d => ({
        id: d.id,
        ...d.data() as Omit<Application, 'id' | 'category'>,
        category: 'Academy' as const,
      }));

      const all = [...jobs, ...interns, ...academy].sort((a, b) => {
        const ta = safeDate(a.createdAt || a.appliedAt)?.getTime() ?? 0;
        const tb = safeDate(b.createdAt || b.appliedAt)?.getTime() ?? 0;
        return tb - ta;
      });

      setApplications(all);

      // Build activity feed from real application events
      const events: ActivityItem[] = [];
      all.forEach(app => {
        const appDate = safeDate(app.createdAt || app.appliedAt);
        const ts = appDate?.getTime() ?? 0;
        const label = app.targetTitle || app.jobTitle || app.title || 'Opportunity';

        events.push({
          id: `applied-${app.id}`,
          icon: <Briefcase size={16} className="text-blue-500" />,
          bg: 'bg-blue-50',
          text: `Applied for ${label}`,
          time: timeAgo(app.createdAt || app.appliedAt),
          timestamp: ts,
        });

        if (app.status === 'reviewed' || app.hrRemarks) {
          events.push({
            id: `reviewed-${app.id}`,
            icon: <Eye size={16} className="text-purple-500" />,
            bg: 'bg-purple-50',
            text: `Your application for ${label} was reviewed`,
            time: timeAgo(app.createdAt || app.appliedAt),
            timestamp: ts + 1,
          });
        }
        if (app.interviewDetails || app.status === 'interviewScheduled') {
          events.push({
            id: `interview-${app.id}`,
            icon: <Calendar size={16} className="text-green-500" />,
            bg: 'bg-green-50',
            text: `Interview scheduled for ${label}`,
            time: timeAgo(app.createdAt || app.appliedAt),
            timestamp: ts + 2,
          });
        }
        if (app.status === 'accepted' || app.status === 'enrolled') {
          events.push({
            id: `accepted-${app.id}`,
            icon: <CheckCircle size={16} className="text-emerald-500" />,
            bg: 'bg-emerald-50',
            text: `Accepted for ${label}`,
            time: timeAgo(app.createdAt || app.appliedAt),
            timestamp: ts + 3,
          });
        }
      });

      events.sort((a, b) => b.timestamp - a.timestamp);
      setActivity(events.slice(0, 5));
    } catch (err) {
      console.error('Dashboard: fetchApplications error', err);
      toast.error('Failed to load applications.');
=======
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
      const recentApps: any[] = allApps.slice(0, 5);
      recentApps.forEach(a => {
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
>>>>>>> Stashed changes
    } finally {
      setDataLoading(false);
    }
  }, [user, isAdmin]);

<<<<<<< Updated upstream
  // ── Fetch skill-matched recommendations ──────────────────────────────────

  const fetchRecommended = async () => {
    setRecLoading(true);
    try {
      // Fetch active jobs, internships, courses in parallel
      const [jobsSnap, internsSnap, coursesSnap] = await Promise.all([
        getDocs(query(collection(db, 'careers'), where('status', '==', 'active'), limit(20))),
        getDocs(query(collection(db, 'opportunities'), where('type', '==', 'internship'), where('status', 'in', ['active', 'featured']), limit(20))),
        getDocs(query(collection(db, 'courses'), where('status', '==', 'active'), limit(20))),
      ]);

      const items: RecommendedItem[] = [];

      jobsSnap.docs.forEach(d => {
        const data = d.data();
        const itemSkills: string[] = Array.isArray(data.skills) ? data.skills : [];
        const score = userSkills.length > 0 ? skillMatchScore(itemSkills, userSkills) : 50;
        items.push({
          id: d.id,
          title: data.title || 'Job Opening',
          type: 'Job',
          mode: data.mode || data.workMode || 'On-site',
          matchedSkills: itemSkills.filter(s => userSkills.map(u => u.toLowerCase()).includes(s.toLowerCase())).slice(0, 3),
          matchScore: score,
          href: `/careers/${data.slug || d.id}`,
        });
      });

      internsSnap.docs.forEach(d => {
        const data = d.data();
        const itemSkills: string[] = Array.isArray(data.skills) ? data.skills : [];
        const score = userSkills.length > 0 ? skillMatchScore(itemSkills, userSkills) : 50;
        items.push({
          id: d.id,
          title: data.title || 'Internship',
          type: 'Internship',
          mode: data.mode || 'Remote',
          matchedSkills: itemSkills.filter(s => userSkills.map(u => u.toLowerCase()).includes(s.toLowerCase())).slice(0, 3),
          matchScore: score,
          href: `/internship/${d.id}`,
        });
      });

      coursesSnap.docs.forEach(d => {
        const data = d.data();
        // courses don't always have skill tags — treat category as a soft match
        const cat: string = data.category || '';
        const skillMatch = userSkills.some(s =>
          cat.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(cat.toLowerCase().split(' ')[0])
        );
        const score = userSkills.length === 0 ? 50 : skillMatch ? 70 : 30;
        items.push({
          id: d.id,
          title: data.title || 'Course',
          type: 'Course',
          category: cat,
          matchedSkills: [],
          matchScore: score,
          href: `/courses`,
        });
      });

      // Sort by match score descending; if user has no skills show latest (score = 50)
      items.sort((a, b) => b.matchScore - a.matchScore);
      setRecommended(items.slice(0, 4));
    } catch (err) {
      console.error('Dashboard: fetchRecommended error', err);
    } finally {
      setRecLoading(false);
    }
  };

  // ── Derived counts (real) ────────────────────────────────────────────────

  const internsCount = applications.filter(a => a.category === 'Internship').length;
  const jobsCount = applications.filter(a => a.category === 'Job').length;
  const academyCount = applications.filter(a => a.category === 'Academy').length;
  const pending = applications.filter(a => a.status === 'pending').length;
  const accepted = applications.filter(a => a.status === 'accepted' || a.status === 'enrolled').length;

  // ── Filtered + sorted pipeline ───────────────────────────────────────────

  const filteredApps = useMemo(() => {
    let list = activeTab === 'All'
      ? applications
      : applications.filter(a => a.category === activeTab);
    if (sortOrder === 'newest') {
      list = [...list].sort((a, b) =>
        (safeDate(b.createdAt || b.appliedAt)?.getTime() ?? 0) -
        (safeDate(a.createdAt || a.appliedAt)?.getTime() ?? 0)
      );
    } else if (sortOrder === 'oldest') {
      list = [...list].sort((a, b) =>
        (safeDate(a.createdAt || a.appliedAt)?.getTime() ?? 0) -
        (safeDate(b.createdAt || b.appliedAt)?.getTime() ?? 0)
      );
    }
=======
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
>>>>>>> Stashed changes
    return list;
  }, [applications, activeTab, sortOrder]);

  const handleChooseUsername = () => {
    setShowUsernameModal(false);
<<<<<<< Updated upstream
    router.push('/profile?action=choose-username');
  };

  const username = (profileData as Record<string, unknown> | null)?.username as string | undefined;
  const photoURL = user?.photoURL || (profileData?.photoURL as string | undefined);
  const displayName = (profileData?.displayName as string | undefined) || user?.displayName || 'Member';
=======
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
>>>>>>> Stashed changes

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-20 px-4 md:px-6">
      <UsernameRequiredModal
        open={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onChoose={handleChooseUsername}
      />

<<<<<<< Updated upstream
      <div className="max-w-[1400px] mx-auto">

        {/* Username warning */}
        {!username && !usernameWarningDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-start gap-4 bg-white border-2 border-blue-200 rounded-2xl p-4 shadow-sm"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <AtSign size={18} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">Choose your username</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                People can't visit your public profile until you create one.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <button onClick={handleChooseUsername} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">
                  Choose Username
                </button>
                <button onClick={() => setUsernameWarningDismissed(true)} className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors">
=======
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
>>>>>>> Stashed changes
                  Later
                </button>
              </div>
            </div>
<<<<<<< Updated upstream
            <button onClick={() => setUsernameWarningDismissed(true)} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 p-0.5">
=======
            <button onClick={() => setUsernameWarningDismissed(true)}
              className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 p-0.5"
            >
>>>>>>> Stashed changes
              <X size={16} />
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

<<<<<<< Updated upstream
          {/* ── Left Sidebar ──────────────────────────────────────────── */}
=======
          {/* ── Left Sidebar ────────────────────────────────────────────── */}
>>>>>>> Stashed changes
          <aside className="xl:col-span-3 space-y-4">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
            >
              {/* Avatar + Info */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-3">
<<<<<<< Updated upstream
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt={displayName}
=======
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt={profile?.displayName || "Profile"}
>>>>>>> Stashed changes
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
                    />
                  ) : (
<<<<<<< Updated upstream
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 border-4 border-white shadow-md flex items-center justify-center">
                      <User size={32} className="text-gray-400" />
=======
                    <div className="w-20 h-20 rounded-2xl bg-gray-200 border-4 border-white shadow-md flex items-center justify-center">
                      <User size={32} className="text-gray-500" />
>>>>>>> Stashed changes
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow">
                    <ShieldCheck size={12} className="text-white" />
                  </div>
                </div>
<<<<<<< Updated upstream
                <h2 className="text-lg font-black tracking-tight text-gray-900 italic uppercase">{displayName}</h2>
                {username && (
                  <p className="text-sm font-semibold text-gray-400 mt-0.5">@{username}</p>
=======
                <h2 className="text-lg font-black tracking-tight text-gray-900 italic uppercase">
                  {profile?.displayName || user?.displayName}
                </h2>
                {(profile as any)?.username && (
                  <p className="text-sm font-semibold text-gray-400 mt-0.5">@{(profile as any).username}</p>
>>>>>>> Stashed changes
                )}
                <div className="flex items-center gap-1 mt-0.5">
                  <CheckCircle size={12} className="text-green-500" />
                  <span className="text-xs font-semibold text-gray-500">Identity Verified</span>
                </div>
                <div className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
<<<<<<< Updated upstream
                  {(profileData?.primaryRole as string | undefined) || (profileData?.currentRole as string | undefined) || 'Member'}
=======
                  {(profile as any)?.primaryRole || "Member"}
                </div>
                <div className="flex items-center gap-1 mt-1.5 text-gray-400 text-xs">
                  <MapPin size={11} />
                  <span>{profile?.city ? `${profile.city}, ` : ""}{profile?.country || "India"}</span>
>>>>>>> Stashed changes
                </div>
                {(profileData?.country as string | undefined) && (
                  <div className="flex items-center gap-1 mt-1.5 text-gray-400 text-xs">
                    <MapPin size={11} />
                    <span>{profileData.country as string}</span>
                  </div>
                )}
              </div>

              {/* Profile Completion */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-gray-600">Profile Completion</span>
                  <span className="text-xs font-black text-blue-600">{profileCompletion.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
<<<<<<< Updated upstream
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-700"
                    style={{ width: `${profileCompletion.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {profileCompletion.isComplete ? 'Profile complete!' : 'Complete your profile to increase visibility'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mb-6">
                <Link
                  href="/profile"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors"
                >
                  <Settings size={14} />
                  Modify Profile
                </Link>
                <button
                  onClick={() => {
                    if (username) {
                      window.open(`/${username}`, '_blank', 'noopener,noreferrer');
                    } else {
                      setShowUsernameModal(true);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                >
                  <Eye size={14} />
                  View Public Profile
                </button>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors"
                  >
                    <ShieldCheck size={14} />
                    Admin Dashboard
                  </Link>
                )}
              </div>

              {/* Stats (real) */}
=======
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
>>>>>>> Stashed changes
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
                    <CheckCircle size={14} className="text-green-500" />
                  </div>
<<<<<<< Updated upstream
                  <div className="text-lg font-black text-gray-900">{accepted}</div>
                  <div className="text-[10px] text-gray-400 font-medium">Accepted</div>
                </div>
                <div>
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-1">
                    <Clock size={14} className="text-amber-500" />
                  </div>
                  <div className="text-lg font-black text-gray-900">{pending}</div>
                  <div className="text-[10px] text-gray-400 font-medium">Pending</div>
=======
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
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
          {/* ── Center Content ─────────────────────────────────────────── */}
=======
          {/* ── Center ─────────────────────────────────────────────────── */}
>>>>>>> Stashed changes
          <main className="xl:col-span-6 space-y-6">

            {/* Stat Cards */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-5 gap-3"
            >
<<<<<<< Updated upstream
              <StatCard label="Internships" value={internsCount} color="bg-blue-50 text-blue-500" icon={<GraduationCap size={16} />} />
              <StatCard label="Jobs" value={jobsCount} color="bg-green-50 text-green-500" icon={<Briefcase size={16} />} />
              <StatCard label="Academy" value={academyCount} color="bg-purple-50 text-purple-500" icon={<BookOpen size={16} />} />
              <StatCard label="Pending" value={pending} color="bg-amber-50 text-amber-500" icon={<Clock size={16} />} />
              <StatCard label="Accepted" value={accepted} color="bg-emerald-50 text-emerald-500" icon={<CheckCircle size={16} />} />
=======
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
>>>>>>> Stashed changes
            </motion.div>

            {/* Pipeline */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">My Pipeline</h2>
<<<<<<< Updated upstream
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Tabs */}
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
                    {(['All', 'Internship', 'Job', 'Academy'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          activeTab === tab ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'
=======
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
                    {["All", "Internship", "Job", "Academy"].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          activeTab === tab ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-700"
>>>>>>> Stashed changes
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
<<<<<<< Updated upstream
                  {/* Sort */}
=======

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                    const stages = app.category === 'Academy' ? ACADEMY_STAGES : JOB_STAGES;
                    const stageIdx = getStageIndex(app);
                    const appTitle = app.targetTitle || app.jobTitle || app.title || 'Opportunity';
=======
                    const stages = app.category === "Academy" ? ACADEMY_STAGES : JOB_STAGES;
                    const activeIdx = getStageIndex(app);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                                {appTitle}
=======
                                {app.targetTitle || app.jobTitle || "Opportunity"}
>>>>>>> Stashed changes
                              </h3>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(app.status)}`}>
                                {formatStatusLabel(app.status)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 font-medium">
                              <span className="flex items-center gap-1"><Briefcase size={10} /> C Found</span>
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
<<<<<<< Updated upstream
                                Applied {formatDate(app.createdAt || app.appliedAt)}
=======
                                {new Date(app.createdAt || app.appliedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
>>>>>>> Stashed changes
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
                          <PipelineTimeline stages={stages} activeIdx={stageIdx} />
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {filteredApps.length > 0 && (
<<<<<<< Updated upstream
                <div className="border-t border-gray-100 px-5 py-3">
                  <Link
                    href={activeTab === 'Academy' ? '/courses' : activeTab === 'Job' ? '/careers' : activeTab === 'Internship' ? '/internship' : '/careers'}
                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors py-1"
                  >
                    Explore More Openings
                    <ArrowRight size={14} />
=======
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
>>>>>>> Stashed changes
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Recommended Jobs */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <RecommendedJobs />
            </motion.div>
          </main>

          {/* ── Right Sidebar ──────────────────────────────────────────── */}
          <aside className="xl:col-span-3 space-y-4">

<<<<<<< Updated upstream
            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-900 text-base">Recent Activity</h3>
=======
            {/* Notifications */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-900 text-base">Notifications</h3>
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                  {notifications.length} recent
                </span>
>>>>>>> Stashed changes
              </div>
              {loading ? (
                <div className="py-8 text-center">
                  <div className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : activity.length === 0 ? (
                <div className="py-6 text-center">
                  <Bell size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">No activity yet. Apply to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activity.map(n => (
                    <div key={n.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 ${n.bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
                        {n.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 leading-snug">{n.text}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                    </div>
<<<<<<< Updated upstream
                  ))}
                </div>
              )}
            </motion.div>

            {/* Recommended for You */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-black text-gray-900 text-base">Recommended for You</h3>
              </div>
              {userSkills.length > 0 ? (
                <p className="text-[11px] text-gray-400 mb-4">Based on your skills: {userSkills.slice(0, 3).join(', ')}{userSkills.length > 3 ? ` +${userSkills.length - 3}` : ''}</p>
              ) : (
                <p className="text-[11px] text-gray-400 mb-4">
                  <Link href="/profile" className="text-blue-500 hover:underline font-semibold">Add skills to your profile</Link> for personalised matches.
                </p>
              )}

              {recLoading ? (
                <div className="py-8 text-center">
                  <div className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : recommended.length === 0 ? (
                <div className="py-6 text-center">
                  <Star size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400 font-medium mb-3">No openings available right now.</p>
                  <Link href="/internship" className="text-xs font-bold text-blue-600 hover:underline">Browse Internships</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommended.map(r => (
                    <div key={`${r.type}-${r.id}`} className="border border-gray-100 rounded-xl p-3 hover:border-blue-100 transition-all">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-gray-900 truncate">{r.title}</h4>
                          <p className="text-xs text-gray-400 font-medium">C Found</p>
                        </div>
                        {userSkills.length > 0 && r.matchScore > 0 && (
                          <span className={`text-xs font-bold shrink-0 ml-2 ${r.matchScore >= 60 ? 'text-green-600' : r.matchScore >= 30 ? 'text-amber-500' : 'text-gray-400'}`}>
                            {r.matchScore}% Match
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.type === 'Job' ? 'bg-green-50 text-green-600' :
                          r.type === 'Internship' ? 'bg-blue-50 text-blue-600' :
                          'bg-purple-50 text-purple-600'
                        }`}>{r.type}</span>
                        {r.mode && <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r.mode}</span>}
                        {r.category && <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r.category}</span>}
                      </div>
                      {r.matchedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {r.matchedSkills.map(s => (
                            <span key={s} className="text-[9px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">✓ {s}</span>
                          ))}
                        </div>
                      )}
                      <Link
                        href={r.href}
                        className="w-full block bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-xs font-bold transition-colors text-center"
                      >
                        {r.type === 'Course' ? 'View Course' : 'Apply Now'}
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2">
                <Link href="/careers" className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-gray-50 transition-colors text-center">
                  <Zap size={14} className="text-green-500" />
                  <span className="text-[10px] font-semibold text-gray-500">Jobs</span>
                </Link>
                <Link href="/internship" className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-gray-50 transition-colors text-center">
                  <GraduationCap size={14} className="text-blue-500" />
                  <span className="text-[10px] font-semibold text-gray-500">Internships</span>
                </Link>
                <Link href="/courses" className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-gray-50 transition-colors text-center">
                  <BookOpen size={14} className="text-purple-500" />
                  <span className="text-[10px] font-semibold text-gray-500">Courses</span>
                </Link>
              </div>
            </motion.div>

            {/* Profile Tips */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
=======
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
>>>>>>> Stashed changes
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-amber-500" />
<<<<<<< Updated upstream
                  <h3 className="font-black text-gray-900 text-base">Profile Tips</h3>
=======
                  <h3 className="font-black text-gray-900 text-base">Profile Strength</h3>
>>>>>>> Stashed changes
                </div>
                <ProgressRing pct={profileCompletion.percentage} />
              </div>
<<<<<<< Updated upstream
              {profileCompletion.missing.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {profileCompletion.missing.slice(0, 3).map(m => (
                    <li key={m} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                      {m}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-green-600 font-semibold mt-3">Your profile is complete! 🎉</p>
              )}
              <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 mt-3 transition-colors">
                Update Profile <ArrowRight size={13} />
              </Link>
=======
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
>>>>>>> Stashed changes
            </motion.div>
          </aside>
        </div>
      </div>
<<<<<<< Updated upstream

      {/* ── View Details Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setSelectedApp(null); }}
          >
            <motion.div
              initial={{ scale: 0.97, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: 16 }}
              className="bg-white border border-gray-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-gray-900">
                    {selectedApp.targetTitle || selectedApp.jobTitle || selectedApp.title || 'Opportunity'}
                  </h3>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1 flex items-center gap-2">
                    <span className={`w-4 h-4 rounded flex items-center justify-center ${getCategoryIconBg(selectedApp.category)}`}>
                      {getCategoryIcon(selectedApp.category)}
                    </span>
                    C Found · {selectedApp.category}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Current Status</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(selectedApp.status)}`}>
                      {formatStatusLabel(selectedApp.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Applied Date</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {formatDate(selectedApp.createdAt || selectedApp.appliedAt)}
                    </p>
                  </div>
                </div>

                {selectedApp.description && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedApp.description}</p>
                  </div>
                )}

                {Array.isArray(selectedApp.skills) && selectedApp.skills.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.skills.map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg text-gray-700">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp.hrRemarks && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1.5">HR Remarks</p>
                    <p className="text-sm text-blue-800 font-medium">{selectedApp.hrRemarks}</p>
                  </div>
                )}

                {selectedApp.interviewDetails && (
                  <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-1.5">Interview Details</p>
                    <p className="text-sm text-purple-800 font-medium whitespace-pre-wrap">{selectedApp.interviewDetails}</p>
                  </div>
                )}

                {selectedApp.rejectionReason && selectedApp.status === 'rejected' && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1.5">Feedback</p>
                    <p className="text-sm text-red-800 font-medium">{selectedApp.rejectionReason}</p>
                  </div>
                )}

                {/* Activity Timeline */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Activity Timeline</p>
                  <div className="relative border-l-2 border-gray-100 ml-3 space-y-4">
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow" />
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Applied for {selectedApp.category}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(selectedApp.createdAt || selectedApp.appliedAt)}</p>
                    </div>
                    {(selectedApp.status === 'reviewed' || selectedApp.status === 'accepted' || selectedApp.hrRemarks) && (
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow" />
                        <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">HR Reviewed Profile</p>
                        <p className="text-xs text-gray-400 mt-0.5">Application marked as reviewed</p>
                      </div>
                    )}
                    {(selectedApp.interviewDetails || selectedApp.status === 'interviewScheduled') && (
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-purple-500 border-4 border-white shadow" />
                        <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Interview Scheduled</p>
                        <p className="text-xs text-gray-400 mt-0.5">Interview details shared</p>
                      </div>
                    )}
                    {(selectedApp.status === 'accepted' || selectedApp.status === 'enrolled') && (
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow" />
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wide">
                          {selectedApp.status === 'enrolled' ? 'Enrolled' : 'Selected'}
                        </p>
                        <p className="text-xs text-green-400 mt-0.5">
                          {selectedApp.status === 'enrolled' ? 'Course enrollment confirmed' : 'Offer extended / Accepted'}
                        </p>
                      </div>
                    )}
                    {selectedApp.status === 'rejected' && (
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-red-500 border-4 border-white shadow" />
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Rejected</p>
                        <p className="text-xs text-red-400 mt-0.5">Application closed</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Applicant Data Submitted</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5">Email</span>
                      <span className="font-semibold text-gray-800 break-all">
                        {selectedApp.email || selectedApp.userEmail || user?.email || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5">Phone</span>
                      <span className="font-semibold text-gray-800">{selectedApp.phone || 'N/A'}</span>
                    </div>
                    {selectedApp.resume_url && selectedApp.resume_url !== 'N/A' && (
                      <div className="sm:col-span-2">
                        <a
                          href={selectedApp.resume_url}
                          target="_blank"
                          rel="noreferrer"
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
        )}
      </AnimatePresence>
=======
>>>>>>> Stashed changes
    </div>
  );
}