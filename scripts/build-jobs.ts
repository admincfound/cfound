import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// 🔹 Load Firebase client config from JSON
const firebaseConfig = JSON.parse(
  fs.readFileSync(
    path.resolve('firebase-applet-config.json'),
    'utf8'
  )
);

// 🔹 Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function buildJobPages() {
  const jobsDir = path.resolve('dist/jobs');

  // Remove old job pages
  if (fs.existsSync(jobsDir)) {
    fs.rmSync(jobsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(jobsDir, { recursive: true });

  try {
    // Fetch all jobs from Firestore
    const jobsSnapshot = await getDocs(collection(db, 'careers'));
    const jobs = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Generate HTML pages
    for (const job of jobs) {
      const slug = job.slug || job.id;
      const jobFolder = path.join(jobsDir, slug);
      fs.mkdirSync(jobFolder, { recursive: true });

      const content = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${job.title || 'Job'} | C Found Careers</title>
<meta name="description" content="${(job.description || '').slice(0, 160)}" />
<link rel="canonical" href="https://www.cfound.in/jobs/${slug}" />
<meta name="robots" content="index,follow" />
</head>
<body>
  <h1>${job.title || 'Job'}</h1>
  <p>${job.description || 'No description available'}</p>
  <ul>
    <li>Location: ${job.city || 'N/A'}, ${job.state || 'N/A'}</li>
    <li>Employment Type: ${job.jobType || 'N/A'}</li>
    <li>Experience: ${job.experience || 'Fresher'}</li>
  </ul>
</body>
</html>
`;

      fs.writeFileSync(path.join(jobFolder, 'index.html'), content);
    }

    console.log(`✅ Generated ${jobsSnapshot.size} job pages in dist/jobs/`);
  } catch (err) {
    console.error('❌ Error fetching jobs:', err);
  }
}

// 🔹 Run the build
buildJobPages();