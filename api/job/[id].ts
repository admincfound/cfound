import { db } from "../../firebase-admin";

export default async function handler(req, res) {
  const { id } = req.query;

  const doc = await db.collection("careers").doc(id).get();

  if (!doc.exists) {
    return res.status(404).send("Not found");
  }

  const job = doc.data();

  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.datePosted,
    validThrough: job.validThrough,
    employmentType: job.employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      sameAs: "https://www.cfound.in",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city,
        addressRegion: job.state,
        addressCountry: "IN",
      },
    },
  };

  res.setHeader("Content-Type", "text/html");

  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>${job.title}</title>

<script type="application/ld+json">
${JSON.stringify(schema)}
</script>

<meta name="description" content="${job.title}">
</head>

<body>

<script>
window.location.href =
"/careers/${job.slug}-${id}";
</script>

</body>
</html>
`);
}