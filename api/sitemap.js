const admin = require("firebase-admin");

const serviceAccount = require("../serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

db.settings({
  databaseId: "ai-studio-24810410-2d44-4bca-af7d-11572783e2b5",
});

module.exports = async (req, res) => {
  const jobs = await db.collection("opportunities").get();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  jobs.forEach((doc) => {
    const job = doc.data();

    if (job.slug) {
      xml += `
  <url>
    <loc>https://www.cfound.in/careers/${job.slug}</loc>
  </url>`;
    }
  });

  xml += `
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.status(200).send(xml);
};