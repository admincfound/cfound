import CareerClient from './CareerClient';

import { getCareer } from '../../lib/careers';

import Script from 'next/script';

export async function generateMetadata({
 params
}:{
 params:Promise<{id:string}>
}){

 const { id } = await params;

  const docId =
    id.split('-').pop() || id;

  const job =
    await getCareer(docId);

 if(!job){

  return {
   title:'Career Not Found'
  };
 }

 return {
  title: `${job.title} | C Found Careers`,

    description:
      job.description?.slice(0, 160) ||
      `Apply for ${job.title} at ${job.companyName || 'C Found'}.`,

    keywords: [
      job.title,
      job.companyName || 'C Found',
      'Jobs',
      'Careers',
      'Hiring',
      job.city || '',
      job.state || '',
    ],

    alternates: {
      canonical: `https://www.cfound.in/careers/${id}`,
    },

    openGraph: {
      title: `${job.title} | C Found Careers`,

      description:
        job.description?.slice(0, 160),

      url: `https://www.cfound.in/careers/${id}`,

      siteName: 'C Found',

      images: [
        {
          url: 'https://www.cfound.in/og-image.png',
          width: 1200,
          height: 630,
          alt: 'C Found',
        },
      ],

      type: 'website',
    },

    twitter: {
      card: 'summary_large_image',

      title: `${job.title} | C Found Careers`,

      description:
        job.description?.slice(0, 160),

      images: ['https://www.cfound.in/og-image.png'],
    },
  };
}

export default async function Page({
 params
}:{
 params:Promise<{id:string}>
}){

 const { id } =
 await params;

 const docId =
  id.split('-').pop() || id;

 const job =
  await getCareer(docId);

 if (!job) {

  return (
   <div className="py-24 text-center">
    Career not found
    <br />
    <code>{docId}</code>
   </div>
  );

 }

 return (
  <>
    <Script
  id="job-posting-schema"
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",

      "@type": "JobPosting",

      title: job.title || "",

      description: `
        ${job.description || ''}

        Responsibilities:
        ${job.responsibilities || ''}

        Requirements:
        ${Array.isArray(job.requirements)
         ? job.requirements.join('\n')
         : ''}
        `,

      datePosted:
       job.createdAt?.toDate
        ? job.createdAt
            .toDate()
            .toISOString()

        : undefined,

      dateModified:
       job.updatedAt?.toDate
        ? job.updatedAt
            .toDate()
            .toISOString()

        : undefined,

      url:
       `https://www.cfound.in/careers/${id}`,

      directApply: true,

      identifier:{
       "@type":"PropertyValue",

       name:"C Found",

       value:job.id || docId
      },

      validThrough: job.deadline
        ? `${job.deadline}T23:59:59+05:30`
        : undefined,

      employmentType:
        job.jobType === "full-time"
          ? "FULL_TIME"
          : job.jobType === "part-time"
          ? "PART_TIME"
          : job.jobType === "contract"
          ? "CONTRACTOR"
          : job.jobType === "internship"
          ? "INTERN"
          : "FULL_TIME",
      industry:
        job.industry || undefined,

      baseSalary: job.minAmount
       ? {
           "@type":"MonetaryAmount",

           currency:"INR",

           value:{
             "@type":"QuantitativeValue",

             minValue:Number(job.minAmount),

             maxValue:Number(
              job.maxAmount ||
              job.minAmount
             ),

             unitText:"MONTH"
           }
         }
       : undefined,

      hiringOrganization:{

       "@type":"Organization",

       name:
        job.companyName ||
        "C Found"

      },

      jobLocation: {
        "@type": "Place",

        address: {
          "@type": "PostalAddress",

          addressLocality:
            job.city || "",

          addressRegion:
            job.state || "",

          addressCountry:"IN"
        }
      },
      applicantLocationRequirements:{
       "@type":"Country",

       name:"India",

       sameAs:"https://www.wikidata.org/wiki/Q668"
      }
    })
  }}
/>

    <CareerClient
      initialJob={job}
      slug={id}
    />
  </>
);
}