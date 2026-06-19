'use client';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAuth } from './context/AuthContext';
import { ArrowRight, Code2, Briefcase, Rocket, BookOpen, Search } from 'lucide-react';

const divisions = [
  {
    icon: <Code2 size={32} />,
    title: "Services",
    description: "Full-spectrum technology solutions from game development and web platforms to mobile applications, AI systems, infrastructure, and digital products.",
    link: "/services",
    tag: "SERVICES",
  },
  {
    icon: <Briefcase size={32} />,
    title: "Internship",
    description: "Comprehensive training programs designed for junior engineers. Gain hands-on experience working on production-grade systems under expert mentorship.",
    link: "/internship",
    tag: "INTERNSHIP",
  },
  {
    icon: <Rocket size={32} />,
    title: "Projects",
    description: "Portfolio of completed projects across gaming, software engineering, and digital products. See real-world solutions we have delivered.",
    link: "/projects",
    tag: "PROJECTS",
  },
  {
    icon: <BookOpen size={32} />,
    title: "Academy",
    description: "Professional training courses and curriculum database featuring industry-standard learning paths taught by expert instructors.",
    link: "/academy",
    tag: "ACADEMY",
  }
];

const capabilities = [
  { name: "Game Development", category: "games" },
  { name: "Web Platforms", category: "web" },
  { name: "Mobile Apps", category: "mobile" },
  { name: "AI Systems", category: "ai" },
  { name: "Infrastructure", category: "infrastructure" },
  { name: "Digital Products", category: "products" }
];

export default function Home() {
  const { isAdmin } = useAuth();

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="py-24 lg:py-32 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">Home</span>
            <h1 className="text-6xl md:text-8xl font-black italic leading-tight mt-4 mb-8">
              Engineering
              <br />
              <span className="text-blue-600">Tomorrow</span>.
            </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl font-medium leading-relaxed">
              C Found is a premier Indian technology studio specializing in high-performance game engines, bespoke software products, mobile application ecosystems, and next-generation digital solutions.
            </p>
          </motion.div>

          {isAdmin ? null : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 mt-10 w-full sm:w-auto"
            >
              <Link 
                href="/projects" 
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-center hover:bg-blue-700 transition-colors"
              >
                Explore Portfolio
              </Link>
              <Link 
                href="/contact" 
                className="bg-gray-200 text-gray-900 px-8 py-4 rounded-lg font-bold text-center hover:bg-gray-300 transition-colors"
              >
                Get in Touch
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-20 lg:py-28 px-6 lg:px-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">Core Expertise</span>
            <h2 className="text-5xl md:text-7xl font-black italic text-gray-900 mt-4">
              Our <span className="text-blue-600">Capabilities</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="p-6 rounded-lg bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <p className="text-gray-900 font-bold text-lg">{capability.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Divisions Section */}
      <section className="py-24 lg:py-40 px-6 lg:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-20"
          >
            <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">Main Divisions</span>
            <h2 className="text-5xl md:text-8xl font-black italic text-gray-900 mt-4">
              What We
              <br />
              <span className="text-blue-600">Offer</span>.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {divisions.map((division, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <Link href={division.link}>
                  <div className="block p-8 lg:p-10 rounded-2xl bg-white border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        {division.icon}
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                        {division.tag}
                      </span>
                    </div>
                    
                    <h3 className="text-3xl md:text-4xl font-black italic text-gray-900 mb-4">
                      {division.title}
                    </h3>
                    
                    <p className="text-gray-700 text-lg leading-relaxed font-medium mb-6">
                      {division.description}
                    </p>
                    
                    <div className="flex items-center text-blue-600 font-bold gap-2">
                      Learn More <ArrowRight size={18} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 lg:py-40 px-6 lg:px-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">About</span>
              <h2 className="text-5xl md:text-6xl font-black italic text-gray-900 mt-4 mb-8">
                Premier Studio for
                <br />
                <span className="text-blue-600">Digital</span> Innovation
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed font-medium">
                With combined expertise spanning 15+ years in software development, game engineering, and digital product design, we deliver enterprise-grade solutions across the full technology stack.
              </p>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed font-medium">
                Our team of 100+ engineers and designers work on complex technical challenges, from real-time multiplayer systems to AI-powered platforms and scalable infrastructure solutions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-6"
            >
              {[
                { value: "15+", label: "Years Experience" },
                { value: "100+", label: "Team Members" },
                { value: "50+", label: "Projects" },
                { value: "4", label: "Global Offices" }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-lg bg-white border-2 border-gray-200"
                >
                  <div className="text-4xl font-black text-blue-600 mb-2">{stat.value}</div>
                  <p className="text-gray-700 font-bold text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-24 lg:py-40 px-6 lg:px-12 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">Strengths</span>
            <h2 className="text-5xl md:text-7xl font-black italic text-gray-900 mt-4">
              Why <span className="text-blue-600">Choose</span> Us
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Production Quality",
                desc: "Enterprise-standard code, rigorous testing, and security-first approach"
              },
              {
                title: "Expert Mentorship",
                desc: "Learn from senior engineers with extensive industry experience"
              },
              {
                title: "Real-World Impact",
                desc: "Work on products deployed to thousands of users globally"
              },
              {
                title: "Comprehensive Stack",
                desc: "Games, web, mobile, AI, and infrastructure all in-house"
              },
              {
                title: "International Scale",
                desc: "Based in India, serving clients and partners worldwide"
              },
              {
                title: "Career Development",
                desc: "Clear growth path from internship to senior positions"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="p-7 rounded-lg bg-gray-50 border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-700 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 lg:py-40 px-6 lg:px-12 bg-blue-600">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black italic text-white mb-8 leading-tight">
            Ready to Begin
            <br />
            <span className="text-blue-100">Your</span> Journey?
          </h2>

          <p className="text-xl text-blue-100 mb-12 font-medium leading-relaxed">
            {isAdmin
              ? "Manage studio operations, review applications, and oversee project delivery."
              : "Explore our services, apply for internships, or partner with us to build something extraordinary."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAdmin ? (
              <Link
                href="/admin"
                className="bg-white text-blue-600 px-10 py-4 rounded-lg font-bold hover:bg-blue-50 transition-colors inline-block"
              >
                Admin Console
              </Link>
            ) : (
              <>
                <Link
                  href="/services"
                  className="bg-white text-blue-600 px-10 py-4 rounded-lg font-bold hover:bg-blue-50 transition-colors inline-block"
                >
                  Explore Services
                </Link>
                <Link
                  href="/internship"
                  className="bg-blue-700 text-white px-10 py-4 rounded-lg font-bold hover:bg-blue-800 transition-colors inline-block border border-blue-600"
                >
                  Join Internship
                </Link>
                <Link
                  href="/contact"
                  className="bg-blue-500 text-white px-10 py-4 rounded-lg font-bold hover:bg-blue-600 transition-colors inline-block"
                >
                  Contact Us
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </section>
    </div>
  );
}