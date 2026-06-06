import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { Helmet } from 'react-helmet-async';
import { sendApplicationEmail } from '../services/emailService';

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

import { db, auth } from '../lib/firebase';

import {
  MapPin,
  Clock,
  CheckCircle2,
  Share2,
  Building2,
  Users,
  Eye,
  Briefcase,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  Layers,
  Zap
} from 'lucide-react';

import toast from 'react-hot-toast';

import { getProfileCompletion } from '../lib/profileUtils';
import { useAuth } from '../context/AuthContext';

export default function CareerDetails() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { profile } = useAuth();

  const id = slug?.split('-').slice(-1)[0];

  const [job, setJob] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const completion = getProfileCompletion(profile);

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
        doc(db, 'careers', job.id),
        {
          views: increment(1)
        }
      );

      setJob((prev: any) => ({
        ...prev,
        views: (prev?.views || 0) + 1
      }));

    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: job?.title,
      text: 'Check out this opportunity',
      url: window.location.href
    };

    try {
      await navigator.share(shareData);
    } catch {
      await navigator.clipboard.writeText(
        window.location.href
      );

      toast.success('Link copied');
    }
  };

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) {
        return;
      }

      try {
        const snap = await getDoc(
          doc(db, 'careers', id)
        );

        if (snap.exists()) {
          console.log("JOB FOUND", snap.id);
          setJob({
            id: snap.id,
            ...snap.data()
          });
        }
      } catch (error) {
        console.error(error);
      } 
    };

    fetchJob();
  }, [id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (job?.id) {
      trackView();
    }
  }, [job, user]);

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
        state: {
          from: {
            pathname: window.location.pathname
          }
        }
      });

      return;
    }

    if (!completion.isComplete) {
      toast.error(
        'Complete your profile before applying.'
      );

      navigate('/profile');

      return;
    }

    if (alreadyApplied) {
      toast.error('Already applied.');
      return;
    }

    setApplying(true);

    try {
      const profileRef = doc(
        db,
        'profiles',
        user.uid
      );

      const profileSnap =
        await getDoc(profileRef);

      const profileData =
        profileSnap.data();

      await addDoc(
        collection(db, 'jobApplications'),
        {
          userId: user.uid,
          userEmail: user.email,
          userName:
            profileData?.displayName || '',
          phone:
            profileData?.phone || '',
          skills:
            profileData?.skills || [],
          resumeUrl:
            profileData?.resumeUrl || '',
          portfolioUrl:
            profileData?.portfolioUrl ||
            profileData?.githubUrl ||
            profileData?.linkedinUrl ||
            '',
          type: 'job',
          targetId: job.id,
          targetTitle: job.title,
          status: 'pending',
          appliedAt:
            new Date().toISOString(),
          createdAt:
            new Date().toISOString()
        }
      );

      await updateDoc(
        doc(db, 'careers', job.id),
        {
          applications: increment(1)
        }
      );

      await sendApplicationEmail({
        to_name:
          profileData?.displayName || '',

        to_email:
          user.email || '',

        role_title:
          job.title,

        application_type:
          'Job',

        company_email:
          job.companyEmail ||
          job.contactEmail ||
          '',

        user_name:
          profileData?.displayName || '',

        phone:
          profileData?.phone || 'N/A',

        skills:
          profileData?.skills?.join(', ') ||
          'N/A',

        user_id:
          user.uid,

        profile:
          profileData
      });

      setAlreadyApplied(true);

      toast.success(
        'Application submitted successfully.'
      );

    } catch (error) {
      console.error(error);

      toast.error(
        'Application failed.'
      );
    } finally {
      setApplying(false);
    }
  };

  const formatCompensation = () => {
    if (!job) return 'Negotiable';

    if (job.compType === 'revenue') {
      return job.compFormat === 'fixed'
        ? `${job.minAmount}%`
        : `${job.minAmount}% - ${job.maxAmount}%`;
    }

    if (job.compFormat === 'fixed') {
      return `₹${Number(
        job.minAmount || 0
      ).toLocaleString('en-IN')}`;
    }

    if (job.compFormat === 'range') {
      return `₹${Number(
        job.minAmount || 0
      ).toLocaleString('en-IN')} - ₹${Number(
        job.maxAmount || 0
      ).toLocaleString('en-IN')}`;
    }

    return 'Negotiable';
  };

