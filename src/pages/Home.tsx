import { motion } from 'motion/react';
import { ArrowRight, Code, Rocket, Brain, Users, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: Code,
    title: 'Modern Development',
    description: 'We develop high-performance digital products using the latest tech stacks.',
  },
  {
    icon: Users,
    title: 'Live Collaboration',
    description: 'Students work alongside industry experts on real-world production projects.',
  },
  {
    icon: Brain,
    title: 'Practical Experience',
    description: 'Our curriculum is built around hands-on development rather than theory.',
  },
  {
    icon: Rocket,
    title: 'Career Growth',
    description: 'Launch your career with professional mentorship and portfolio-ready projects.',
  },
];

const stats = [
  { label: 'Live Projects', value: '50+' },
  { label: 'Interns Trained', value: '200+' },
  { label: 'Success Rate', value: '98%' },
  { label: 'Tech Domains', value: '12+' },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Bento Style */}
      <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-12 gap-4 auto-rows-[120px] lg:auto-rows-[140px]">
          {/* Main Hero Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-12 lg:col-span-7 row-span-4 glass-card p-8 lg:p-14 flex flex-col justify-center relative overflow-hidden group"
          >
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full group-hover:bg-cyan-500/20 transition-all"></div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 w-fit">
              Next-Gen Tech Studio
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-500 italic">
              Building Digital Solutions <br /> & Future Developers
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-xl mb-10">
              C Found develops modern digital products while helping students gain practical industry experience through live project collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/services" className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-2xl font-bold transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] text-center">
                Explore Company
              </Link>
              <Link to="/careers" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition-all border border-slate-700 text-center">
                Career Portal
              </Link>
            </div>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="col-span-12 md:col-span-6 lg:col-span-5 row-span-2 bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative group"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Project Impact</h3>
              <span className="text-cyan-400 text-[10px] font-mono uppercase tracking-widest">Global Reach</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <div className="text-4xl font-black mb-1">150+</div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Successful Interns</p>
               </div>
               <div>
                  <div className="text-4xl font-black mb-1">42</div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Deployed Products</p>
               </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-3">
               <div className="flex -space-x-2">
                 {[
                   'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
                   'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
                   'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100',
                   'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100'
                 ].map((src, i) => (
                   <img 
                     key={i} 
                     src={src} 
                     className="w-8 h-8 rounded-full border-2 border-slate-950 object-cover" 
                     alt={`User ${i}`} 
                   />
                 ))}
               </div>
               <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Trusted by 200+ clients</span>
            </div>
          </motion.div>

          {/* Activity / Live Projects Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="col-span-12 md:col-span-6 lg:col-span-5 row-span-2 glass-card p-8 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <h3 className="text-lg font-bold">Live Environment</h3>
            </div>
            <div className="space-y-4 flex-grow">
               <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 group/item transition-colors hover:bg-slate-800/60">
                  <div className="flex items-center gap-3">
                    <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=100" className="w-10 h-10 rounded-lg object-cover group-hover/item:scale-110 transition-all" alt="Nova" />
                    <div>
                      <p className="font-bold text-sm">Nova Dashboard</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">SaaS Enterprise</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[9px] font-black rounded uppercase">Active</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 group/item transition-colors hover:bg-slate-800/60">
                  <div className="flex items-center gap-3">
                    <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=100" className="w-10 h-10 rounded-lg object-cover group-hover/item:scale-110 transition-all" alt="Cyber" />
                    <div>
                      <p className="font-bold text-sm">CyberQuest v2</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Unity Game</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">UAT Phase</span>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-y border-white/5 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <h3 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 mb-2">
                {stat.value}
              </h3>
              <p className="text-sm text-white/40 uppercase tracking-widest font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Practical Learning for Professional Careers</h2>
            <p className="text-white/50 text-lg">
              We bridge the gap between academic knowledge and industry requirements by involving developers in real-time professional projects.
            </p>
          </div>
          <Link to="/about" className="group flex items-center gap-2 text-cyan-glow font-semibold transition-all">
            Learn more about our mission <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-8 hover:bg-white/[0.06] transition-colors"
            >
              <feature.icon className="text-cyan-glow mb-6" size={32} />
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Student Journey / Programs */}
      <section className="py-24 bg-gradient-to-b from-navy/30 to-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Our Core Focus Areas</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              From game architecture to scalable database systems, we cover the entire spectrum of modern technology development.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className="glass-card overflow-hidden group relative">
                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Enterprise background" />
                </div>
                <div className="p-8 md:p-12 relative z-10">
                   <h3 className="text-2xl md:text-3xl font-bold mb-4">Enterprise Grade Applications</h3>
                   <p className="text-white/50 mb-8 max-w-xl line-clamp-2 italic">
                     "C Found specializes in building complex SaaS architectures that handle thousands of concurrent users reliably."
                   </p>
                   <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                     {['Scalable Microservices', 'Real-time Dashboards', 'Secure Cloud Infrastructure', 'API Orchestration'].map(item => (
                       <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                         <CheckCircle2 size={16} className="text-cyan-glow" /> {item}
                       </li>
                     ))}
                   </ul>
                   <Link to="/projects" className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 transition-all inline-block font-semibold">
                     View Case Studies
                   </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-8 group relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400" className="w-32 h-32 object-cover rounded-full" alt="Game" />
                  </div>
                  <h4 className="text-xl font-bold mb-4">Game Development</h4>
                  <p className="text-white/40 text-sm mb-6">Building immersive worlds with Unity & Unreal Engine for mobile and PC platforms.</p>
                  <Link to="/services" className="text-cyan-glow text-sm font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                    Explore <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="glass-card p-8 group relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400" className="w-32 h-32 object-cover rounded-full" alt="App" />
                  </div>
                  <h4 className="text-xl font-bold mb-4">App Development</h4>
                  <p className="text-white/40 text-sm mb-6">Fast, secure, and native-feeling mobile applications for iOS and Android.</p>
                  <Link to="/services" className="text-cyan-glow text-sm font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                    Explore <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-4 glass-card p-8 flex flex-col justify-center sticky top-24 h-fit">
              <h3 className="text-2xl font-bold mb-6">Internship Path</h3>
              <p className="text-white/50 text-sm mb-8">
                Join our structured internship programs designed to make you industry-ready in weeks, not years.
              </p>
              <div className="space-y-4 mb-8">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-xs text-cyan-glow uppercase tracking-tighter mb-1">Entry Level</div>
                  <div className="font-bold">30-Day Intensive</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-xs text-indigo-400 uppercase tracking-tighter mb-1">Advanced Track</div>
                  <div className="font-bold">6-Month Industry Core</div>
                </div>
              </div>
              <Link to="/careers" className="w-full py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-bold text-center transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                Check Eligibility
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="relative rounded-3xl bg-gradient-to-br from-cyan-glow/20 to-soft-purple/20 border border-white/10 p-12 md:p-20 overflow-hidden text-center">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-glow/20 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-soft-purple/20 rounded-full blur-[100px]" />
          
          <h2 className="text-4xl md:text-6xl font-bold mb-8 relative z-10">Ready to build the future?</h2>
          <p className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto relative z-10">
            Whether you're looking for a professional digital solution or a career-defining internship, C Found is your partner in technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
             <Link to="/contact" className="px-10 py-4 rounded-full bg-white text-black font-bold hover:bg-cyan-glow transition-all">
               Start a Project
             </Link>
             <Link to="/careers" className="px-10 py-4 rounded-full border border-white/20 bg-black/50 backdrop-blur-md font-bold hover:bg-white/10 transition-all">
               Join as Intern
             </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
