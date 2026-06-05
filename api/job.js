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
      description: job.description || "",
      datePosted: job.createdAt?.toDate?.()?.toISOString?.(),
      validThrough: job.deadline || undefined,
      employmentType: job.jobType || "FULL_TIME",
      hiringOrganization: {
        "@type": "Organization",
        name: job.companyName || "C Found Technologies"
      },
      jobLocationType:
        job.mode === "Remote"
          ? "TELECOMMUTE"
          : undefined,
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "INR",
        value: {
          "@type": "QuantitativeValue",
          minValue: Number(job.minAmount || 0),
          maxValue: Number(job.maxAmount || 0),
          unitText: "MONTH"
        }
      }
    };

    return res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${job.title}</title>

<script type="application/ld+json">
${JSON.stringify(schema)}
</script>

<meta name="robots" content="index,follow">

<meta
  name="description"
  content="${(job.description || "")
    .replace(/"/g, "&quot;")
    .slice(0, 160)}"
/>

<link
  rel="canonical"
  href="https://www.cfound.in/careers/${slug}"
/>
</head>

<body>

<h1>${job.title}</h1>

<p>${job.description || ""}</p>

<script>
window.location.replace(
  "/careers/${slug}"
);
</script>

</body>
</html>
`);
  } catch (err) {
    return res.status(500).send(err.message);
  }
}