"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, LogOut, LayoutDashboard, ShieldCheck, User, ExternalLink, AtSign } from 'lucide-react';
import { useState } from 'react';
import logo from '../assets/logo.png';
import { auth } from '../lib/firebase';

const navLinks = [
  { name: 'Projects', path: '/projects' },
  { name: 'Services', path: '/services' },
  { name: 'Internship', path: '/internship' },
  { name: 'Careers', path: '/careers' },
  { name: 'Courses', path: '/courses' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

const adminLinks = [
  { name: 'Console', path: '/admin' },
  { name: 'Users', path: '/admin/users' },
  { name: 'Intake', path: '/admin/applications' },
  { name: 'Security', path: '/admin/api-settings' },
];

function UsernameRequiredModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const handleChoose = () => {
    onClose();
    router.push('/profile?action=choose-username');
  };
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="fixed inset-0 z-[101] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-6 relative">
              <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1">
                <X size={18} />
              </button>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <AtSign size={22} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-black text-gray-900 mb-1">Choose a Username</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                You need a username before your public profile can be shared.
              </p>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleChoose} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors">
                  Choose Username
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Navbar() {
  const { user, profile, isAdmin } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);

  const isInAdminSection = pathname.startsWith('/admin');

  const userLinks = [
    { name: 'Projects', path: '/projects' },
    { name: 'Services', path: '/services' },
    { name: 'Internship', path: '/internship' },
    { name: 'Careers', path: '/careers' },
    { name: 'Academy', path: '/courses' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const currentLinks = isAdmin ? (isInAdminSection ? adminLinks : navLinks) : userLinks;

  const handleViewPublicProfile = () => {
    const username = (profile as any)?.username;
    if (username) {
      window.open(`/${username}`, '_blank', 'noopener,noreferrer');
    } else {
      setIsOpen(false);
      setUsernameModalOpen(true);
    }
  };

  return (
    <>
      <UsernameRequiredModal open={usernameModalOpen} onClose={() => setUsernameModalOpen(false)} />

      <nav className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center border-b border-[var(--border-main)] bg-[var(--bg-main)]/80 backdrop-blur-md">
        <div className="w-full max-w-[1400px] mx-auto flex items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <img src={logo.src} alt="C Found" className="w-11 h-11 object-cover rounded-2xl shadow-lg" />
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-black text-[var(--text-main)] tracking-tight">C Found</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-7">
            {currentLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-[10px] font-black uppercase tracking-[0.15em] transition-colors hover:text-primary-600 ${
                  pathname === link.path ? 'text-primary-600' : 'text-[var(--text-muted)]'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href={isInAdminSection ? "/" : "/admin"}
                className="text-[10px] font-black uppercase tracking-[0.15em] text-primary-600 px-5 py-2.5 bg-primary-600/5 rounded-xl flex items-center gap-2 hover:bg-primary-600/10 transition-all border border-primary-600/20 h-10 shadow-sm"
              >
                {isInAdminSection ? <><span>View Site</span> <ExternalLink size={14} /></> : <><span>Admin</span> <ShieldCheck size={14} /></>}
              </Link>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="btn-primary py-2 px-5 text-[9px] shrink-0">
                  DASHBOARD
                </Link>
                <div className="w-px h-6 bg-[var(--border-main)] mx-1" />
                {/* Profile avatar + dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 pr-4 pl-1 py-1 rounded-full hover:bg-[var(--bg-hover)] transition-all">
                    <img
                      src={profile?.photoURL || auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName || auth.currentUser?.displayName || 'User')}`}
                      alt=""
                      className="w-8 h-8 rounded-full border border-[var(--border-main)] object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[80px]">
                      {(profile?.displayName || auth.currentUser?.displayName || 'User').split(' ')[0]}
                    </span>
                  </button>
                  {/* Hover dropdown */}
                  <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden min-w-[200px] py-2">
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-xs font-black text-gray-900 truncate">{profile?.displayName || 'User'}</p>
                        {(profile as any)?.username && (
                          <p className="text-[11px] text-gray-400 font-medium mt-0.5">@{(profile as any).username}</p>
                        )}
                      </div>
                      <div className="py-1">
                        <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <User size={14} className="text-gray-400" />
                          Edit Profile
                        </Link>
                        {!isAdmin && (
                          <button
                            onClick={handleViewPublicProfile}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                          >
                            <ExternalLink size={14} className="text-gray-400" />
                            View Public Profile
                          </button>
                        )}
                        <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <LayoutDashboard size={14} className="text-gray-400" />
                          Dashboard
                        </Link>
                      </div>
                      <div className="border-t border-gray-50 pt-1">
                        <button
                          onClick={() => auth.signOut()}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => auth.signOut()}
                  className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-primary py-2 px-5 text-[9px] shrink-0">
                SIGN IN
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-4">
            <button className="text-[var(--text-main)]" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden absolute top-20 left-0 right-0 p-6 bg-[var(--bg-main)] border-b border-[var(--border-main)] z-40 overflow-hidden"
            >
              <div className="flex flex-col gap-5">
                {currentLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${
                      pathname === link.path ? 'text-primary-600' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    href={isInAdminSection ? "/" : "/admin"}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 text-primary-600 font-black uppercase tracking-widest bg-primary-600/5 p-4 rounded-2xl text-[10px]"
                  >
                    {isInAdminSection ? <ExternalLink size={20} /> : <ShieldCheck size={20} />}
                    {isInAdminSection ? "Visit Site" : "Admin Console"}
                  </Link>
                )}
                <div className="h-px bg-[var(--border-main)]" />
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 font-black uppercase tracking-widest text-[10px] text-primary-600 bg-primary-600/5 p-4 rounded-2xl">
                      <LayoutDashboard size={20} /> DASHBOARD
                    </Link>
                    <Link href="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 font-black uppercase tracking-widest text-[10px] text-[var(--text-main)]">
                      <User size={20} /> PROFILE
                    </Link>
                    {!isAdmin && (
                      <button
                        onClick={handleViewPublicProfile}
                        className="flex items-center gap-3 font-black uppercase tracking-widest text-[10px] text-[var(--text-main)] text-left"
                      >
                        <ExternalLink size={20} /> VIEW PUBLIC PROFILE
                      </button>
                    )}
                    <button onClick={() => auth.signOut()} className="flex items-center gap-3 text-red-500 font-black uppercase tracking-widest text-[10px]">
                      <LogOut size={20} /> Sign Out
                    </button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)} className="btn-primary text-center py-4">
                    SIGN IN
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
