"use client";

import { useState } from "react";
import { UserPlus, Trash2, Send } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { PageHeader, Card, Badge } from "../../../components/employer/UI";

interface Recruiter {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Recruiter";
}

export default function EmployerRecruitersPage() {
  const { user, profile } = useAuth();
  const [recruiters, setRecruiters] = useState<Recruiter[]>([
    {
      id: "owner",
      name: profile?.displayName || "You",
      email: user?.email || "",
      role: "Owner",
    },
  ]);
  const [inviteEmail, setInviteEmail] = useState("");

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setRecruiters((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: inviteEmail.split("@")[0], email: inviteEmail, role: "Recruiter" },
    ]);
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
  };

  const handleRemove = (id: string) => {
    setRecruiters((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div>
      <PageHeader title="Recruiters" subtitle="Invite teammates to help manage your hiring." />

      <Card className="mb-6">
        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">
          Invite a Recruiter
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teammate@company.com"
            type="email"
            className="flex-1 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-[var(--text-main)]"
          />
          <button
            onClick={handleInvite}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs px-5 py-3 rounded-xl transition-all active:scale-95"
          >
            <Send size={14} />
            Invite
          </button>
        </div>
      </Card>

      <div className="space-y-3">
        {recruiters.map((r) => (
          <Card key={r.id} className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center font-black shrink-0">
              {r.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-[var(--text-main)]">{r.name}</div>
              <div className="text-xs text-[var(--text-muted)]">{r.email}</div>
            </div>
            <Badge tone={r.role === "Owner" ? "success" : "default"}>{r.role}</Badge>
            {r.role !== "Owner" && (
              <button
                onClick={() => handleRemove(r.id)}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-main)] hover:text-red-600 hover:border-red-500/50"
              >
                <Trash2 size={14} />
              </button>
            )}
          </Card>
        ))}
      </div>

      <p className="text-[10px] text-[var(--text-muted)] mt-6 uppercase tracking-widest font-bold flex items-center gap-2">
        <UserPlus size={12} />
        Invites are placeholder for now &middot; email delivery not yet wired up
      </p>
    </div>
  );
}
