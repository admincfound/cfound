import { motion } from 'motion/react';
import { Database, Code2, Globe2, Cpu, Cloud, Smartphone, Box, Shield, Terminal } from 'lucide-react';

const techCategories = [
  {
    category: 'Frontend Development',
    items: [
      { name: 'React', icon: Globe2, color: 'text-blue-400' },
      { name: 'Next.js', icon: Code2, color: 'text-white' },
      { name: 'Tailwind CSS', icon: Box, color: 'text-cyan-400' },
    ]
  },
  {
    category: 'Backend & Systems',
    items: [
      { name: 'Node.js', icon: Terminal, color: 'text-green-400' },
      { name: 'Python', icon: Cpu, color: 'text-blue-500' },
      { name: 'Docker', icon: Cloud, color: 'text-blue-300' },
    ]
  },
  {
    category: 'Database & Security',
    items: [
      { name: 'SQL', icon: Database, color: 'text-orange-400' },
      { name: 'MongoDB', icon: Database, color: 'text-green-500' },
      { name: 'Firebase', icon: Shield, color: 'text-red-400' },
    ]
  },
  {
    category: 'Creative & Mobile',
    items: [
      { name: 'Unity', icon: Box, color: 'text-white' },
      { name: 'Unreal Engine', icon: Cpu, color: 'text-gray-400' },
      { name: 'React Native', icon: Smartphone, color: 'text-purple-400' },
    ]
  }
];

export default function Technologies() {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <h1 className="text-4xl md:text-6xl font-bold mb-8">Our <span className="text-gradient">Tech Stack</span></h1>
          <p className="text-white/50 text-xl leading-relaxed">
            We leverage a diverse range of modern technologies to build scalable, high-performance digital solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {techCategories.map((cat, idx) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-12 overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                {(() => {
                  const Icon = cat.items[0].icon;
                  return <Icon size={120} />;
                })()}
              </div>
              
              <h2 className="text-sm font-bold text-cyan-glow uppercase tracking-[0.3em] mb-12 border-b border-white/5 pb-6">
                {cat.category}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {cat.items.map(item => (
                  <div key={item.name} className="flex flex-col items-center sm:items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                      <item.icon size={24} />
                    </div>
                    <div>
                      <div className="font-bold mb-1">{item.name}</div>
                      <div className="text-[10px] text-white/30 uppercase tracking-widest">Industry Standard</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Continuous Integration Visual */}
        <div className="mt-32 p-12 md:p-20 border border-white/5 bg-gradient-to-br from-navy/30 to-black rounded-[40px]">
           <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
             <div className="lg:w-1/2">
                <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">Always Staying <br /> Ahead of the Curve</h2>
                <p className="text-white/40 mb-8 leading-relaxed">
                  The technology landscape evolves daily. We ensure our team and interns are always working with the latest stable versions of frameworks and tools.
                </p>
                <div className="flex items-center gap-6">
                   <div className="text-center">
                     <div className="text-xl font-bold">100%</div>
                     <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Modern Stack</div>
                   </div>
                   <div className="w-px h-10 bg-white/10" />
                   <div className="text-center">
                     <div className="text-xl font-bold">24/7</div>
                     <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">System Monitoring</div>
                   </div>
                   <div className="w-px h-10 bg-white/10" />
                   <div className="text-center">
                     <div className="text-xl font-bold">Weekly</div>
                     <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Tech Audits</div>
                   </div>
                </div>
             </div>
             
             <div className="lg:w-1/3 grid grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-cyan-glow/5 border border-cyan-glow/10 flex items-center justify-center animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                    <div className="w-2 h-2 rounded-full bg-cyan-glow/30" />
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
