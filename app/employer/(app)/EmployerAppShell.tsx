"use client";

import { useState } from "react";
import EmployerGuard from "../../components/employer/EmployerGuard";
import Sidebar from "../../components/employer/Sidebar";
import Topbar from "../../components/employer/Topbar";

export default function EmployerAppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <EmployerGuard>
      <div className="min-h-screen flex bg-[var(--bg-main)]">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </EmployerGuard>
  );
}
