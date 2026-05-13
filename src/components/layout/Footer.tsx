import { Link } from 'react-router-dom';
import { Mail, Github, Linkedin, MessageCircle, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-800/50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-slate-400">
        {/* Company Info */}
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-glow to-indigo-600 p-[1px]">
              <div className="w-full h-full rounded-lg bg-slate-950 flex items-center justify-center font-bold text-lg">
                C
              </div>
            </div>
            <span className="text-xl font-bold uppercase text-white">Found</span>
          </Link>
          <p className="text-slate-500 text-sm leading-relaxed">
            Developing digital products including games, applications, websites, software systems, and database platforms while providing practical industry experience.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:text-cyan-glow hover:border-cyan-glow transition-all">
              <Linkedin size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:text-cyan-glow hover:border-cyan-glow transition-all">
              <Github size={18} />
            </a>
            <a href="https://wa.me/91936119454" className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:text-cyan-glow hover:border-cyan-glow transition-all">
              <MessageCircle size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold mb-6 text-white uppercase text-xs tracking-widest">Company</h4>
          <ul className="space-y-4 text-sm">
            <li><Link to="/about" className="hover:text-slate-300 transition-colors">About Us</Link></li>
            <li><Link to="/services" className="hover:text-slate-300 transition-colors">Services</Link></li>
            <li><Link to="/projects" className="hover:text-slate-300 transition-colors">Projects</Link></li>
            <li><Link to="/technologies" className="hover:text-slate-300 transition-colors">Technologies</Link></li>
          </ul>
        </div>

        {/* Career Links */}
        <div>
          <h4 className="font-bold mb-6 text-white uppercase text-xs tracking-widest">Careers</h4>
          <ul className="space-y-4 text-sm">
            <li><Link to="/careers" className="hover:text-slate-300 transition-colors">Internship Programs</Link></li>
            <li><Link to="/certificates" className="hover:text-slate-300 transition-colors">Verify Certificate</Link></li>
            <li><Link to="/careers" className="hover:text-slate-300 transition-colors">Apply Now</Link></li>
            <li><Link to="/contact" className="hover:text-slate-300 transition-colors">Support Portal</Link></li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 className="font-bold mb-6 text-white uppercase text-xs tracking-widest">Contact</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <Mail size={18} className="shrink-0 text-cyan-glow" />
              <a href="mailto:admin.cfound@gmail.com" className="hover:text-slate-300">admin.cfound@gmail.com</a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin size={18} className="shrink-0 text-cyan-glow" />
              <span>Technology Hub, Global Digital District</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-slate-800/30 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
          © 2024 C Found. All rights reserved.
        </p>
        <div className="flex gap-6 text-[10px] text-slate-500 uppercase tracking-widest">
          <a href="#" className="hover:text-white">Privacy Policy</a>
          <a href="#" className="hover:text-white">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
