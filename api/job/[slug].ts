import { adminDb } from "../../src/lib/firebase-admin";

export default async function handler(req, res) {
  try {
    const slug = req.query.slug;

    const id = slug.split("-").pop();

    const doc = await adminDb
      .collection("careers")
      .doc(id)
      .get();

    if (!doc.exists) {
      return res.status(404).send("Job not found");
    }

    const job = doc.data();

    const schema = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: job.title,
      description: job.description,
      datePosted: job.createdAt?.toDate
        ? job.createdAt.toDate().toISOString()
        : new Date().toISOString(),
      employmentType: "FULL_TIME",
      hiringOrganization: {
        "@type": "Organization",
        name: job.companyName,
        sameAs: "https://www.cfound.in"
      }
    };

    res.setHeader("Content-Type", "text/html");

    return res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
<title>${job.title} | C Found</title>
<meta name="description" content="${job.title}">
<script type="application/ld+json">
${JSON.stringify(schema)}
</script>
</head>
<body>
<h1>${job.title}</h1>
<p>${job.companyName}</p>
<div>${job.description}</div>
</body>
</html>
`);
  } catch (err) {
    return res.status(500).send(String(err));
  }
}