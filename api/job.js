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

export default async function handler(req, res) {
  try {
    const slug = req.url.split("/").pop();
    const id = slug.split("-").pop();

    const snap = await db.collection("careers").doc(id).get();

    if (!snap.exists) {
      return res.status(404).send("Job not found");
    }

    const job = snap.data();

    const schema = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: job.title,
      description: job.description,
      datePosted: job.createdAt?.toDate?.()?.toISOString(),
      validThrough: job.deadline,
      employmentType: "FULL_TIME",
      hiringOrganization: {
        "@type": "Organization",
        name: job.companyName,
      },
      jobLocationType: "TELECOMMUTE",
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "INR",
        value: {
          "@type": "QuantitativeValue",
          minValue: Number(job.minAmount),
          maxValue: Number(job.maxAmount),
          unitText: "MONTH"
        }
      }
    };

    res.setHeader("Content-Type", "text/html");

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${job.title}</title>
        <script type="application/ld+json">
        ${JSON.stringify(schema)}
        </script>
      </head>
      <body>
        <script>
          window.location.href="/careers/${slug}";
        </script>
      </body>
      </html>
    `);

  } catch (err) {
    res.status(500).send(err.message);
  }
}