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
import { MapPin, MapPin, Users, Eye, Clock, CheckCircle2, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProfileCompletion } from '../lib/profileUtils';
import { useAuth } from '../context/AuthContext';

export default function InternshipDetails() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const { slug } = useParams();

  const id = slug?.replace(/^.*-/, '');
  const [internship, setInternship] = useState<any>(null);
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
      if (!internship?.id) return;

      const viewerId = user
        ? `user_${user.uid}`
        : `guest_${getGuestId()}`;

      const viewRef = doc(
        db,
        'internshipViews',
        `${internship.id}_${viewerId}`
      );

      const existing = await getDoc(viewRef);

      if (existing.exists()) return;

      await setDoc(viewRef, {
        internshipId: internship.id,
        viewerId,
        viewedAt: serverTimestamp()
      });

      await updateDoc(
        doc(db, 'opportunities', internship.id),
        {
          views: increment(1)
        }
      );

      setInternship((prev: any) => ({
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

  useEffect(() => {
    if (internship?.id) {
      trackView();
    }
  }, [internship, user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const checkApplied = async () => {
      if (!user || !internship?.id) return;

      const q = query(
        collection(db, 'internshipApplications'),
        where('userId', '==', user.uid),
        where('targetId', '==', internship.id)
      );

      const snap = await getDocs(q);

      setAlreadyApplied(!snap.empty);
    };

    checkApplied();
  }, [user, internship]);

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

      await addDoc(collection(db, 'internshipApplications'), {
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
        type: 'internship',
        targetId: internship.id,
        targetTitle: internship.title,
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

  if (!internship) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

return (
  <>
    <Helmet>
      <title>{internship.title} | CFound</title>

      <meta
        name="description"
        content={
          internship.description?.slice(0, 160) ||
          'Explore internship opportunities at CFound'
        }
      />
    </Helmet>

    <div className="pt-28 md:pt-32 pb-24 px-4 md:px-6 min-h-screen bg-[var(--bg-main)]">

      <div className="max-w-7xl mx-auto">

        <div className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] border border-[var(--border-main)] bg-[var(--bg-card)] p-6 md:p-10 lg:p-14 mb-8">

          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />

          <div className="relative z-10">

            <div className="flex flex-wrap gap-3 mb-6">

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

            <h1 className="text-4xl md:text-6xl xl:text-7xl font-black uppercase italic leading-none mb-6">
              {internship.title}
            </h1>

            <div className="flex flex-wrap gap-5 text-sm text-[var(--text-muted)] mb-8">

              <div className="flex items-center gap-2">
                <MapPin size={16} />
                {internship.location}
              </div>

              <div className="flex items-center gap-2">
                <Users size={16} />
                {internship.applications || 0} Candidates
              </div>

              <div className="flex items-center gap-2">
                <Eye size={16} />
                {internship.views || 0} Views
              </div>

            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-end">

              <div>

                <div className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-2">
                  Internship Type
                </div>

                <div className="text-3xl md:text-5xl font-black text-primary-600">

                  {
                    internship.internshipType === 'paid'
                      ? `₹${internship.stipend || internship.amount}/month`
                      : internship.internshipType === 'training'
                        ? `Training Fee ₹${internship.trainingFee}`
                        : 'Career Development Program'
                  }

                </div>

              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">

                <Link
                  to="/internship"
                  className="h-12 px-6 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-main)] flex items-center justify-center text-[10px] font-black uppercase tracking-widest"
                >
                  Back
                </Link>

                <button
                  onClick={handleShare}
                  className="h-12 px-6 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-main)] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <Share2 size={14} />
                  Share
                </button>

                {!user ? (
                  <Link
                    to="/login"
                    className="h-12 px-8 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-[10px] font-black uppercase tracking-widest"
                  >
                    Login To Apply
                  </Link>
                ) : alreadyApplied ? (
                  <button
                    disabled
                    className="h-12 px-8 rounded-2xl bg-green-600 text-white text-[10px] font-black uppercase tracking-widest"
                  >
                    Applied
                  </button>
                ) : !completion.isComplete ? (
                  <Link
                    to="/profile"
                    className="h-12 px-8 rounded-2xl bg-yellow-500 text-black flex items-center justify-center text-[10px] font-black uppercase tracking-widest"
                  >
                    Complete Profile
                  </Link>
                ) : (
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="h-12 px-8 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest"
                  >
                    {applying ? 'Applying...' : 'Apply Now'}
                  </button>
                )}

              </div>

            </div>

          </div>

        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-8">

            <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] p-6 md:p-8">

              <h2 className="text-2xl font-black mb-5">
                About Internship
              </h2>

              <p className="whitespace-pre-wrap leading-relaxed text-[var(--text-muted)]">
                {internship.description}
              </p>

            </div>

            {internship.skills?.length > 0 && (

              <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] p-6 md:p-8">

                <h2 className="text-2xl font-black mb-5">
                  Skills Required
                </h2>

                <div className="flex flex-wrap gap-3">

                  {internship.skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-4 py-2 rounded-xl bg-primary-600/10 text-primary-600 text-xs font-bold"
                    >
                      {skill}
                    </span>
                  ))}

                </div>

              </div>

            )}

          </div>

          <div className="space-y-8">

            <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] p-6">

              <h2 className="text-xl font-black mb-6">
                Internship Details
              </h2>

              <div className="space-y-5">

                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Type</p>
                  <p className="font-semibold">
                    {internship.internshipType === 'paid'
                      ? 'Paid Internship'
                      : internship.internshipType === 'training'
                      ? 'Training Program'
                      : 'Career Development Program'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Duration</p>
                  <p className="font-semibold">{internship.duration}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Mode</p>
                  <p className="font-semibold">{internship.mode}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Location</p>
                  <p className="font-semibold">{internship.location}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Applications</p>
                  <p className="font-semibold">{internship.applications || 0}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Views</p>
                  <p className="font-semibold">{internship.views || 0}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-2">
                    Status
                  </p>

                  <span
                    className="
                      inline-flex
                      items-center
                      px-3
                      py-1.5
                      rounded-full
                      bg-green-100
                      text-green-700
                      text-sm
                      font-semibold
                    "
                  >
                    Open for Applications
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  </>
);
}