if (!job) {
  return null;
}

return (
<>
  <Helmet>
    <title>
      {job?.title ? `${job.title} | C Found Careers` : 'Careers | C Found'}
    </title>

    <meta
      name="description"
      content={job.description?.slice(0, 160)}
      data-rh="true"
    />

    <meta
      property="og:title"
      content={`${job.title} | C Found`}
    />

    <meta
      property="og:description"
      content={
        job.description?.slice(0, 200) ||
        'Explore career opportunities at C Found Technologies'
      }
    />

    <meta
      property="og:image"
      content="https://www.cfound.in/og-image.png"
    />

    <link
      rel="canonical"
      href={`https://www.cfound.in/careers/${slug}`}
    />

  <meta
    name="robots"
    content="index,follow"
  />

  {job && (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: job.title,
          description: job.description || "",
          datePosted: new Date(
            job.createdAt?.seconds
              ? job.createdAt.seconds * 1000
              : job.createdAt || Date.now()
          ).toISOString(),
          validThrough: job.deadline
            ? new Date(job.deadline).toISOString()
            : undefined,
          employmentType: job.jobType || "FULL_TIME",
          hiringOrganization: {
            "@type": "Organization",
            name: job.companyName || "C Found"
          },
          jobLocationType: job.mode === "Remote" ? "TELECOMMUTE" : undefined,
          applicantLocationRequirements:
          job.mode === "Remote"
            ? {
                "@type": "Country",
                name: "India"
              }
            : undefined,

          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "INR",
            value: {
              "@type": "QuantitativeValue",
              minValue: Number(job.minAmount || 0),
              maxValue: Number(job.maxAmount || 0),
              unitText: "MONTH"
            }
          }
        })
      }}
    />
  )}

  </Helmet>

  <div className="pt-28 md:pt-32 pb-24 px-4 md:px-6 min-h-screen bg-[var(--bg-main)]">

    <div className="max-w-7xl mx-auto">

      <div className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] border border-[var(--border-main)] bg-[var(--bg-card)] p-6 md:p-10 lg:p-14 mb-8">

        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />

        <div className="relative z-10">

          <div className="flex flex-wrap gap-3 mb-6">

            <span className="px-4 py-2 rounded-xl bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-widest">
              {job.jobType || 'Position'}
            </span>

            {job.department && (
              <span className="px-4 py-2 rounded-xl border border-[var(--border-main)] text-[10px] font-black uppercase tracking-widest">
                {job.department}
              </span>
            )}

            {job.hiringUrgently && (
              <span className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Zap size={12} />
                Urgent Hiring
              </span>
            )}

          </div>

          <h1 className="text-4xl md:text-6xl xl:text-7xl font-black uppercase italic leading-none mb-6">
            {job.title}
          </h1>

          <div className="flex flex-wrap gap-5 text-sm text-[var(--text-muted)] mb-8">

            <div className="flex items-center gap-2">
              <Building2 size={16} />
              {job.companyName || 'C Found Technologies'}
            </div>

            <div className="flex items-center gap-2">
              <MapPin size={16} />
              {job.location || 'Remote'}
            </div>

            <div className="flex items-center gap-2">
              <Users size={16} />
              {job.applications || 0} Applicants
            </div>

            <div className="flex items-center gap-2">
              <Eye size={16} />
              {job.views || 0} Views
            </div>

          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-end">

            <div>

              <div className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-2">
                Compensation
              </div>

              <div className="text-3xl md:text-5xl font-black text-primary-600">
                {formatCompensation()}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">

                <div className="px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-xs font-semibold flex items-center gap-2">
                  <Clock size={14} />
                  {job.timing || 'Flexible'}
                </div>

                <div className="px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-xs font-semibold flex items-center gap-2">
                  <Briefcase size={14} />
                  {job.experience || 'Fresher'}
                </div>

              </div>

            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">

              <Link
                to="/careers"
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
                  className="h-12 px-8 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {applying
                    ? 'Applying...'
                    : 'Apply Now'}
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
      About Role
    </h2>

    <p className="whitespace-pre-wrap leading-relaxed text-[var(--text-muted)]">
      {job.description || 'No description available.'}
    </p>

  </div>

  {job.skills?.length > 0 && (

    <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] p-6 md:p-8">

      <h2 className="text-2xl font-black mb-5">
        Skills Required
      </h2>

      <div className="flex flex-wrap gap-3">

        {job.skills.map(
          (
            skill: string,
            index: number
          ) => (
            <span
              key={index}
              className="px-4 py-2 rounded-xl bg-primary-600/10 text-primary-600 text-xs font-bold"
            >
              {skill}
            </span>
          )
        )}

      </div>

    </div>

  )}

  {job.jobBenefits?.length > 0 && (

    <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] p-6 md:p-8">

      <h2 className="text-2xl font-black mb-5">
        Benefits & Perks
      </h2>

      <div className="grid sm:grid-cols-2 gap-3">

        {job.jobBenefits.map(
          (
            benefit: string,
            index: number
          ) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)]"
            >
              <CheckCircle2
                size={18}
                className="text-green-500 shrink-0"
              />

              <span className="font-medium">
                {benefit}
              </span>
            </div>
          )
        )}

      </div>

    </div>

  )}

  {job.requirements?.length > 0 && (

    <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] p-6 md:p-8">

      <h2 className="text-2xl font-black mb-6">
        Requirements
      </h2>

      <div className="space-y-4">

        {job.requirements.map(
          (
            req: string,
            index: number
          ) => (
            <div
              key={index}
              className="flex items-start gap-3"
            >
              <CheckCircle2
                size={18}
                className="text-primary-500 mt-1 shrink-0"
              />

              <span>
                {req}
              </span>
            </div>
          )
        )}

      </div>

    </div>

  )}

  {job.responsibilities && (

    <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] p-6 md:p-8">

      <h2 className="text-2xl font-black mb-6">
        Responsibilities
      </h2>

      <div className="space-y-4">

        {job.responsibilities
          .split('\n')
          .filter(
            (
              item: string
            ) => item.trim()
          )
          .map(
            (
              item: string,
              index: number
            ) => (
              <div
                key={index}
                className="flex items-start gap-3"
              >
                <CheckCircle2
                  size={18}
                  className="text-primary-500 mt-1 shrink-0"
                />

                <span>
                  {item}
                </span>
              </div>
            )
          )}

      </div>

    </div>

  )}

