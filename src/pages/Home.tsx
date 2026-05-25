import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Code, Gamepad2, Smartphone, Globe, Cpu, Users, Rocket, Zap, Shield, Target, MapPin } from 'lucide-react';

const features = [
  { 
    icon: <Gamepad2 className="text-indigo-500" />, 
    title: "Game Engines", 
    desc: "Developing custom multiplayer frameworks and immersive 3D environments for next-gen gaming platforms." 
  },
  { 
    icon: <Smartphone className="text-blue-500" />, 
    title: "Mobile Ecosystems", 
    desc: "Architecting robust iOS and Android solutions with seamless cloud synchronization and native performance." 
  },
  { 
    icon: <Code className="text-purple-500" />, 
    title: "Custom Software", 
    desc: "Creating bespoke enterprise-grade architectures that solve complex computational challenges at scale." 
  },
  { 
    icon: <Rocket className="text-emerald-500" />, 
    title: "Studio Launchpad", 
    desc: "Incubating high-potential digital products from initial prototype to global market distribution." 
  }
];

export default function Home() {
  const { isAdmin } = useAuth();
  return (
    <>
      <Helmet>
        <title>C FOUND Technologies | AI, Software & Game Development Company India</title>

        <meta
          name="description"
          content="C FOUND Technologies builds AI systems, software platforms, mobile applications, and immersive digital experiences."
        />
      </Helmet>
    <div className="flex flex-col min-h-screen">
      {/* System Ticker */}
      <div className="h-10 bg-primary-600/5 border-b border-[var(--border-main)] flex items-center overflow-hidden whitespace-nowrap">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-12 text-[9px] font-black uppercase tracking-[0.3em] text-primary-500/60"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="flex items-center gap-4">
              <Shield size={12} /> System Status: Operational
              <MapPin size={12} /> Region: Bharat-Central
              <Globe size={12} /> Node: Mumbai-CORE-01
              <Cpu size={12} /> Neural Core: Online
              <Zap size={12} /> Latency: 8ms
            </span>
          ))}
        </motion.div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.08),transparent_70%)]" />        
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
          <div className="absolute top-0 right-10 w-96 h-96 bg-primary-600/5 blur-[120px] rounded-full animate-pulse" />
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-main)] text-primary-600 text-[10px] font-black uppercase tracking-widest mb-10 shadow-xl">
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-ping" />
                Advanced Game & Software Studio
              </div>
              
              <h1 className="text-6xl md:text-9xl font-black font-display tracking-tight leading-[0.85] mb-10 uppercase italic">
                Forging <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary-500 via-blue-600 to-indigo-700">Digital Worlds.</span>
              </h1>
              <p className="text-xl md:text-2xl text-[var(--text-muted)] max-w-2xl mb-16 font-semibold leading-relaxed tracking-tight italic">
                C Found is a premier Indian technology studio specializing in high-performance game engines, bespoke software products, and mobile application ecosystems.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {isAdmin ? (
                  <Link to="/admin" className="btn-primary w-full sm:w-auto text-center px-12 py-5 relative group overflow-hidden">
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      Access Console <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link to="/projects" className="btn-primary w-full sm:w-auto text-center px-12 py-5 shadow-[0_20px_50px_rgba(37,99,235,0.2)]">
                      Explore Portfolio
                    </Link>
                    <Link to="/internship" className="btn-secondary w-full sm:w-auto text-center px-12 py-5 border-2">
                       Internship Labs
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Expertise Grid */}
      <section className="py-32 lg:py-48 bg-[var(--bg-main)] relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--primary-600-rgb),0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary-600-rgb),0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8 mb-24">
            <div className="max-w-2xl">
              <h2 className="text-[10px] font-black text-primary-600 uppercase tracking-[0.4em] mb-6">Expertise Domains</h2>
              <p className="text-5xl md:text-8xl font-black font-display tracking-tighter text-[var(--text-main)] mb-6 uppercase italic leading-none">High-Stack <br /><span className="text-primary-600">Operations.</span></p>
            </div>
            <p className="text-[var(--text-muted)] max-w-sm text-sm font-bold uppercase tracking-tight leading-relaxed opacity-60 italic">
              Specialized execution in sectors requiring zero-latency performance and unbreakable security architectures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[3rem] bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-primary-600/30 transition-all card-hover group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-main)] flex items-center justify-center mb-8 shadow-inner border border-[var(--border-main)] group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-black mb-4 font-display uppercase italic tracking-tighter">{f.title}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed font-medium opacity-80">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="relative max-w-5xl mx-auto p-6 md:p-12 lg:p-32 rounded-[4rem] bg-[var(--bg-card)] border border-[var(--border-main)] overflow-hidden text-center shadow-2xl">
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary-600/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[100px]" />
            
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="text-4xl md:text-6xl lg:text-9xl font-black font-display tracking-tighter mb-10 uppercase italic leading-none"
            >
              Architect the <span className="text-primary-600">Future.</span>
            </motion.h2>
            <p className="text-[var(--text-muted)] text-base md:text-2xl mb-10 md:mb-16 max-w-3xl mx-auto font-semibold leading-relaxed opacity-80 italic tracking-tight">
              {isAdmin 
                ? "Manage Indian ecosystem operations, review candidates from the national grid, and curate the studio portfolio."
                : "Join Bharat's elite network of engineers and visionaries. Start your journey with C Found today."}
            </p>
            
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8">
              {isAdmin ? (
                <>
                  <Link to="/admin" className="btn-primary px-6 py-3 md:px-10 md:py-5 text-xs shadow-2xl">Console Entry</Link>
                  <Link to="/admin/applications" className="btn-secondary px-6 py-3 md:px-10 md:py-5 text-xs">Review Queue</Link>
                </>
              ) : (
                <>
                  <Link to="/projects" className="btn-primary px-6 py-3 md:px-10 md:py-5 text-xs shadow-2xl">View Portfolio</Link>
                  <Link to="/internship" className="btn-secondary px-6 py-3 md:px-10 md:py-5 text-xs">Graduate Labs</Link>
                  <Link to="/careers" className="btn-secondary px-6 py-3 md:px-10 md:py-5 text-xs">Join the Fleet</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
