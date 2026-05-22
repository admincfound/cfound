import { motion } from 'motion/react';
import { Cpu, Globe, Smartphone, Gamepad2, Shield, Rocket } from 'lucide-react';

const tech = [
  {
    icon: <Cpu className="text-primary-500" />,
    title: "AI Systems",
    desc: "Intelligent automation, AI-powered platforms, and scalable neural infrastructures."
  },
  {
    icon: <Gamepad2 className="text-indigo-500" />,
    title: "Game Development",
    desc: "Immersive real-time experiences powered by Unreal Engine and Unity ecosystems."
  },
  {
    icon: <Globe className="text-blue-500" />,
    title: "Web Platforms",
    desc: "High-performance digital systems engineered for modern businesses and startups."
  },
  {
    icon: <Smartphone className="text-cyan-500" />,
    title: "Mobile Applications",
    desc: "Scalable Android and iOS applications optimized for performance and reliability."
  },
  {
    icon: <Shield className="text-emerald-500" />,
    title: "Infrastructure",
    desc: "Secure backend architectures, cloud deployment pipelines, and API ecosystems."
  },
  {
    icon: <Rocket className="text-purple-500" />,
    title: "Digital Products",
    desc: "Launching next-generation software products from prototype to global deployment."
  }
];

export default function Services() {
  return (
    <div className="min-h-screen px-6 py-32 max-w-7xl mx-auto">

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-24"
      >
        <p className="text-primary-600 uppercase tracking-[0.3em] text-xs font-black mb-6">
          Technology Ecosystem
        </p>

        <h1 className="text-6xl md:text-8xl font-black italic tracking-tight leading-none mb-10">
          Engineering <span className="text-primary-600">Tomorrow.</span>
        </h1>

        <p className="text-xl text-[var(--text-muted)] max-w-3xl leading-relaxed">
          C FOUND develops advanced software systems, AI-powered platforms,
          immersive game technologies, scalable infrastructure, and next-generation digital products.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

        {tech.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-10 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-primary-600/30 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-main)] flex items-center justify-center mb-8">
              {item.icon}
            </div>

            <h2 className="text-2xl font-black mb-4 italic">
              {item.title}
            </h2>

            <p className="text-[var(--text-muted)] leading-relaxed">
              {item.desc}
            </p>
          </motion.div>
        ))}

      </div>
    </div>
  );
}