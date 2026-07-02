"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Briefcase } from "lucide-react";
import { ensureEmployerProfile } from "../../../lib/employer/employers";

export default function LoginClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Reuses the shared Firebase Auth session. An `employers` doc is
      // created on first sign-in so this user is recognised as an employer.
      await ensureEmployerProfile(
        result.user.uid,
        result.user.email || "",
        result.user.displayName || undefined
      );
      router.replace("/employer/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed before completion. Please try again.");
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-20 bg-[var(--bg-main)] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md p-8 md:p-12 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-xl">
            <Briefcase size={26} />
          </div>
          <h1 className="text-2xl font-black italic tracking-tight text-[var(--text-main)] mb-2">
            Employer Login
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Sign in to manage your jobs, applicants, and company profile.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-14 flex items-center justify-between px-6 bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-bold rounded-2xl hover:border-blue-600/40 transition-all active:scale-[0.98] disabled:opacity-50 group"
        >
          {loading ? (
            <div className="flex items-center gap-3 mx-auto">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform ml-2 opacity-40" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          New to C Found?{" "}
          <Link href="/employer/register" className="text-blue-600 font-bold">
            Create an employer account
          </Link>
        </p>

        <div className="mt-8 pt-6 border-t border-[var(--border-main)] flex items-center justify-center gap-3 text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-bold">
          <ShieldCheck size={14} className="text-blue-600" />
          Secure Authentication Protocol
        </div>
      </div>
    </div>
  );
}
