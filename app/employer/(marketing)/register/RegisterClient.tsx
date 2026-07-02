"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle2 } from "lucide-react";
import { ensureEmployerProfile, updateEmployerProfile } from "../../../lib/employer/employers";

const perks = [
  "Post unlimited jobs",
  "Manage applicants in one dashboard",
  "Invite recruiters to your team",
];

export default function RegisterClient() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const company = await ensureEmployerProfile(
        result.user.uid,
        result.user.email || "",
        companyName || result.user.displayName || undefined
      );

      if (companyName && company.companyName !== companyName) {
        await updateEmployerProfile(result.user.uid, { companyName });
      }

      router.replace("/employer/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed before completion. Please try again.");
      } else {
        setError(err.message || "Failed to create your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] grid lg:grid-cols-2 bg-[var(--bg-main)]">
      <div className="hidden lg:flex flex-col justify-center bg-slate-950 text-white p-16 relative overflow-hidden">
        <div className="absolute top-1/3 left-0 w-80 h-80 bg-blue-600/20 blur-[130px] rounded-full" />
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-8">
            <Briefcase size={22} />
          </div>
          <h2 className="text-3xl font-black italic tracking-tight leading-tight mb-6">
            Build your hiring team on C Found.
          </h2>
          <div className="space-y-4">
            {perks.map((p) => (
              <div key={p} className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-blue-400" />
                <span className="text-sm text-slate-300">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-black italic tracking-tight text-[var(--text-main)] mb-2">
            Create your employer account
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            Sign up with Google to get started &mdash; no credit card required.
          </p>

          {error && (
            <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Company Name
          </label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Technologies"
            className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl px-5 py-4 text-sm mb-6 focus:outline-none focus:border-blue-500 transition-all text-[var(--text-main)]"
          />

          <button
            onClick={handleCreateAccount}
            disabled={loading}
            className="w-full h-14 flex items-center justify-between px-6 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 group"
          >
            {loading ? (
              <div className="flex items-center gap-3 mx-auto">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-bold uppercase tracking-widest opacity-80">
                  Creating account
                </span>
              </div>
            ) : (
              <>
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-5 h-5 bg-white rounded p-0.5"
                />
                <span className="text-xs md:text-sm font-bold uppercase tracking-[0.15em] flex-1 text-center">
                  Sign up with Google
                </span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform ml-2 opacity-60" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-[var(--text-muted)] mt-6">
            Already have an account?{" "}
            <Link href="/employer/login" className="text-blue-600 font-bold">
              Employer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