</div>
<div className="space-y-8">

  <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] p-6">

    <h2 className="text-xl font-black mb-6">
      Job Details
    </h2>

    <div className="space-y-5 text-sm">

      <div className="flex items-start gap-3">
        <IndianRupee
          size={18}
          className="text-primary-500 mt-0.5"
        />
        <div>
          <p className="font-bold">
            Compensation
          </p>
          <p className="text-[var(--text-muted)]">
            {formatCompensation()}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Briefcase
          size={18}
          className="text-primary-500 mt-0.5"
        />
        <div>
          <p className="font-bold">
            Job Type
          </p>
          <p className="text-[var(--text-muted)]">
            {job.jobType || 'Not Specified'}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Clock
          size={18}
          className="text-primary-500 mt-0.5"
        />
        <div>
          <p className="font-bold">
            Shift
          </p>
          <p className="text-[var(--text-muted)]">
            {job.timing || 'Flexible'}
          </p>
        </div>
      </div>

      {job.workHours && (
        <div className="flex items-start gap-3">
          <Clock
            size={18}
            className="text-primary-500 mt-0.5"
          />
          <div>
            <p className="font-bold">
              Work Hours
            </p>
            <p className="text-[var(--text-muted)]">
              {job.workHours}
            </p>
          </div>
        </div>
      )}

      {job.workDays && (
        <div className="flex items-start gap-3">
          <Calendar
            size={18}
            className="text-primary-500 mt-0.5"
          />
          <div>
            <p className="font-bold">
              Work Days
            </p>
            <p className="text-[var(--text-muted)]">
              {job.workDays}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <Users
          size={18}
          className="text-primary-500 mt-0.5"
        />
        <div>
          <p className="font-bold">
            Experience
          </p>
          <p className="text-[var(--text-muted)]">
            {job.experience || 'Fresher'}
          </p>
        </div>
      </div>

      {job.educationRequirement && (
        <div className="flex items-start gap-3">
          <GraduationCap
            size={18}
            className="text-primary-500 mt-0.5"
          />
          <div>
            <p className="font-bold">
              Education
            </p>
            <p className="text-[var(--text-muted)]">
              {job.educationRequirement}
            </p>
          </div>
        </div>
      )}

      {job.industry && (
        <div className="flex items-start gap-3">
          <Layers
            size={18}
            className="text-primary-500 mt-0.5"
          />
          <div>
            <p className="font-bold">
              Industry
            </p>
            <p className="text-[var(--text-muted)]">
              {job.industry}
            </p>
          </div>
        </div>
      )}

      {job.contractDuration && (
        <div className="flex items-start gap-3">
          <Calendar
            size={18}
            className="text-primary-500 mt-0.5"
          />
          <div>
            <p className="font-bold">
              Contract Duration
            </p>
            <p className="text-[var(--text-muted)]">
              {job.contractDuration}
            </p>
          </div>
        </div>
      )}

      {job.joiningTime && (
        <div className="flex items-start gap-3">
          <Zap
            size={18}
            className="text-primary-500 mt-0.5"
          />
          <div>
            <p className="font-bold">
              Joining Time
            </p>
            <p className="text-[var(--text-muted)]">
              {job.joiningTime}
            </p>
          </div>
        </div>
      )}

      {job.deadline && (
        <div className="flex items-start gap-3">
          <Calendar
            size={18}
            className="text-primary-500 mt-0.5"
          />
          <div>
            <p className="font-bold">
              Application Deadline
            </p>
            <p className="text-[var(--text-muted)]">
              {new Date(
                job.deadline
              ).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
      )}

    </div>

  </div>

  <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] p-6">

    <h2 className="text-xl font-black mb-6">
      Company Information
    </h2>

    <div className="space-y-5">

      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
          Company
        </p>

        <p className="font-semibold">
          {job.companyName ||
            'C Found Technologies'}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
          Work Mode
        </p>

        <p className="font-semibold">
          {job.mode || 'Remote'}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
          Location
        </p>

        <p className="font-semibold">
          {job.location || 'Remote'}
        </p>
      </div>

      {job.openings && (
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
            Open Positions
          </p>

          <p className="font-semibold">
            {job.openings}
          </p>
        </div>
      )}

    </div>

  </div>

  {(job.contactEmail ||
    job.contactPhone) && (
    <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[2rem] p-6">

      <h2 className="text-xl font-black mb-6">
        Contact Information
      </h2>

      <div className="space-y-5">

        {job.contactEmail && (
          <div className="flex items-start gap-3">
            <Mail
              size={18}
              className="text-primary-500 mt-0.5"
            />

            <div>
              <p className="font-bold">
                Email
              </p>

              <p className="text-[var(--text-muted)] break-all">
                {job.contactEmail}
              </p>
            </div>
          </div>
        )}

        {job.contactPhone && (
          <div className="flex items-start gap-3">
            <Phone
              size={18}
              className="text-primary-500 mt-0.5"
            />

            <div>
              <p className="font-bold">
                Phone
              </p>

              <p className="text-[var(--text-muted)]">
                {job.contactPhone}
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  )}

</div>

</div>

</div>

</div>

</>
);
}