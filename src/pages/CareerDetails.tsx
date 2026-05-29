import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { Helmet } from 'react-helmet-async';
import {
  doc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { MapPin, Clock, CheckCircle2, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProfileCompletion } from '../lib/profileUtils';
import { useAuth } from '../context/AuthContext';

export default function CareerDetails() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const { slug } = useParams();

  const id = slug?.split('-').slice(-1)[0];
  console.log("Slug:", slug);
  console.log("Extracted ID:", id);
  const [job, setJob] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [applying, setApplying] = useState(false);
  const getGuestId = () => {
    let guestId = localStorage.getItem('guest_id');

    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem('guest_id', guestId);
    }

    return guestId;
  };

  const trackView = async () => {
    try {
      if (!job?.id) return;

      const viewerId = user
        ? `user_${user.uid}`
        : `guest_${getGuestId()}`;

      const viewRef = doc(
        db,
        'jobViews',
        `${job.id}_${viewerId}`
      );

      const existing = await getDoc(viewRef);

      if (existing.exists()) return;

      await setDoc(viewRef, {
        jobId: job.id,
        viewerId,
        viewedAt: serverTimestamp()
      });

      await updateDoc(
        doc(db, 'opportunities', job.id),
        {
          views: increment(1)
        }
      );

      setJob((prev: any) => ({
        ...prev,
        views: (prev?.views || 0) + 1
      }));

    } catch (err) {
      console.error('View tracking failed:', err);
    }
  };
  const [alreadyApplied, setAlreadyApplied] = useState(false);  
  const completion = getProfileCompletion(profile);
  const handleShare = async () => {
    const shareData = {
      title: job.title,
      text: `Check out this career opportunity at C FOUND`,
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
    const fetchJob = async () => {
      if (!id) return;

      const snap = await getDoc(doc(db, 'opportunities', id));
      console.log('Job ID:', id);
      console.log('Document exists:', snap.exists());
      console.log('Data:', snap.data());

      if (snap.exists()) {
        setJob({
          id: snap.id,
          ...snap.data()
        });
      }
    };

    fetchJob();
  }, [id]);

  useEffect(() => {
    if (job?.id) {
      trackView();
    }
  }, [job, user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const checkApplied = async () => {
      if (!user || !job?.id) return;

      const q = query(
        collection(db, 'jobApplications'),
        where('userId', '==', user.uid),
        where('targetId', '==', job.id)
      );

      const snap = await getDocs(q);

      setAlreadyApplied(!snap.empty);
    };

    checkApplied();
  }, [user, job]);

  const handleApply = async () => {
    if (!user) {
      navigate('/login', {
        state: { from: { pathname: window.location.pathname } }
      });

      return;
    }

    if (!completion.isComplete) {
      toast.error('Complete your profile before applying.');
      navigate('/profile');
      return;
    }

    if (alreadyApplied) {
      toast.error('You already applied.');
      return;
    }

    setApplying(true);

    try {
      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);

      const profile = profileSnap.data();

      await addDoc(collection(db, 'jobApplications'), {
        userId: user.uid,
        userEmail: user.email,
        phone: profile?.phone || '',
        userName: profile?.displayName || '',
        skills: profile?.skills || [],
        resumeUrl: profile?.resumeUrl || '',
        portfolioUrl:
          profile?.portfolioUrl ||
          profile?.githubUrl ||
          profile?.linkedinUrl ||
          '',
        type: 'job',
        targetId: job.id,
        targetTitle: job.title,
        status: 'pending',
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      setAlreadyApplied(true);

      toast.success('Application submitted successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Error submitting application.');
    } finally {
      setApplying(false);
    }
  };

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
  <>
    <Helmet>
      <title>
        {job.title} | CFound
      </title>

      <meta
        name="description"
        content={
          job.description?.slice(0, 160) ||
          'Explore internship opportunities at CFound'
        }
      />

      <meta
        property="og:title"
        content={`${job.title} | CFound`}
      />

      <meta
        property="og:description"
        content={
          job.description?.slice(0, 200) ||
          'Explore internship opportunities at CFound'
        }
      />

      <meta
        property="og:type"
        content="website"
      />

      <meta
        property="og:url"
        content={`https://www.cfound.in/careers/${slug}`}
      />

      <meta
        property="og:image"
        content="https://www.cfound.in/og-image.png"
      />

      <meta
        property="og:site_name"
        content="CFound"
      />

      <meta
        name="twitter:card"
        content="summary_large_image"
      />

      <meta
        name="twitter:title"
        content={`${job.title} | CFound`}
      />

      <meta
        name="twitter:description"
        content={
          job.description?.slice(0, 200) ||
          'Explore internship opportunities at CFound'
        }
      />

      <meta
        name="twitter:image"
        content="https://www.cfound.in/og-image.png"
      />
    </Helmet>

    <div className="pt-32 pb-32 px-6 min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-5xl mx-auto">

        <div className="mb-10">

          <div className="flex items-center gap-4 flex-wrap mb-6">

            <span className="px-4 py-2 rounded-xl bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-widest">
              {job.type}
            </span>

            <span className="px-4 py-2 rounded-xl border border-[var(--border-main)] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <MapPin size={14} />

              {job.location || 'Remote'}
            </span>

            <span className="px-4 py-2 rounded-xl border border-[var(--border-main)] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} />
              {job.timing}
            </span>

          </div>

          <h1 className="text-5xl font-black uppercase italic mb-6">
            {job.title}
          </h1>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">

            <div className="text-2xl font-black text-primary-500">
                {job.salary}
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
                to="/careers"
                className="px-5 py-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] text-[10px] font-black uppercase tracking-widest"
              >
                Back
              </Link>

              {!user ? (
                <Link
                  to="/login"
                  className="px-6 py-3 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest"
                >
                  Login to Apply
                </Link>
              ) : alreadyApplied ? (
                <button
                  disabled
                  className="px-6 py-3 rounded-2xl bg-green-600 text-white text-[10px] font-black uppercase tracking-widest opacity-80 cursor-not-allowed"
                >
                  Applied
                </button>
              ) : !completion.isComplete ? (
                <Link
                  to="/profile"
                  className="btn-primary flex items-center justify-center gap-2 px-6 py-3"
                >
                  Complete Profile
                </Link>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="px-6 py-3 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {applying ? 'Applying...' : 'Apply Now'}
                </button>
              )}

            </div>

          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-16">

            <div className="md:col-span-2 space-y-8">

              <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl p-8">
                <h2 className="text-2xl font-black mb-4">
                  Job Description
                </h2>

                <p className="text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                  {job.description || 'No description available.'}
                </p>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl p-8">
                <h2 className="text-2xl font-black mb-6">
                  Requirements
                </h2>

                <div className="space-y-4">
                  {(job.requirements || []).map((req: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle2
                        size={18}
                        className="text-primary-500 mt-1"
                      />

                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="space-y-6">

              <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl p-6">
                <h3 className="font-black mb-4">
                  Details
                </h3>

                <div className="space-y-3 text-sm">

                  <div>
                    <strong>Experience:</strong>{' '}
                    {job.experience || 'Fresher'}
                  </div>

                  <div>
                    <strong>Openings:</strong>{' '}
                    {job.openings || 1}
                  </div>

                  <div>
                    <strong>Views:</strong>{' '}
                    {job.views || 0}
                  </div>

                  <div>
                    <strong>Applicants:</strong>{' '}
                    {job.applications || 0}
                  </div>

                </div>
              </div>

              {(job.skills?.length ?? 0) > 0 && (
                <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl p-6">
                  <h3 className="font-black mb-4">
                    Skills
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-2 rounded-xl bg-primary-600/10 text-primary-600 text-xs font-bold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  </>
);
}