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
      {/* Admin Sub-Nav */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-[var(--bg-main)] border-b border-[var(--border-main)] overflow-x-auto">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-1">
          {adminNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-6 h-full text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                location.pathname === item.path 
                  ? 'text-primary-600' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <item.icon size={14} />
              <span className="hidden sm:inline">{item.name}</span>
              {location.pathname === item.path && (
                <motion.div 
                  layoutId="admin-nav-active"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" 
                />
              )}
            </Link>
          ))}
          
          <div className="flex-1" />
          
          <div className="hidden lg:flex items-center gap-4 text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest opacity-40 italic">
            <Clock size={12} /> Last Sync: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <main className="pt-20">
        {children}
      </main>
    </div>
  );
}
