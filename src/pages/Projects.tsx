import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Github, Layers, Code, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

const projects = [
  {
    title: 'Nexus Enterprise Dashboard',
    category: 'Enterprise',
    description: 'A real-time data visualization platform for monitoring large-scale server clusters.',
    tech: ['React', 'D3.js', 'WebSockets', 'Go'],
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'CyberQuest RPG',
    category: 'Game',
    description: 'A 3D sci-fi role-playing game with complex AI behavior and inventory systems.',
    tech: ['Unity', 'C#', 'Blender', 'Photon'],
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'SwiftPay Mobile App',
    category: 'App',
    description: 'Secure, multi-currency mobile wallet with instant peer-to-peer transfers.',
    tech: ['React Native', 'Node.js', 'PostgreSQL', 'AWS'],
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'CloudScale Database',
    category: 'System',
    description: 'Distributed database system optimized for high-frequency transactional data.',
    tech: ['C++', 'Rust', 'Kubernetes', 'gRPC'],
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc4b?auto=format&fit=crop&q=80&w=800'
  }
];

export default function Projects() {
  const [filter, setFilter] = React.useState('All');

  const filteredProjects = projects.filter(p => 
    filter === 'All' || p.category.includes(filter)
  );

  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-8">Selected <span className="text-gradient">Case Studies</span></h1>
            <p className="text-white/50 text-xl leading-relaxed">
              Explore our portfolio of high-impact digital products and collaborative industry projects.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
             {['All', 'Game', 'System', 'App', 'Enterprise'].map(cat => (
               <button 
                 key={cat}
                 onClick={() => setFilter(cat)}
                 className={cn(
                   "px-6 py-2 rounded-full border transition-all text-sm font-bold",
                   filter === cat 
                     ? "border-cyan-glow bg-cyan-glow/10 text-cyan-glow" 
                     : "border-white/10 hover:bg-white/5 text-white/50"
                 )}
               >
                 {cat === 'All' ? 'All Projects' : cat + 's'}
               </button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, idx) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card overflow-hidden group border border-slate-800/50 hover:border-cyan-glow/50 transition-all cursor-pointer"
            >
              <div className="aspect-video relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center gap-4">
                  <Link 
                    to="/contact" 
                    className="w-12 h-12 rounded-full bg-cyan-glow text-slate-900 flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    title="Inquire about this project"
                  >
                    <ExternalLink size={20} />
                  </Link>
                  <a 
                    href="#" 
                    className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:scale-110 transition-transform backdrop-blur-md border border-white/10"
                    title="View Source"
                  >
                    <Github size={20} />
                  </a>
                </div>
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 z-20">
                  <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-cyan-glow">
                    {project.category}
                  </span>
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4 group-hover:text-cyan-glow transition-colors">{project.title}</h3>
                <p className="text-white/40 text-sm mb-8 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map(t => (
                    <span key={t} className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-white/40 font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Collaboration Visual */}
        <div className="mt-32 border border-white/5 rounded-[40px] p-8 md:p-16 relative overflow-hidden flex flex-col items-center text-center">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-glow/5 animate-pulse blur-[150px] -z-10" />
           <Layers className="text-cyan-glow mb-8" size={64} />
           <h2 className="text-3xl md:text-5xl font-bold mb-8">Built by Collaborative Teams</h2>
           <p className="max-w-2xl text-white/40 mb-12">
             Our projects are the result of intense collaboration between specialized developers and mentored interns, ensuring diverse perspectives and robust outcomes.
           </p>
           <div className="flex items-center gap-12 overflow-hidden py-4 opacity-50">
             <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white/40">
               <Zap size={16} /> Rapid Prototyping
             </div>
             <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white/40">
               <Code size={16} /> Clean Architecture
             </div>
             <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white/40">
               <Layers size={16} /> scalable systems
             </div>
           </div>
        </div>

        {/* Call to Action */}
        <div className="mt-32 p-12 glass-card text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-glow via-indigo-600 to-cyan-glow" />
           <h2 className="text-3xl font-bold mb-6">Have a project idea?</h2>
           <p className="text-slate-400 mb-10 max-w-xl mx-auto italic">
             "Our interns participate in every phase of these live projects, from initial architecture to final production deployment."
           </p>
           <Link to="/contact" className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-cyan-glow transition-all inline-block shadow-2xl">
             Start Your Project
           </Link>
        </div>
      </div>
    </div>
  );
}
