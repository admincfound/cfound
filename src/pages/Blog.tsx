import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Calendar, User, Clock, ArrowRight, Edit3, Trash2, Plus, Newspaper, X, Search, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Blog() {
  const { isAdmin } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const q = isAdmin 
        ? query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
        : query(collection(db, 'posts'), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
        
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [isAdmin]);

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }

    try {
      await deleteDoc(doc(db, 'posts', id));
      setDeletingId(null);
      fetchPosts();
      toast.success("Analysis purged from journal.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete analysis. Access denied.");
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Recently';
    try {
      if (date?.toDate) return date.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      if (typeof date === 'string') return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      return 'Recently';
    } catch (e) {
      return 'Recently';
    }
  };

  const filtered = posts.filter(posts => posts.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 flex flex-col md:flex-row items-center md:items-end justify-between gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <span className="text-primary-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-6 block underline decoration-4 underline-offset-8">Research Lab / Journal</span>
            <h1 className="text-5xl md:text-8xl font-black font-display tracking-tight text-[var(--text-main)] mb-8 leading-none italic uppercase">Insights & <span className="text-primary-600">Updates.</span></h1>
            <p className="text-[var(--text-muted)] max-w-2xl text-lg font-medium">Thoughts from our lab on the intersection of artificial intelligence, architecture, and engineering culture.</p>
          </motion.div>
          
          {isAdmin && (
            <button 
              onClick={() => {
                setEditingPost(null);
                setShowModal(true);
              }}
              className="btn-primary flex items-center gap-2 group"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform" /> New Analysis
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-20 border-b border-[var(--border-main)] pb-10">
           <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text"
              placeholder="Query journal entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl pl-12 pr-6 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary-500/50 transition-all text-[var(--text-main)]"
            />
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60">
            <Activity size={14} className="text-primary-600" /> Archives Active / {posts.length} entries detected
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[1, 2].map(n => <div key={n} className="h-96 bg-[var(--bg-card)] rounded-[3rem] animate-pulse border border-[var(--border-main)]" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-[var(--border-main)] rounded-[3rem] bg-[var(--bg-card)]/50">
            <Newspaper size={48} className="mx-auto text-[var(--text-muted)] mb-6 opacity-20" />
            <h3 className="text-xl font-bold font-display text-[var(--text-muted)] uppercase italic">The archives are currently empty.</h3>
            {isAdmin && <p className="text-[10px] font-bold uppercase tracking-widest text-primary-500 mt-4">Draft your first analysis to populate the sector.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <AnimatePresence mode="popLayout">
              {filtered.map((post, i) => (
                <motion.article
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={post.id}
                  className={`group relative bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3rem] overflow-hidden hover:border-primary-600/30 transition-all card-hover flex flex-col shadow-2xl ${post.status === 'hidden' ? 'opacity-60 grayscale' : ''}`}
                >
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <img 
                      src={post.imageUrl || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200"} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-8 left-8">
                      <span className="px-5 py-2 bg-[var(--bg-main)]/90 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest text-primary-600 shadow-xl border border-[var(--border-main)]">
                        {post.category}
                      </span>
                    </div>
                    {post.status === 'hidden' && (
                       <div className="absolute top-8 right-8 px-5 py-2 bg-red-600/90 text-white backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                         Locked / Draft
                       </div>
                    )}
                  </div>
                  <div className="p-12 flex-1 flex flex-col">
                    <div className="flex items-center gap-6 mb-8 text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-[0.2em] opacity-60">
                       <div className="flex items-center gap-2"><Calendar size={14} className="text-primary-600"/> {formatDate(post.createdAt)}</div>
                       <div className="flex items-center gap-2"><Clock size={14} className="text-primary-600"/> 5 min read</div>
                    </div>
                    <h2 className="text-3xl font-black font-display text-[var(--text-main)] mb-6 tracking-tight leading-tight group-hover:text-primary-600 transition-colors uppercase italic">
                      {post.title}
                    </h2>
                    <p className="text-[var(--text-muted)] text-base leading-relaxed mb-12 line-clamp-3 font-medium opacity-80">
                      {post.excerpt}
                    </p>
                    <div className="mt-auto pt-10 border-t border-[var(--border-main)] flex items-center justify-between">
                      <Link to={`/blog/${post.id}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary-600 hover:gap-6 transition-all group/link">
                        Infiltrate Intelligence <ArrowRight size={14} />
                      </Link>
                      
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingPost(post);
                              setShowModal(true);
                            }}
                            className="p-3 text-[var(--text-muted)] hover:text-primary-600 transition-colors bg-[var(--bg-main)]/50 rounded-xl border border-[var(--border-main)] shadow-sm"
                            title="Modify Analysis"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(post.id)}
                            className={`p-3 transition-all bg-[var(--bg-main)]/50 rounded-xl border shadow-sm ${deletingId === post.id ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'text-[var(--text-muted)] hover:text-red-500 border-[var(--border-main)]'}`}
                            title={deletingId === post.id ? "Confirm Purge" : "Purge Analysis"}
                          >
                            {deletingId === post.id ? <Trash2 size={16} className="animate-bounce" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <PostModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        post={editingPost} 
        onSuccess={fetchPosts}
      />
    </div>
  );
}

function PostModal({ isOpen, onClose, post, onSuccess }: any) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Engineering',
    excerpt: '',
    content: '',
    imageUrl: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (post) {
      setFormData(post);
    } else {
      setFormData({
        title: '',
        category: 'Engineering',
        excerpt: '',
        content: '',
        imageUrl: '',
        status: 'active'
      });
    }
  }, [post, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (post?.id) {
        await updateDoc(doc(db, 'posts', post.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'posts'), {
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
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-4xl bg-[var(--bg-main)] border border-[var(--border-main)] rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <div className="p-10 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-card)]">
              <div>
                <h2 className="text-2xl font-black font-display text-[var(--text-main)] uppercase italic tracking-tight">
                  {post ? 'Rewrite' : 'Generate'} <span className="text-primary-600">Article.</span>
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">Archive terminal system active</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Article Title</label>
                  <input 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., The Future of Neural Graphics"
                    className="input-main"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Category Sector</label>
                  <input 
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Engineering / Culture / Lab"
                    className="input-main"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Cover Image Source (Unsplash/Direct)</label>
                <input 
                  required
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  placeholder="https://images.unsplash.com/..."
                  className="input-main"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Executive Summary (Excerpt)</label>
                <textarea 
                  required
                  value={formData.excerpt}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  placeholder="The brief overview for the preview cards..."
                  className="input-main min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Core Content (Markdown Supported)</label>
                <textarea 
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="The full deep-dive analysis..."
                  className="input-main min-h-[250px] font-mono leading-relaxed"
                />
              </div>

              <div className="pt-8 border-t border-[var(--border-main)] flex justify-end gap-4">
                <button type="button" onClick={onClose} className="btn-secondary">Abort</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                  {post ? 'Commit Changes' : 'Sync Article'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
