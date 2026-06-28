"use client";
import { motion } from "motion/react";

export default function AuthLoadingScreen({ message = "Verifying your identity…" }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center">
      {/* Subtle background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative flex flex-col items-center gap-8">
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <path d="M8 8h10a6 6 0 0 1 0 12H8V8z" fill="white" />
              <circle cx="22" cy="22" r="4" fill="white" opacity="0.6" />
            </svg>
          </div>
          <span className="text-2xl font-black italic uppercase tracking-tight text-gray-900 mt-2">
            C <span className="text-blue-600">Found</span>
          </span>
        </motion.div>

        {/* Spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-3"
        >
          {/* Animated bar loader */}
          <div className="flex items-end gap-1.5 h-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 bg-blue-600 rounded-full"
                animate={{
                  height: ["12px", "28px", "12px"],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-sm font-semibold text-gray-400 tracking-wide"
          >
            {message}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
