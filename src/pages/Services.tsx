import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Gamepad2, Globe, Laptop, Database, Smartphone, Layout, Tablet, Monitor } from 'lucide-react';

const services = [
  {
    icon: Gamepad2,
    title: 'Game Development',
    description: 'Immersive gaming experiences built with Unity and Unreal Engine. From mobile casuals to high-fidelity PC adventures.',
    features: ['Multiplayer Logic', 'AR/VR Integration', 'Custom Shaders']
  },
  {
    icon: Laptop,
    title: 'Website Development',
    description: 'High-performance, SEO-optimized web platforms using React, Next.js, and modern CSS frameworks.',
    features: ['Pixel-perfect UI', 'Scalable Backends', 'Performance Tuning']
  },
  {
    icon: Smartphone,
    title: 'App Development',
    description: 'Native and cross-platform mobile applications that provide seamless experiences across iOS and Android.',
    features: ['Real-time Sync', 'Offline Mode', 'Push Notifications']
  },
  {
    icon: Monitor,
    title: 'Software Engineering',
    description: 'Custom enterprise software solutions designed to streamline complex business processes and operations.',
    features: ['Workflow Automation', 'Cloud Integration', 'Microservices']
  },
  {
    icon: Database,
    title: 'Database Systems',
    description: 'Robust, secure, and efficient database architectures for handling large-scale data and complex relationships.',
    features: ['Data Normalization', 'Query Optimization', 'Advanced Analytics']
  },
  {
    icon: Layout,
    title: 'UI/UX Design',
    description: 'User-centric design systems that prioritize usability while maintaining a premium high-tech aesthetic.',
    features: ['Interactive Prototyping', 'User Psychology', 'Design Systems']
  }
];

export default function Services() {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <h1 className="text-4xl md:text-6xl font-bold mb-8">Professional <span className="text-gradient">Technology Services</span></h1>
          <p className="text-white/50 text-xl leading-relaxed">
            We specialize in developing robust digital products that combine technical excellence with exceptional user experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-10 group hover:bg-white/[0.06] transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-glow/5 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="w-16 h-16 rounded-2xl bg-cyan-glow/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <service.icon className="text-cyan-glow" size={32} />
              </div>

              <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8">
                {service.description}
              </p>

              <div className="space-y-3 pt-6 border-t border-white/5">
                {service.features.map(feature => (
                   <div key={feature} className="flex items-center gap-3 text-xs font-semibold text-white/40 group-hover:text-white/60 transition-colors uppercase tracking-widest">
                     <div className="w-1.5 h-1.5 rounded-full bg-cyan-glow" />
                     {feature}
                   </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom Section */}
        <div className="mt-32 p-12 md:p-20 rounded-3xl bg-navy/20 border border-white/10 flex flex-col lg:flex-row items-center gap-12">
           <div className="lg:w-1/2">
             <h2 className="text-3xl md:text-5xl font-bold mb-6 italic">Precision Meets <br /> Innovation</h2>
             <p className="text-white/50 text-lg leading-relaxed mb-8">
               Our development process is rooted in standard industry practices, ensuring that your product is not only functional but also scalable and maintainable.
             </p>
             <Link to="/contact" className="px-10 py-4 rounded-full bg-cyan-glow text-black font-bold hover:scale-105 transition-transform inline-block">
               Discuss Your Project
             </Link>
           </div>
           <div className="lg:w-1/2 grid grid-cols-2 gap-4">
              <div className="aspect-video rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                <div className="text-center">
                   <div className="text-2xl font-bold text-cyan-glow">Vite</div>
                   <div className="text-[10px] text-white/30 uppercase tracking-widest">Lightning Fast</div>
                </div>
              </div>
              <div className="aspect-video rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                 <div className="text-center">
                    <div className="text-2xl font-bold text-soft-purple">Next.js</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest">SEO Optimized</div>
                 </div>
              </div>
              <div className="aspect-video rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                 <div className="text-center">
                    <div className="text-2xl font-bold text-white">Docker</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest">Cloud Ready</div>
                 </div>
              </div>
              <div className="aspect-video rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                 <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-glow">AWS</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest">Highly Secure</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
