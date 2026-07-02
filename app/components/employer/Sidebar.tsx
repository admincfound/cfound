"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Users,
  UserPlus,
  MessageSquare,
  BarChart3,
  CreditCard,
  Settings,
  HelpCircle,
  X,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/employer/dashboard", icon: LayoutDashboard },
  { name: "Company", path: "/employer/company", icon: Building2 },
  { name: "Jobs", path: "/employer/jobs", icon: Briefcase },
  { name: "Applicants", path: "/employer/applicants", icon: Users },
  { name: "Recruiters", path: "/employer/recruiters", icon: UserPlus },
  { name: "Messages", path: "/employer/messages", icon: MessageSquare },
  { name: "Analytics", path: "/employer/analytics", icon: BarChart3 },
  { name: "Billing", path: "/employer/billing", icon: CreditCard },
  { name: "Settings", path: "/employer/settings", icon: Settings },
];

export default function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const content = (
    <div className="h-full flex flex-col bg-slate-950 text-white w-64 shrink-0">
      <div className="h-20 flex items-center gap-3 px-6 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black italic text-sm">
          C
        </div>
        <div className="leading-tight">
          <div className="font-black italic tracking-tight text-sm">C Found</div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-blue-400 font-bold">
            Employer
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto lg:hidden text-slate-400">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const active =
            pathname === item.path || pathname?.startsWith(item.path + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <Link
          href="/employer/contact"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white transition-all"
        >
          <HelpCircle size={16} />
          Help
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block h-screen sticky top-0">{content}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
