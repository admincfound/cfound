import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Projects', href: '/projects' },
  { name: 'Careers', href: '/careers' },
  { name: 'Technologies', href: '/technologies' },
  { name: 'Certificates', href: '/certificates' },
  { name: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b z-50',
        scrolled
          ? 'bg-slate-950/80 backdrop-blur-md border-slate-800/50 py-3'
          : 'bg-transparent border-transparent py-5'
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-glow to-indigo-600 p-[1px]">
            <div className="w-full h-full rounded-lg bg-slate-950 flex items-center justify-center font-bold text-xl group-hover:bg-transparent transition-colors">
              C
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight uppercase">Found</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.href}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition-colors hover:text-white',
                  isActive ? 'text-cyan-glow' : 'text-slate-400'
                )
              }
            >
              {link.name}
            </NavLink>
          ))}
          <Link
            to="/careers"
            className="px-5 py-2 rounded-full bg-slate-100 text-slate-900 text-sm font-semibold hover:bg-white transition-colors"
          >
            Apply for Internship
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden text-white p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-black border-b border-white/10 p-6 lg:hidden flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'text-lg font-medium flex items-center justify-between',
                    isActive ? 'text-cyan-glow' : 'text-white/70'
                  )
                }
              >
                {link.name}
                <ChevronRight size={16} />
              </NavLink>
            ))}
            <Link
              to="/careers"
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full py-4 rounded-xl bg-gradient-to-r from-cyan-glow to-soft-purple text-center font-bold"
            >
              Careers Portal
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
