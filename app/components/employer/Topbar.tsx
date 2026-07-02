"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search, Bell, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useEmployerAuth } from "../../context/employer/EmployerAuthContext";

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();
  const { company } = useEmployerAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/employer/login");
  };

  const initials = (company?.companyName || user?.displayName || "E")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header className="h-20 border-b border-[var(--border-main)] bg-[var(--bg-main)] flex items-center gap-4 px-4 md:px-8 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--border-main)]"
      >
        <Menu size={18} />
      </button>

      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-4 py-2.5">
        <Search size={16} className="text-[var(--text-muted)]" />
        <input
          placeholder="Search jobs, applicants..."
          className="bg-transparent outline-none text-sm w-full text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      <div className="flex-1 md:hidden font-black italic text-sm">
        {company?.companyName || "Employer Portal"}
      </div>

      <button className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--border-main)] text-[var(--text-main)]">
        <Bell size={16} />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-600 rounded-full" />
      </button>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2.5 pl-2"
        >
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
            {initials}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <div className="text-xs font-bold text-[var(--text-main)]">
              {company?.companyName || "Your Company"}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">{user?.email}</div>
          </div>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-3 w-48 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden">
            <Link
              href="/employer/profile"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-xs font-bold uppercase tracking-widest text-[var(--text-main)] hover:bg-[var(--bg-main)]"
            >
              Profile
            </Link>
            <Link
              href="/employer/settings"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-xs font-bold uppercase tracking-widest text-[var(--text-main)] hover:bg-[var(--bg-main)]"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-[var(--bg-main)] border-t border-[var(--border-main)]"
            >
              <LogOut size={14} />
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
