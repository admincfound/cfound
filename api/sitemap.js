import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.project_id,
      clientEmail: process.env.client_email,
      privateKey: process.env.private_key?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  try {
    const baseUrl = "https://www.cfound.in";

    const careersSnap = await db.collection("careers").get();

    let urls = [
      "/",
      "/about",
      "/services",
      "/projects",
      "/internship",
      "/careers",
      "/courses",
      "/contact",
    ];

    careersSnap.forEach((doc) => {
      const job = doc.data();

      const slug =
        job.slug ||
        job.title
          ?.toLowerCase()
          .replace(/[^a-z0-9\\s-]/g, "")
          .replace(/\\s+/g, "-");

      urls.push(`/careers/${slug}-${doc.id}`);
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${baseUrl}${u}</loc></url>`).join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).send(String(err));
  }
}