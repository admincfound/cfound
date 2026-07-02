"use client";

import { useState } from "react";
import { Search, Filter, Users, Eye, Check, X, FileText } from "lucide-react";
import { PageHeader, Card, EmptyState, Badge } from "../../../components/employer/UI";

interface Applicant {
  id: string;
  name: string;
  role: string;
  stage: "Applied" | "Screening" | "Interview" | "Shortlisted" | "Rejected";
  appliedOn: string;
}

const placeholderApplicants: Applicant[] = [
  { id: "1", name: "Aditi Sharma", role: "Frontend Developer", stage: "Applied", appliedOn: "2026-06-28" },
  { id: "2", name: "Rohan Mehta", role: "Backend Developer", stage: "Screening", appliedOn: "2026-06-27" },
  { id: "3", name: "Priya Nair", role: "Product Designer", stage: "Interview", appliedOn: "2026-06-25" },
  { id: "4", name: "Karthik Iyer", role: "Frontend Developer", stage: "Shortlisted", appliedOn: "2026-06-20" },
];

const stages = ["All", "Applied", "Screening", "Interview", "Shortlisted", "Rejected"];

export default function EmployerApplicantsPage() {
  const [applicants, setApplicants] = useState(placeholderApplicants);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("All");

  const filtered = applicants.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) &&
      (stage === "All" || a.stage === stage)
  );

  const updateStage = (id: string, newStage: Applicant["stage"]) => {
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, stage: newStage } : a)));
  };

  return (
    <div>
      <PageHeader title="Applicants" subtitle="Review and manage candidates across your job posts." />

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-4 py-3 flex-1">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicants..."
            className="bg-transparent outline-none text-sm w-full text-[var(--text-main)]"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={14} className="text-[var(--text-muted)] shrink-0" />
          {stages.map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-3.5 py-2.5 rounded-lg border transition-colors ${
                stage === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<Users size={22} />} title="No applicants found" description="Applicants will appear here as candidates apply to your jobs." />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id} className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center font-black shrink-0">
                {a.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[var(--text-main)]">{a.name}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">
                  Applied for {a.role} &middot; {a.appliedOn}
                </div>
              </div>
              <Badge
                tone={
                  a.stage === "Shortlisted" ? "success" : a.stage === "Rejected" ? "danger" : "default"
                }
              >
                {a.stage}
              </Badge>
              <div className="flex items-center gap-2 shrink-0">
                <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-main)] hover:text-blue-600 hover:border-blue-500/50" title="Resume preview">
                  <FileText size={14} />
                </button>
                <button
                  onClick={() => updateStage(a.id, "Shortlisted")}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-main)] hover:text-green-600 hover:border-green-500/50"
                  title="Shortlist"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => updateStage(a.id, "Rejected")}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-main)] hover:text-red-600 hover:border-red-500/50"
                  title="Reject"
                >
                  <X size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-[10px] text-[var(--text-muted)] mt-6 uppercase tracking-widest font-bold">
        Showing placeholder data &middot; live applications will appear here once wired to Firestore
      </p>
    </div>
  );
}
