import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ExternalLink, Github, Layers, Gamepad2, Smartphone, Cpu, Layout, Edit3, Trash2, Plus, X, Search, Filter } from 'lucide-react';

import { toast } from 'react-hot-toast';

const categories = ['All', 'Game', 'Website', 'App', 'AI', 'Software'];

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const q = isAdmin 
        ? query(collection(db, 'projects'))
        : query(collection(db, 'projects'), where('status', 'in', ['active', 'featured']));
        
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [isAdmin]);

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }

    try {
      await deleteDoc(doc(db, 'projects', id));
      setDeletingId(null);
      fetchProjects();
      toast.success("Project purged from database.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to purge project. Access denied.");
    }
  };

  const filtered = (filter === 'All' ? projects : projects.filter(p => p.category === filter))
    .filter(projects => projects.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8"
          >
            <div className="flex-1">
              <span className="text-primary-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-4 block">Archive / Portfolio</span>
              <h1 className="text-5xl md:text-7xl font-black font-display tracking-tight text-[var(--text-main)] mb-6 leading-none italic">
                Selected <span className="text-primary-600">Works.</span>
              </h1>
              <p className="text-[var(--text-muted)] max-w-xl text-lg font-medium">A chronicle of our architectural achievements across games, software, and artificial intelligence.</p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingProject(null);
                  setShowModal(true);
                }}
                className="btn-primary flex items-center gap-2 group"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform" /> New Project
              </button>
            )}
          </motion.div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-16 border-b border-[var(--border-main)] pb-10">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filter === c 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-main)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text"
              placeholder="Query project database..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl pl-12 pr-6 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary-500/50 transition-all text-[var(--text-main)]"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(n => <div key={n} className="aspect-[16/11] bg-[var(--bg-card)] rounded-[2.5rem] animate-pulse border border-[var(--border-main)]" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-[var(--border-main)] rounded-[3rem] bg-[var(--bg-card)]/50">
            <Layers size={48} className="mx-auto text-[var(--text-muted)] mb-6 opacity-20" />
            <h3 className="text-xl font-bold font-display text-[var(--text-muted)] uppercase italic">No records detected in this sector.</h3>
            {isAdmin && <p className="text-[10px] font-bold uppercase tracking-widest text-primary-500 mt-4">Initialize protocol to add data.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={p.id}
                  className={`group relative bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2.5rem] overflow-hidden hover:border-primary-600/30 transition-all card-hover ${p.status === 'hidden' ? 'opacity-60 grayscale' : ''}`}
                >
                  <div className="aspect-[16/11] overflow-hidden relative">
                    <img 
                      src={p.imageUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"} 
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity" />
                    
                    {isAdmin && (
                      <div className="absolute top-6 right-6 flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(p);
                            setShowModal(true);
                          }}
                          className="p-3 bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-main)] text-[var(--text-main)] rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-xl"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(p.id);
                          }}
                          className={`p-3 backdrop-blur-md border rounded-xl transition-all shadow-xl ${deletingId === p.id ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-[var(--bg-card)]/80 border-[var(--border-main)] text-[var(--text-main)] hover:bg-red-600 hover:text-white'}`}
                        >
                          <Trash2 size={14} className={deletingId === p.id ? 'animate-bounce' : ''} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-2 mb-4">
                      {getCategoryIcon(p.category)}
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary-600">{p.category}</span>
                      {p.status === 'featured' && (
                        <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-primary-600 text-white rounded">Featured</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold font-display text-[var(--text-main)] mb-4 tracking-tight group-hover:text-primary-600 transition-colors uppercase italic">{p.title}</h3>
                    <p className="text-[var(--text-muted)] text-xs leading-relaxed mb-8 line-clamp-2 font-medium">
                      {p.description}
                    </p>
                    <div className="flex items-center gap-4 border-t border-[var(--border-main)] pt-6">
                      {p.demoUrl && (
                        <a href={p.demoUrl} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-600 hover:gap-3 transition-all">
                          Prototype <ExternalLink size={12} />
                        </a>
                      )}
                      {p.githubUrl && (
                        <a href={p.githubUrl} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors ml-auto">
                          <Github size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ProjectModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        project={editingProject} 
        onSuccess={fetchProjects}
      />
    </div>
  );
}

function ProjectModal({ isOpen, onClose, project, onSuccess }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Website',
    imageUrl: '',
    demoUrl: '',
    githubUrl: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) setFormData({ ...project });
    else setFormData({
      title: '',
      description: '',
      category: 'Website',
      imageUrl: '',
      demoUrl: '',
      githubUrl: '',
      status: 'active'
    });
  }, [project, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (project?.id) {
        await updateDoc(doc(db, 'projects', project.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'projects'), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-[var(--bg-main)] border border-[var(--border-main)] rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <div className="p-10 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-card)]">
              <div>
                <h2 className="text-2xl font-black font-display text-[var(--text-main)] uppercase italic tracking-tight">
                  {project ? 'Edit' : 'Create'} <span className="text-primary-600">Project.</span>
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">Project Management Mode</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Project Title</label>
                  <input 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter project name..."
                    className="input-main"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Category / Domain</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="input-main"
                  >
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Description</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Summarize project capabilities..."
                  className="input-main min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Cover Image URL</label>
                <div className="space-y-4">
                  <input 
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    placeholder="https://images.unsplash.com/..."
                    className="input-main"
                  />
                  {formData.imageUrl && (
                    <div className="h-40 w-full rounded-2xl overflow-hidden border border-[var(--border-main)]">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Production URL</label>
                  <input 
                    value={formData.demoUrl}
                    onChange={(e) => setFormData({...formData, demoUrl: e.target.value})}
                    placeholder="Live deployment link..."
                    className="input-main"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Terminal URL (Repo)</label>
                  <input 
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
                    placeholder="GitHub repository link..."
                    className="input-main"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">System Status</label>
                <div className="flex gap-4">
                  {['active', 'hidden', 'featured'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({...formData, status: s})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        formData.status === s 
                        ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-600/20' 
                        : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-main)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--border-main)] flex justify-end gap-4">
                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                  {project ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function getCategoryIcon(cat: string) {
  switch(cat) {
    case 'Game': return <Gamepad2 size={12} className="text-blue-500" />;
    case 'AI': return <Cpu size={12} className="text-purple-500" />;
    case 'Website': return <Layout size={12} className="text-green-500" />;
    case 'App': return <Smartphone size={12} className="text-orange-500" />;
    default: return <Layers size={12} className="text-blue-500" />;
  }
}
