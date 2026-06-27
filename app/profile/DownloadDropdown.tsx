'use client';
// DownloadDropdown.tsx — Premium Resume Download button with dropdown

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, FileText, FileCode2, ChevronDown, Loader2, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { ProfileData } from '../lib/resumeBuilder';

interface DownloadDropdownProps {
  profileData: ProfileData;
  /** Profile is 100% complete (all required sections filled in). */
  isProfileComplete: boolean;
  /** A custom photo has been uploaded (not the Google/default avatar). */
  hasCustomPhoto: boolean;
  /** Stretch to fill its container — used in the mobile action bar. */
  fullWidth?: boolean;
}

export default function DownloadDropdown({
  profileData,
  isProfileComplete,
  hasCustomPhoto,
  fullWidth = false,
}: DownloadDropdownProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState<'pdf' | 'docx' | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isLoading = generating !== null;
  const isEligible = isProfileComplete && hasCustomPhoto;

  // Reason shown as a tooltip (desktop hover) and as a toast (any tap while gated).
  // Photo check takes priority since it's the quicker fix, then completion.
  const blockedReason = !hasCustomPhoto
    ? 'Upload a profile photo to enable resume download.'
    : !isProfileComplete
    ? 'Complete your profile to enable resume download.'
    : '';

  const handleTriggerClick = () => {
    if (isLoading) return;

    if (!isEligible) {
      if (!hasCustomPhoto) {
        toast('📷 Upload a profile photo to download your C Found Resume.');
      } else {
        toast('⚠️ Complete your C Found Resume profile to download your resume.');
      }
      return;
    }

    setOpen((o) => !o);
  };

  const handleDownload = async (type: 'pdf' | 'docx') => {
    if (generating) return;

    // Defensive re-check in case state changed between opening the menu and clicking an option.
    if (!isEligible) {
      setOpen(false);
      if (!hasCustomPhoto) {
        toast('📷 Upload a profile photo to download your C Found Resume.');
      } else {
        toast('⚠️ Complete your C Found Resume profile to download your resume.');
      }
      return;
    }

    setOpen(false);
    setGenerating(type);
    toast.success('✅ Resume ready to download.');

    try {
      if (type === 'pdf') {
        const { generatePDF } = await import('../lib/resumeBuilder');
        await generatePDF(profileData);
      } else {
        const { generateDOCX } = await import('../lib/resumeBuilder');
        await generateDOCX(profileData);
      }
    } catch (err) {
      console.error('Resume generation failed:', err);
      toast.error("❌ Couldn't generate your resume. Please try again.");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div ref={ref} className={`relative ${fullWidth ? 'flex-1' : ''}`}>
      {/* Trigger button */}
      <motion.button
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        type="button"
        onClick={handleTriggerClick}
        disabled={isLoading}
        title={!isEligible && !isLoading ? blockedReason : undefined}
        aria-disabled={!isEligible}
        className={`${fullWidth ? 'w-full' : ''} px-5 py-2.5 lg:py-2.5 rounded-2xl font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-70 ${
          isEligible
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-blue-50 text-blue-400 hover:bg-blue-100 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Generating {generating?.toUpperCase()}...
          </>
        ) : isEligible ? (
          <>
            <Download size={15} />
            Download Resume
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </>
        ) : (
          <>
            <Lock size={14} />
            Download Resume
          </>
        )}
      </motion.button>

      {/* Helper text when gated — only needed where there's no hover tooltip to rely on (mobile) */}
      {!isEligible && !isLoading && fullWidth && (
        <p className="mt-1.5 text-[11px] text-gray-400 text-center px-1 leading-tight">
          {blockedReason}
        </p>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {open && isEligible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute ${fullWidth ? 'left-0 right-0' : 'right-0 w-52'} top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50`}
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div className="p-1.5">
              <button
                onClick={() => handleDownload('pdf')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                  <FileText size={15} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Download PDF</p>
                  <p className="text-[10px] text-gray-400">ATS-friendly · Print ready</p>
                </div>
              </button>

              <div className="my-1 h-px bg-gray-100 mx-2" />

              <button
                onClick={() => handleDownload('docx')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                  <FileCode2 size={15} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Download Word</p>
                  <p className="text-[10px] text-gray-400">Editable · .docx format</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}