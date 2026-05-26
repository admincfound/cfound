import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Layers, 
  GraduationCap, 
  Settings, 
  ArrowLeft,
  PenTool,
  Clock
} from 'lucide-react';

const adminNav = [
  { name: 'Console', path: '/admin', icon: LayoutDashboard },
  { name: 'Intake', path: '/admin/applications', icon: Briefcase },
  { name: 'Portfolio', path: '/projects', icon: Layers },
  { name: 'Journal', path: '/blog', icon: PenTool },
  { name: 'Internship', path: '/internship', icon: GraduationCap },
  { name: 'Settings', path: '/admin/api-settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">


      <main className="pt-6">
        {children}
      </main>
    </div>
  );
}
