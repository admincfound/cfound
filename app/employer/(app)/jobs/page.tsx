"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Plus, Search, Briefcase, Edit3, Trash2, Eye, Users } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useEmployerJobs } from "../../../hooks/employer/useEmployerJobs";
import { deleteEmployerJob, setJobStatus } from "../../../lib/employer/jobs";
import { PageHeader, Card, EmptyState, Badge } from "../../../components/employer/UI";

export default function EmployerJobsPage() {
  const { user } = useAuth();
  const { jobs, loading } = useEmployerJobs(user?.uid);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = jobs.filter((j) =>
    j.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job posting? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteEmployerJob(id);
      toast.success("Job deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete job");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const next = current === "active" ? "draft" : "active";
    try {
      await setJobStatus(id, next as any);
      toast.success(next === "active" ? "Job published" : "Job moved to draft");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update job status");
    }
  };

  return (
    <div>
      <PageHeader
        title="Jobs"
        subtitle="Manage the roles your company has posted."
        action={
          <Link
            href="/employer/jobs/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs px-5 py-3 rounded-xl transition-all active:scale-95"
          >
            <Plus size={16} />
            Post a Job
          </Link>
        }
      />

      <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-4 py-3 mb-6 max-w-md">
        <Search size={16} className="text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your jobs..."
          className="bg-transparent outline-none text-sm w-full text-[var(--text-main)]"
        />
      </div>

      {loading ? (
        <div className="text-sm text-[var(--text-muted)]">Loading jobs...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Briefcase size={22} />}
            title={search ? "No jobs match your search" : "No jobs posted yet"}
            description={search ? "Try a different search term." : "Post your first job to start receiving applicants."}
            action={
              !search && (
                <Link
                  href="/employer/jobs/new"
                  className="text-xs font-black uppercase tracking-widest bg-blue-600 text-white px-5 py-3 rounded-xl"
                >
                  Post a Job
                </Link>
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <Card key={job.id} className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <h3 className="font-black italic text-[var(--text-main)] truncate">{job.title}</h3>
                  <Badge tone={job.status === "active" ? "success" : job.status === "draft" ? "warning" : "default"}>
                    {job.status}
                  </Badge>
                </div>
                <div className="text-xs text-[var(--text-muted)] flex flex-wrap gap-x-4 gap-y-1">
                  <span>{job.location || "Remote"}</span>
                  <span>{job.jobType || "full-time"}</span>
                  <span className="flex items-center gap-1"><Eye size={12} /> {job.views || 0} views</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {job.applicantCount || 0} applicants</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => job.id && handleToggleStatus(job.id, job.status)}
                  className="text-[10px] font-black uppercase tracking-widest border border-[var(--border-main)] px-3 py-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors"
                >
                  {job.status === "active" ? "Move to Draft" : "Publish"}
                </button>
                <Link
                  href={`/employer/jobs/edit/${job.id}`}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-main)] hover:border-blue-500/50 hover:text-blue-600 transition-colors"
                >
                  <Edit3 size={14} />
                </Link>
                <button
                  onClick={() => job.id && handleDelete(job.id)}
                  disabled={deletingId === job.id}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-main)] hover:border-red-500/50 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
