import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function JobDetails() {
  const { slug } = useParams();

  const id = slug?.split('-').slice(-1)[0];

  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    const loadJob = async () => {
      if (!id) return;

      try {
        const snap = await getDoc(
          doc(db, 'careers', id)
        );

        if (snap.exists()) {
          setJob({
            id: snap.id,
            ...snap.data()
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadJob();
  }, [id]);

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{job.title} | C Found Careers</title>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'JobPosting',

              url: `https://www.cfound.in/careers/${slug}`,

              title: job.title,

              description:
                job.description || '',

              datePosted: new Date(
                job.createdAt?.seconds
                  ? job.createdAt.seconds * 1000
                  : Date.now()
              ).toISOString(),

              validThrough: job.deadline
                ? `${job.deadline}T23:59:59+05:30`
                : undefined,

              employmentType: 'FULL_TIME',

              hiringOrganization: {
                '@type': 'Organization',
                name:
                  job.companyName ||
                  'C Found',
                sameAs:
                  'https://www.cfound.in'
              },

              jobLocation: {
                '@type': 'Place',
                address: {
                  '@type':
                    'PostalAddress',
                  addressLocality:
                    job.city || '',
                  addressRegion:
                    job.state || '',
                  addressCountry:
                    job.country ||
                    'India'
                }
              },

              ...(job.minAmount
                ? {
                    baseSalary: {
                      '@type':
                        'MonetaryAmount',
                      currency: 'INR',
                      value: {
                        '@type':
                          'QuantitativeValue',
                        minValue: Number(
                          job.minAmount
                        ),
                        maxValue: Number(
                          job.maxAmount ||
                            job.minAmount
                        ),
                        unitText:
                          'MONTH'
                      }
                    }
                  }
                : {})
            })
          }}
        />
      </Helmet>

      <div className="max-w-5xl mx-auto py-20 px-6">
        <h1 className="text-5xl font-bold mb-4">
          {job.title}
        </h1>

        <p className="mb-4">
          {job.companyName}
        </p>

        <p className="mb-4">
          {job.city}, {job.state},{' '}
          {job.country}
        </p>

        <p className="mb-6">
          ₹{job.minAmount} - ₹
          {job.maxAmount}
        </p>

        <div>
          {job.description}
        </div>
      </div>
    </>
  );
}