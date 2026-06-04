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
  try {
    const baseUrl = "https://cfound.in";

    const careersSnapshot = await db.collection("careers").get();
    const internshipsSnapshot = await db.collection("opportunities").get();

    const staticPages = [
      "",
      "/about",
      "/careers",
      "/internship",
      "/contact",
      "/privacy-policy",
      "/terms-and-conditions",
    ];

    let urls = [];

    // Static Pages
    staticPages.forEach((page) => {
      urls.push(`
        <url>
          <loc>${baseUrl}${page}</loc>
          <changefreq>daily</changefreq>
          <priority>${page === "" ? "1.0" : "0.8"}</priority>
        </url>
      `);
    });

    // Career Jobs
    careersSnapshot.forEach((doc) => {
      const data = doc.data();

      const slug =
        data.slug ||
        data.title
          ?.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");

      urls.push(`
        <url>
          <loc>${baseUrl}/careers/${slug}-${doc.id}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.9</priority>
        </url>
      `);
    });

    // Internship Jobs
    internshipsSnapshot.forEach((doc) => {
      const data = doc.data();

      const slug =
        data.slug ||
        data.title
          ?.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");

      urls.push(`
        <url>
          <loc>${baseUrl}/internship/${slug}-${doc.id}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.9</priority>
        </url>
      `);
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset
        xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls.join("")}
      </urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

    return res.status(200).send(sitemap);
  } catch (error) {
    console.error("Sitemap generation error:", error);

    return res.status(500).send("Error generating sitemap");
  }
};