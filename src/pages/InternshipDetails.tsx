import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MapPin, Clock, CheckCircle2, Share2 } from 'lucide-react';

export default function InternshipDetails() {
  const { id } = useParams();
  const [internship, setInternship] = useState<any>(null);

  const handleShare = async () => {
    const shareData = {
      title: internship.title,
      text: `Check out this internship opportunity at C FOUND`,
      url: window.location.href,
    };

    try {
      await navigator.share(shareData);
    } catch {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard');
    }
  };

  useEffect(() => {
    const fetchInternship = async () => {
      if (!id) return;

      const snap = await getDoc(doc(db, 'opportunities', id));

      if (snap.exists()) {
        setInternship({
          id: snap.id,
          ...snap.data()
        });
      }
    };

    fetchInternship();
  }, [id]);

  if (!internship) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-5xl mx-auto">

        <div className="mb-10">

          <div className="flex items-center gap-4 flex-wrap mb-6">

            <span className="px-4 py-2 rounded-xl bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-widest">
              {internship.internshipType}
            </span>

            <span className="px-4 py-2 rounded-xl border border-[var(--border-main)] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <MapPin size={14} />

              {
                internship.mode === 'Remote'
                  ? 'Remote'
                  : `${internship.mode} • ${internship.location}`
              }
            </span>

            <span className="px-4 py-2 rounded-xl border border-[var(--border-main)] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} />
              {internship.duration}
            </span>

          </div>

          <h1 className="text-5xl font-black uppercase italic mb-6">
            {internship.title}
          </h1>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">

            <div className="text-2xl font-black text-primary-500">
              {
                internship.internshipType === 'paid'
                  ? `₹${internship.stipend}/month`
                  : internship.internshipType === 'training'
                    ? `Training Fee: ₹${internship.trainingFee}`
                    : 'Unpaid Internship'
              }
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] hover:border-primary-500 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Share2 size={14} />
              Share Opportunity
            </button>
            <div className="flex gap-4 flex-wrap mt-4">

              <Link
                to="/internship"
                className="px-5 py-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] text-[10px] font-black uppercase tracking-widest"
              >
                Back
              </Link>

              <button
                className="px-6 py-3 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest"
              >
                Apply Now
              </button>

            </div>

          </div>

        </div>

        <div className="p-8 rounded-[2rem] border border-[var(--border-main)] bg-[var(--bg-card)] mb-10">

          <h2 className="text-2xl font-black uppercase mb-8">
            Skills & Requirements
          </h2>

          <div className="grid md:grid-cols-2 gap-5">

            {(internship.requirements || []).map((req: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)]"
              >
                <CheckCircle2 size={18} className="text-primary-500 mt-1" />
                <span>{req}</span>
              </div>
            ))}

          </div>

        </div>

        <div className="p-8 rounded-[2rem] border border-[var(--border-main)] bg-[var(--bg-card)]">

          <h2 className="text-2xl font-black uppercase mb-8">
            What You Will Get
          </h2>

          <div className="grid md:grid-cols-2 gap-5">

            {[
              'Live Project Experience',
              'Industry Workflow Exposure',
              'Team Collaboration',
              'Mentorship',
              'Certificate on Completion',
              'Work Experience Certificate after 6 Months'
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)]"
              >
                <CheckCircle2 size={18} className="text-primary-500 mt-1" />
                <span>{item}</span>
              </div>
            ))}

          </div>

        </div>

      </div>
    </div>
  );
}