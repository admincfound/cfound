import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, 
  Shield, 
  Database, 
  Cpu, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Save, 
  ArrowLeft,
  Settings,
  Mail,
  Lock,
  Zap,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

interface ApiConfig {
  firebase_config: string;
  gemini_api_key: string;
  emailjs_service_id: string;
  emailjs_template_id: string;
  emailjs_public_key: string;
}

export default function ApiSettings() {
  const [config, setConfig] = useState<ApiConfig>({
    firebase_config: '',
    gemini_api_key: '',
    emailjs_service_id: '',
    emailjs_template_id: '',
    emailjs_public_key: '',
  });
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'system_config', 'api_settings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setConfig({
            firebase_config: data.firebase_config || '',
            gemini_api_key: data.gemini_api_key || '',
            emailjs_service_id: data.emailjs_service_id || '',
            emailjs_template_id: data.emailjs_template_id || '',
            emailjs_public_key: data.emailjs_public_key || '',
          });
        }
      } catch (err) {
        console.error("Error fetching config:", err);
        toast.error("Failed to load configurations.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleShow = (key: string) => {
    setShowKey(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'system_config', 'api_settings'), {
        ...config,
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      toast.success("Configurations saved successfully.");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Error saving config:", err);
      toast.error("Access Denied: Admin permissions required.");
    } finally {
      setSaving(false);
    }
  };

  const getConfigStatus = (value: string) => {
    if (!value) return { label: 'Missing', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
    if (value.length < 10) return { label: 'Invalid', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
    return { label: 'Connected', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
  };

  if (loading) {
    return (
      <div className="pt-32 pb-32 px-6 min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-[10px]">Pulling Manifest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-32 px-6 min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 text-primary-500 font-bold uppercase tracking-widest text-xs mb-4">
              Console / Settings
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight mb-4 uppercase italic">
              API <span className="text-primary-500">Configuration.</span>
            </h1>
            <p className="text-[var(--text-muted)] font-medium max-w-xl">
              Configure essential service keys and third-party integrations.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Link to="/admin" className="p-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-[var(--text-muted)] hover:text-primary-600 transition-colors shadow-xl">
              <ArrowLeft size={20} />
            </Link>
            <button 
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-primary-500/10 ${
                saved ? 'bg-emerald-600 text-white' : 'btn-primary'
              }`}
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? 'Saved' : 'Save Config'}
            </button>
          </motion.div>
        </div>

        {/* API Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <ConfigCard 
            icon={<Database size={24} />}
            service="Firebase Integration"
            title="Project Configuration"
            description="The core JSON configuration for your Firebase project. This initializes authentication and database services."
            value={config.firebase_config}
            onUpdate={(v: string) => setConfig({...config, firebase_config: v})}
            show={showKey['firebase_config']}
            onToggle={() => toggleShow('firebase_config')}
            onCopy={() => handleCopy('firebase_config', config.firebase_config)}
            isCopied={copied === 'firebase_config'}
            status={getConfigStatus(config.firebase_config)}
            isTextArea={true}
          />

          <div className="space-y-8">
            <ConfigCard 
              icon={<Cpu size={24} />}
              service="AI Engine"
              title="Gemini API Key"
              description="Required for AI-powered research and analysis features."
              value={config.gemini_api_key}
              onUpdate={(v: string) => setConfig({...config, gemini_api_key: v})}
              show={showKey['gemini_api_key']}
              onToggle={() => toggleShow('gemini_api_key')}
              onCopy={() => handleCopy('gemini_api_key', config.gemini_api_key)}
              isCopied={copied === 'gemini_api_key'}
              status={getConfigStatus(config.gemini_api_key)}
            />

            <ConfigCard 
              icon={<Mail size={24} />}
              service="Email Service"
              title="EmailJS Public Key"
              description="The public key for authenticating email delivery requests."
              value={config.emailjs_public_key}
              onUpdate={(v: string) => setConfig({...config, emailjs_public_key: v})}
              show={showKey['emailjs_public_key']}
              onToggle={() => toggleShow('emailjs_public_key')}
              onCopy={() => handleCopy('emailjs_public_key', config.emailjs_public_key)}
              isCopied={copied === 'emailjs_public_key'}
              status={getConfigStatus(config.emailjs_public_key)}
            />
          </div>

          <ConfigCard 
            icon={<Mail size={24} />}
            service="Email Service"
            title="Service ID"
            description="Your EmailJS service identifier."
            value={config.emailjs_service_id}
            onUpdate={(v: string) => setConfig({...config, emailjs_service_id: v})}
            show={true}
            noToggle={true}
            onCopy={() => handleCopy('emailjs_service_id', config.emailjs_service_id)}
            isCopied={copied === 'emailjs_service_id'}
            status={getConfigStatus(config.emailjs_service_id)}
          />

          <ConfigCard 
            icon={<Mail size={24} />}
            service="Email Service"
            title="Template ID"
            description="The specific email template ID for recruitment notifications."
            value={config.emailjs_template_id}
            onUpdate={(v: string) => setConfig({...config, emailjs_template_id: v})}
            show={true}
            noToggle={true}
            onCopy={() => handleCopy('emailjs_template_id', config.emailjs_template_id)}
            isCopied={copied === 'emailjs_template_id'}
            status={getConfigStatus(config.emailjs_template_id)}
          />
        </div>
      </div>
    </div>
  );
}

function ConfigCard({ 
  icon, 
  service,
  title, 
  description, 
  value, 
  onUpdate, 
  show, 
  onToggle, 
  onCopy, 
  isCopied, 
  status, 
  isTextArea,
  noToggle
}: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[3rem] p-10 hover:border-primary-500/30 transition-all shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-primary-500 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none uppercase font-black text-6xl italic">
        {title.split(' ')[0]}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[2rem] bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center text-primary-500 shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
            {icon}
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-primary-500 mb-2">{service}</div>
            <h3 className="font-black text-2xl tracking-tighter uppercase italic text-[var(--text-main)]">{title}</h3>
          </div>
        </div>
        <div className={`inline-flex px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border self-start md:self-center ${status.color} shadow-xl`}>
          {status.label}
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)] font-medium leading-[1.8] mb-10 max-w-2xl">
        {description}
      </p>

      <div className="relative group/input">
        {isTextArea ? (
           <textarea 
            value={value}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder={`Initialize ${title} payload...`}
            className={`w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-3xl px-8 py-6 text-xs font-mono focus:outline-none focus:border-primary-500/50 transition-all min-h-[180px] leading-relaxed ${!show && value ? 'blur-md select-none opacity-40' : ''} shadow-inner text-[var(--text-main)]`}
           />
        ) : (
          <input 
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder={`Initialize ${title} sequence...`}
            className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-3xl px-8 py-6 pr-40 text-xs font-mono focus:outline-none focus:border-primary-500/50 transition-all shadow-inner text-[var(--text-main)]"
          />
        )}
        
        <div className={`absolute top-1/2 -translate-y-1/2 right-6 flex items-center gap-4 ${isTextArea ? 'top-auto bottom-6' : ''}`}>
          {!noToggle && (
            <button 
              onClick={onToggle}
              className="p-2 text-[var(--text-muted)] hover:text-primary-600 transition-colors"
              title={show ? "Obfuscate" : "Reveal"}
            >
              {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
          <button 
            onClick={onCopy}
            className="px-5 py-2.5 bg-[var(--bg-hover)] border border-[var(--border-main)] rounded-2xl text-[var(--text-muted)] hover:text-primary-600 transition-all shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 group-hover:border-primary-500/20"
          >
            {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isCopied ? 'Copied' : 'Clone'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
