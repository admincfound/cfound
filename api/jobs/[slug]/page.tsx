import { adminDb } from '../../../lib/firebase-admin';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic'; // SSR

export default async function CareerDetail({ params }: { params: { slug: string } }) {
  const slugParam = params.slug; // marketing-manager-qkiUlT7r5XaqcUQgc7Bd
  const id = slugParam.split('-').slice(-1)[0];

  const docRef = adminDb.collection('careers').doc(id);
  const docSnap = await docRef.get();

  if (!docSnap.exists) return notFound();

  const job = docSnap.data();

  return (
    <html>
      <head>
        <title>{job.title} | C Found Careers</title>
        <meta name="description" content={job.description?.slice(0, 160)} />
        <meta property="og:title" content={`${job.title} | C Found`} />
        <meta property="og:description" content={job.description?.slice(0, 200)} />
        <link rel="canonical" href={`https://www.cfound.in/careers/${slugParam}`} />
      </head>
      <body>
        <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
          <h1>{job.title}</h1>
          <p><strong>Company:</strong> {job.companyName}</p>
          <p><strong>Location:</strong> {job.city}, {job.state}, {job.country}</p>
          <p><strong>Type:</strong> {job.jobType}</p>
          <p>{job.description}</p>
        </main>
      </body>
    </html>
  );
}
