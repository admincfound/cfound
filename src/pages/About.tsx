import { motion } from 'motion/react';
import { Target, Eye, ShieldCheck, Briefcase, Award } from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Our Mission',
    description: 'To develop cutting-edge digital products while empowering the next generation of developers with practical, industry-grade experience.'
  },
  {
    icon: Eye,
    title: 'Our Vision',
    description: 'To be the bridge between academic learning and professional excellence, fostering a community of skilled innovators.'
  },
  {
    icon: Briefcase,
    title: 'Industry Focused',
    description: 'Every project we undertake is built with the same precision and scalability required in top-tier technology firms.'
  }
];

export default function About() {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-24">
          <h1 className="text-4xl md:text-6xl font-bold mb-8">
            Empowering Through <br />
            <span className="text-gradient">Real-World Innovation</span>
          </h1>
          <p className="text-white/50 text-xl leading-relaxed">
            C Found was established with a singular focus: to build exceptional digital solutions while solving the "experience gap" for emerging developers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          {values.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-10"
            >
              <item.icon className="text-cyan-glow mb-8" size={40} />
              <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
              <p className="text-white/50 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">Career Growth <br /> Philosophy</h2>
            <p className="text-white/50 leading-relaxed text-lg">
              We believe that the best way to learn is by doing. In our environment, there is no "simulated" data or "dummy" projects. We build production-ready software that solves real problems.
            </p>
            <div className="space-y-4 pt-4">
              {[
                'Direct mentorship from industry leads',
                'Exposure to professional workflows (Git, CI/CD, Agile)',
                'Collaborative environment with cross-functional teams',
                'Focus on clean code and architectural patterns'
              ].map(point => (
                <div key={point} className="flex gap-4 items-start">
                  <ShieldCheck className="text-cyan-glow shrink-0 mt-1" size={20} />
                  <span className="text-white/80">{point}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden glass-card p-2">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800" 
                alt="Team Collaboration" 
                className="w-full h-full object-cover rounded-2xl opacity-90 hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Floating stats card */}
            <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -bottom-10 -left-10 glass-card p-8 shadow-2xl"
            >
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-cyan-glow/20 flex items-center justify-center">
                   <Award className="text-cyan-glow" />
                 </div>
                 <div>
                   <div className="text-2xl font-bold">100%</div>
                   <div className="text-xs text-white/40 uppercase tracking-widest">Practical Experience</div>
                 </div>
               </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
