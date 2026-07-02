"use client";

import { useAuth } from "../../../context/AuthContext";
import { useEmployerAuth } from "../../../context/employer/EmployerAuthContext";
import { PageHeader, Card, Badge } from "../../../components/employer/UI";
import { Mail, Building2, BadgeCheck } from "lucide-react";

export default function EmployerProfilePage() {
  const { user } = useAuth();
  const { company } = useEmployerAuth();

  return (
    <div>
      <PageHeader title="Your Profile" subtitle="Your personal account on the Employer Portal." />

      <Card className="max-w-2xl flex flex-col md:flex-row gap-6 items-start">
        <div className="w-20 h-20 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-black italic text-2xl shrink-0">
          {(user?.displayName || user?.email || "E").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <div className="text-lg font-black italic text-[var(--text-main)]">
              {user?.displayName || "Employer"}
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mt-1">
              <Mail size={14} />
              {user?.email}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Building2 size={14} />
            {company?.companyName || "No company name set"}
          </div>

          <Badge tone={company?.verificationStatus === "verified" ? "success" : "warning"}>
            <span className="inline-flex items-center gap-1">
              <BadgeCheck size={11} />
              {company?.verificationStatus || "unverified"}
            </span>
          </Badge>
        </div>
      </Card>
    </div>
  );
}
