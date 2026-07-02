"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { PageHeader, Card, StatCard } from "../../../components/employer/UI";
import { Eye, Users, TrendingUp, Briefcase } from "lucide-react";

const viewsData = [
  { day: "Mon", views: 40, applicants: 4 },
  { day: "Tue", views: 62, applicants: 7 },
  { day: "Wed", views: 55, applicants: 5 },
  { day: "Thu", views: 78, applicants: 9 },
  { day: "Fri", views: 90, applicants: 12 },
  { day: "Sat", views: 48, applicants: 3 },
  { day: "Sun", views: 35, applicants: 2 },
];

const jobPerformance = [
  { name: "Frontend Dev", applicants: 24 },
  { name: "Backend Dev", applicants: 18 },
  { name: "Designer", applicants: 12 },
  { name: "PM", applicants: 8 },
];

export default function EmployerAnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Track how your job posts are performing." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Views" value={408} icon={<Eye size={18} />} />
        <StatCard label="Total Applicants" value={62} icon={<Users size={18} />} />
        <StatCard label="Conversion Rate" value="15.2%" icon={<TrendingUp size={18} />} />
        <StatCard label="Active Jobs" value={4} icon={<Briefcase size={18} />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-6">
            Views & Applicants (Last 7 Days)
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={viewsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" />
              <XAxis dataKey="day" fontSize={11} stroke="var(--text-muted)" />
              <YAxis fontSize={11} stroke="var(--text-muted)" />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="applicants" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-6">
            Applicants by Job
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={jobPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" />
              <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" />
              <YAxis fontSize={11} stroke="var(--text-muted)" />
              <Tooltip />
              <Bar dataKey="applicants" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <p className="text-[10px] text-[var(--text-muted)] mt-6 uppercase tracking-widest font-bold">
        Showing placeholder data &middot; live analytics coming soon
      </p>
    </div>
  );
}
