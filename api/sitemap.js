import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
        credential: admin.credential.cert({
      projectId: process.env.project_id,
      clientEmail: process.env.client_email,
      privateKey: process.env.private_key?.replace(/\\n/g, "\n"),
    }),
  });
}


const db = admin.firestore();
db.settings({
  databaseId: "ai-studio-24810410-2d44-4bca-af7d-11572783e2b5",
});

export default async function handler(req, res) {
  try {
    const baseUrl = "https://www.cfound.in";

    const careersSnapshot = await db.collection("careers").limit(1).get();

    return res.status(200).json({
      careersCount: careersSnapshot.size,
    });

    let urls = [];

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
        </url>
      `);
    });

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
        </url>
      `);
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls.join("")}
      </urlset>`;

    res.setHeader("Content-Type", "application/xml");
    return res.status(200).send(sitemap);
  } catch (error) {
    console.error(error);
    return res.status(500).send(error.message);
  }
}