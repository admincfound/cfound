import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';

export default function About() {
  return (
    <>
    <Helmet>
      <title>About | C FOUND Technologies</title>

      <meta
        name="description"
        content="Learn about C FOUND Technologies, an Indian software and game development company focused on AI systems, digital products, and innovation."
      />
    </Helmet>
    <div className="min-h-screen px-6 py-32 max-w-7xl mx-auto">
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-20"
      >
        <p className="text-primary-600 uppercase tracking-[0.3em] text-xs font-black mb-6">
          About C FOUND
        </p>

        <h1 className="text-6xl md:text-8xl font-black italic tracking-tight leading-none mb-8">
          Building The <span className="text-primary-600">Future.</span>
        </h1>

        <p className="text-xl text-[var(--text-muted)] max-w-3xl leading-relaxed">
          C FOUND is a software, AI, and game development company focused on creating
          scalable digital systems, immersive experiences, and high-performance technology solutions.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">

        <div className="p-10 rounded-[2rem] border border-[var(--border-main)] bg-[var(--bg-card)]">
          <h2 className="text-2xl font-black mb-4">AI Systems</h2>
          <p className="text-[var(--text-muted)]">
            Intelligent automation and next-generation AI platforms.
          </p>
        </div>

        <div className="p-10 rounded-[2rem] border border-[var(--border-main)] bg-[var(--bg-card)]">
          <h2 className="text-2xl font-black mb-4">Game Development</h2>
          <p className="text-[var(--text-muted)]">
            Advanced interactive experiences powered by Unreal Engine and Unity.
          </p>
        </div>

        <div className="p-10 rounded-[2rem] border border-[var(--border-main)] bg-[var(--bg-card)]">
          <h2 className="text-2xl font-black mb-4">Software Engineering</h2>
          <p className="text-[var(--text-muted)]">
            Scalable web platforms, mobile applications, and enterprise systems.
          </p>
        </div>

      </div>
    </div>
    </>
  );
}