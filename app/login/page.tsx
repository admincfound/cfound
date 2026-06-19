'use client';

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';

export default function Login() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);

      await setDoc(
        doc(db, 'users', result.user.uid),
        {
          uid: result.user.uid,
          displayName: result.user.displayName || '',
          email: result.user.email || '',
          photoURL: result.user.photoURL || '',
          role:
            result.user.email === 'admin.cfound@gmail.com'
              ? 'admin'
              : 'user',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      router.replace('/dashboard');
    } catch (err: any) {
      console.error(err);

      if (err.code === 'auth/popup-closed-by-user') {
        setError(
          'Sign-in popup was closed before completion. Please try again.'
        );
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center px-6 pt-28 pb-16 md:py-20 bg-[var(--bg-main)] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-600/5 blur-[130px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md md:max-w-lg mt-10 md:mt-0 p-6 md:p-14 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] md:rounded-[3.5rem] shadow-2xl shadow-primary-600/5"
      >
        <div className="text-center mb-5 md:mb-12">
          <div className="w-16 h-16 bg-primary-600 text-white rounded-[1.25rem] mx-auto flex items-center justify-center font-bold text-3xl mb-5 shadow-xl shadow-primary-600/20">
            C
          </div>

          <h1 className="text-3xl font-bold font-display tracking-tight text-[var(--text-main)] mb-3">
            Access your workspace
          </h1>

          <p className="text-[var(--text-muted)] text-sm font-medium">
            Please sign in with your corporate or personal account to access
            applications and resources.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center"
          >
            {error}
          </motion.div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-12 md:h-14 flex items-center justify-between px-5 md:px-6 bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-bold rounded-2xl hover:bg-[var(--bg-card)] hover:border-primary-600/30 transition-all active:scale-[0.98] disabled:opacity-50 group shadow-sm"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-bold uppercase tracking-widest opacity-60">
                Authenticating
              </span>
            </div>
          ) : (
            <>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5"
              />

              <span className="text-xs md:text-sm font-bold uppercase tracking-[0.15em] flex-1 text-center">
                Continue with Google
              </span>

              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform ml-2 opacity-40"
              />
            </>
          )}
        </button>

        <div className="mt-8 pt-6 md:mt-12 md:pt-10 border-t border-[var(--border-main)] space-y-4">
          <div className="flex items-center justify-center gap-3 text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-bold">
            <ShieldCheck size={14} className="text-primary-600" />
            Secure Authentication Protocol
          </div>

          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed text-center font-medium opacity-60 px-6">
            By proceeding, you agree to our Terms of Service and Privacy
            Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}