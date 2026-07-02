"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useEmployerAuth } from "../../context/employer/EmployerAuthContext";

export default function EmployerGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isEmployer, companyLoading } = useEmployerAuth();
  const router = useRouter();

  const stillLoading = loading || companyLoading;

  useEffect(() => {
    if (stillLoading) return;
    if (!user || !isEmployer) {
      router.replace("/employer/login");
    }
  }, [stillLoading, user, isEmployer, router]);

  if (stillLoading || !user || !isEmployer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Loading employer workspace
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
