'use client';
// DownloadDropdown.tsx — Premium Resume Download button with dropdown

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, FileText, FileCode2, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { ProfileData } from '.../lib/resumeBuilder';

interface DownloadDropdownProps {
  profileData: ProfileData;
}

export default function DownloadDropdown({ profileData }: DownloadDropdownProps) {
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

  const handleDownload = async (type: 'pdf' | 'docx') => {
    if (generating) return;
    setOpen(false);
    setGenerating(type);

    try {
      if (type === 'pdf') {
        const { generatePDF } = await import('../lib/resumeBuilder');
        await generatePDF(profileData);
        toast.success('PDF resume downloaded!');
      } else {
        const { generateDOCX } = await import('../lib/resumeBuilder');
        await generateDOCX(profileData);
        toast.success('Word resume downloaded!');
      }
    } catch (err) {
      console.error('Resume generation failed:', err);
      toast.error(`Failed to generate ${type.toUpperCase()}. Please try again.`);
    } finally {
      setGenerating(null);
    }
  };

  const isLoading = generating !== null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={() => !isLoading && setOpen((o) => !o)}
        disabled={isLoading}
        className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl font-semibold shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-70"
      >
        {isLoading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Generating {generating?.toUpperCase()}...
          </>
        ) : (
          <>
            <Download size={15} />
            Download Resume
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
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