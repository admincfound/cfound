import { adminDb } from "../../firebase-admin";

export default async function handler(req, res) {
  const slug = req.query.slug;
  const snapshot = await adminDb
    .collection("careers")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return res.status(404).send("Not Found");
  }

  const job = snapshot.docs[0].data();

  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.createdAt?.toDate
      ? job.createdAt.toDate().toISOString()
      : new Date().toISOString(),
    validThrough: `${job.deadline}T23:59:59+05:30`,
    employmentType:
      job.jobType === "full-time"
        ? "FULL_TIME"
        : job.jobType === "part-time"
        ? "PART_TIME"
        : "CONTRACTOR",
    hiringOrganization: {
      "@type": "Organization",
      name: job.companyName,
      sameAs: "https://cfound.in",
      url: "https://cfound.in",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city,
        addressRegion: job.state,
        addressCountry: job.country,
      },
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: {
        "@type": "QuantitativeValue",
        minValue: Number(job.minAmount),
        maxValue: Number(job.maxAmount),
        unitText: "MONTH",
      },
    },
  };

  res.setHeader("Content-Type", "text/html");
  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>${job.title} | ${job.companyName}</title>
<meta name="description" content="${job.title} job at ${job.companyName} in ${job.city}">
<meta name="robots" content="index,follow">
<script type="application/ld+json">
${JSON.stringify(schema)}
</script>
</head>
<body>
<h1>${job.title}</h1>
<p>${job.companyName}</p>
<p>${job.city}, ${job.state}</p>
<div>${job.description}</div>
</body>
</html>
  `);
}