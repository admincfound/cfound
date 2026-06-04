const fs = require("fs");
const admin = require("firebase-admin");

const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

db.settings({
  databaseId: 'ai-studio-24810410-2d44-4bca-af7d-11572783e2b5'
});
async function generateSitemap() {
  const urls = [
    "https://www.cfound.in/",
    "https://www.cfound.in/about",
    "https://www.cfound.in/services",
    "https://www.cfound.in/projects",
    "https://www.cfound.in/internship",
    "https://www.cfound.in/careers",
    "https://www.cfound.in/courses",
    "https://www.cfound.in/contact",
  ];

  const jobs = await db.collection("opportunities").get();

  jobs.forEach((doc) => {
    const job = doc.data();

    if (job.slug) {
      urls.push(
        `https://www.cfound.in/careers/${job.slug}-${doc.id}`
      );
    }
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  urls.forEach((url) => {
    xml += `
  <url>
    <loc>${url}</loc>
  </url>`;
  });

  xml += `
</urlset>`;

  fs.writeFileSync("./public/sitemap.xml", xml);

  console.log("Sitemap generated");
}

generateSitemap();