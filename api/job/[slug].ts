import { adminDb } from "../../firebase-admin";

export default async function handler(req, res) {
  try {
    const slug = req.query.slug;

    const id = slug.split("-").pop();

    const snap = await adminDb
      .collection("careers")
      .doc(id)
      .get();

    if (!snap.exists) {
      return res.status(404).send("Not Found");
    }

    const job = snap.data();

    const schema = {
      "@context": "https://schema.org",
      "@type": "JobPosting",

      title: job.title,

      description: job.description,

      directApply: true,

      identifier: {
        "@type": "PropertyValue",
        name: "C FOUND",
        value: id
      },

      datePosted: job.createdAt?.toDate
        ? job.createdAt.toDate().toISOString()
        : new Date().toISOString(),

      validThrough: `${job.deadline}T23:59:59+05:30`,

      employmentType:
        job.jobType === "full-time"
          ? "FULL_TIME"
          : "PART_TIME",

      hiringOrganization: {
        "@type": "Organization",
        name: job.companyName,
        sameAs: "https://cfound.in",
        url: "https://cfound.in"
      },

      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: job.city,
          addressRegion: job.state,
          addressCountry: job.country
        }
      },

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

    res.setHeader(
      "Content-Type",
      "text/html"
    );

    return res.send(`
<!DOCTYPE html>
<html>
<head>

<title>${job.title}</title>

<meta name="robots" content="index,follow">

<script type="application/ld+json">
${JSON.stringify(schema)}
</script>

<meta http-equiv="refresh" content="0;url=https://cfound.in/careers/${slug}" />

</head>

<body>

<h1>${job.title}</h1>

</body>

</html>
`);
  } catch (err) {
    console.error(err);

    return res.status(500).send("Error");
  }
}