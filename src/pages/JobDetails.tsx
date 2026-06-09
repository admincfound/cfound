import { Helmet } from 'react-helmet-async';

export default function JobDetails() {
  const job = {
    id: 'test123',
    title: 'Marketing Manager',
    description:
      'Marketing Manager position for testing Google Job Posting detection.',
    companyName: 'C Found',
    city: 'Nagercoil',
    state: 'Tamil Nadu',
    country: 'India',
    jobType: 'full-time',
    mode: 'Onsite',
    minAmount: 25000,
    maxAmount: 40000,
    deadline: '2026-12-31'
  };

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
              title: job.title,
              description: job.description,
              datePosted: '2026-06-09',
              validThrough: '2026-12-31T23:59:59+05:30',
              employmentType: 'FULL_TIME',
              hiringOrganization: {
                '@type': 'Organization',
                name: 'C Found',
                sameAs: 'https://www.cfound.in'
              },
              jobLocation: {
                '@type': 'Place',
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: 'Nagercoil',
                  addressRegion: 'Tamil Nadu',
                  addressCountry: 'India'
                }
              },
              baseSalary: {
                '@type': 'MonetaryAmount',
                currency: 'INR',
                value: {
                  '@type': 'QuantitativeValue',
                  minValue: 25000,
                  maxValue: 40000,
                  unitText: 'MONTH'
                }
              }
            })
          }}
        />
      </Helmet>

      <div className="max-w-5xl mx-auto py-20 px-6">
        <h1 className="text-5xl font-bold mb-4">
          Marketing Manager
        </h1>

        <p className="mb-6">
          C Found • Nagercoil, Tamil Nadu, India
        </p>

        <p className="mb-6">
          Salary: ₹25,000 - ₹40,000 per month
        </p>

        <h2 className="text-2xl font-bold mb-2">
          Job Description
        </h2>

        <p>
          Marketing Manager position for testing Google Job Posting detection.
        </p>
      </div>
    </>
  );
}