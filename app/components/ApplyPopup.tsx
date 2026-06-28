"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Zap, Eye, Briefcase } from "lucide-react";

const STORAGE_KEY = "cfound_apply_skip_until";

export function shouldSkipPopup(): boolean {
  try {
    const until = localStorage.getItem(STORAGE_KEY);
    if (!until) return false;
    return Date.now() < parseInt(until, 10);
  } catch {
    return false;
  }
}

export function setSkipPopup() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + 60 * 60 * 1000));
  } catch {}
}

interface ApplyPopupProps {
  open: boolean;
  opportunity: { id: string; title: string; type?: string } | null;
  onQuickApply: () => void;
  onViewDetails: () => void;
  onCancel: () => void;
  applying?: boolean;
}

export default function ApplyPopup({
  open,
  opportunity,
  onQuickApply,
  onViewDetails,
  onCancel,
  applying = false,
}: ApplyPopupProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleQuickApply = () => {
    if (dontAskAgain) setSkipPopup();
    onQuickApply();
  };

  return (
    <AnimatePresence>
      {open && opportunity && (
        <>
          <motion.div
            key="apply-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            key="apply-modal"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="fixed inset-0 z-[151] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-6 relative">
              {/* Close */}
              <button
                onClick={onCancel}
                className="absolute top-4 right-4 w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
              >
                <X size={15} />
              </button>

              {/* Icon */}
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <Briefcase size={22} className="text-blue-600" />
              </div>

              {/* Title */}
              <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tight leading-tight mb-1">
                Apply for this opportunity
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                <span className="font-semibold text-gray-700">{opportunity.title}</span>
                {" — "}how would you like to proceed?
              </p>

              {/* Actions */}
              <div className="space-y-2.5 mb-5">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleQuickApply}
                  disabled={applying}
                  className="w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl px-4 py-3 text-sm font-bold transition-colors"
                >
                  {applying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Zap size={16} className="shrink-0" />
                      <div className="text-left">
                        <div>Quick Apply</div>
                        <div className="text-[10px] font-normal opacity-75">Submit with your profile instantly</div>
                      </div>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onViewDetails}
                  className="w-full flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
                >
                  <Eye size={16} className="shrink-0 text-gray-500" />
                  <div className="text-left">
                    <div>View Job Details</div>
                    <div className="text-[10px] font-normal text-gray-400">See the full listing first</div>
                  </div>
                </motion.button>
              </div>

              {/* Don't ask again */}
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => setDontAskAgain(v => !v)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                    dontAskAgain
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300 group-hover:border-blue-400"
                  }`}
                >
                  {dontAskAgain && (
                    <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-gray-500 select-none">
                  Don&apos;t ask again for{" "}
                  <span className="font-semibold text-gray-700">1 hour</span>{" "}
                  — use Quick Apply directly
                </span>
              </label>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
