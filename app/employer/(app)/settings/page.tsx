"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, Lock, Trash2 } from "lucide-react";
import { auth } from "../../../lib/firebase";
import { PageHeader, Card } from "../../../components/employer/UI";

export default function EmployerSettingsPage() {
  const router = useRouter();
  const [notifyApplicants, setNotifyApplicants] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState("");

  const handleDeleteCompany = () => {
    if (confirmDelete !== "DELETE") {
      toast.error('Type "DELETE" to confirm');
      return;
    }
    toast.error("Company deletion is not yet available.");
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your company and account preferences." />

      <div className="space-y-6 max-w-2xl">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-blue-600" />
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              Notification Settings
            </div>
          </div>
          <Toggle
            label="New applicant notifications"
            checked={notifyApplicants}
            onChange={setNotifyApplicants}
          />
          <Toggle
            label="New message notifications"
            checked={notifyMessages}
            onChange={setNotifyMessages}
          />
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-blue-600" />
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              Password & Security
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Your account is secured through Google Sign-In. Manage your password
            and 2-step verification directly from your Google account.
          </p>
          <button
            onClick={() => signOut(auth).then(() => router.push("/employer/login"))}
            className="text-xs font-black uppercase tracking-widest border border-[var(--border-main)] px-5 py-3 rounded-xl hover:bg-[var(--bg-main)] transition-colors"
          >
            Log Out of All Devices
          </button>
        </Card>

        <Card className="border-red-500/30">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-500" />
            <div className="text-[10px] font-black uppercase tracking-widest text-red-500">
              Danger Zone
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Deleting your company will remove your job posts, applicants, and
            recruiter access. This cannot be undone.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="flex-1 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 text-[var(--text-main)]"
            />
            <button
              onClick={handleDeleteCompany}
              className="inline-flex items-center justify-center gap-2 bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-xs px-5 py-3 rounded-xl hover:bg-red-500/20 transition-all"
            >
              <Trash2 size={14} />
              Delete Company
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border-main)] last:border-0">
      <span className="text-sm text-[var(--text-main)]">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full relative transition-colors ${
          checked ? "bg-blue-600" : "bg-[var(--border-main)]"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
