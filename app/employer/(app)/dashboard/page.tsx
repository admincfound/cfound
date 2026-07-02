"use client";

import Link from "next/link";
import {
  Briefcase,
  Users,
  UserPlus,
  Building2,
  Heart,
  BadgeCheck,
  Plus,
  PenSquare,
  Send,
  Bell,
  Activity,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useEmployerAuth } from "../../../context/employer/EmployerAuthContext";
import { useEmployerJobs } from "../../../hooks/employer/useEmployerJobs";
import { PageHeader, StatCard, Card, EmptyState, Badge } from "../../../components/employer/UI";

export default function EmployerDashboardPage() {
  const { user } = useAuth();
  const { company } = useEmployerAuth();
  const { jobs, loading } = useEmployerJobs(user?.uid);

  const activeJobs = jobs.filter((j) => j.status === "active");
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0);
  const profileFields = [
    company?.companyName,
    company?.description,
    company?.website,
    company?.industry,
    company?.location,
    company?.logoUrl,
  ];
  const profileCompletion = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100
  );

  const quickActions = [
    { name: "Post Job", icon: Plus, href: "/employer/jobs/new" },
    { name: "Edit Company", icon: PenSquare, href: "/employer/company" },
    { name: "Invite Recruiter", icon: Send, href: "/employer/recruiters" },
    { name: "View Applicants", icon: Users, href: "/employer/applicants" },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back${company?.companyName ? ", " + company.companyName : ""}`}
        subtitle="Here's what's happening with your hiring."
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

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Active Jobs" value={loading ? "…" : activeJobs.length} icon={<Briefcase size={18} />} />
        <StatCard label="Applicants" value={loading ? "…" : totalApplicants} icon={<Users size={18} />} />
        <StatCard label="Recruiters" value={1} icon={<UserPlus size={18} />} hint="Just you, for now" />
        <StatCard
          label="Company Status"
          value={company?.verificationStatus === "verified" ? "Verified" : "Unverified"}
          icon={<BadgeCheck size={18} />}
        />
        <StatCard label="Company Followers" value={0} icon={<Heart size={18} />} hint="Placeholder" />
        <StatCard label="Profile Completion" value={`${profileCompletion}%`} icon={<Building2 size={18} />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">
            Quick Actions
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.name}
                  href={a.href}
                  className="flex flex-col items-start gap-3 p-4 rounded-xl border border-[var(--border-main)] hover:border-blue-500/50 hover:bg-blue-600/5 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-main)]">{a.name}</span>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              Recent Jobs
            </div>
            <Link href="/employer/jobs" className="text-[10px] font-black uppercase tracking-widest text-blue-600">
              View all
            </Link>
          </div>

          {jobs.length === 0 && !loading ? (
            <EmptyState
              icon={<Briefcase size={22} />}
              title="No jobs posted yet"
              description="Post your first job to start receiving applicants."
              action={
                <Link
                  href="/employer/jobs/new"
                  className="text-xs font-black uppercase tracking-widest bg-blue-600 text-white px-5 py-3 rounded-xl"
                >
                  Post a Job
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  href={`/employer/jobs/edit/${job.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-main)] hover:border-blue-500/50 transition-all"
                >
                  <div>
                    <div className="font-bold text-sm text-[var(--text-main)]">{job.title}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">
                      {job.location || "Remote"} &middot; {job.jobType || "full-time"}
                    </div>
                  </div>
                  <Badge tone={job.status === "active" ? "success" : job.status === "draft" ? "warning" : "default"}>
                    {job.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">
            <Activity size={14} /> Recent Activity
          </div>
          <EmptyState
            icon={<Activity size={20} />}
            title="No recent activity"
            description="Activity from your jobs and applicants will show up here."
          />
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">
            <Bell size={14} /> Notifications
          </div>
          <EmptyState icon={<Bell size={20} />} title="You're all caught up" description="New notifications will appear here." />
        </Card>
      </div>
    </div>
  );
}
