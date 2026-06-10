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

const adminDb = getFirestore(
  undefined,
  "ai-studio-24810410-2d44-4bca-af7d-11572783e2b5"
);

export default async function handler(req, res) {
  try {
    const slug = String(req.query.slug || "");
    const id = slug.split("-").pop();

    if (!id) {
      return res.status(404).send("Job not found");
    }

    const doc = await adminDb
      .collection("careers")
      .doc(id)
      .get();

    if (!doc.exists) {
      return res.status(404).send("Job not found");
    }

    const job = {
      id: doc.id,
      ...doc.data()
    };

    const formatCompensation = () => {
      if (job.compType === "revenue") {
        return job.compFormat === "fixed"
          ? `${job.minAmount}%`
          : `${job.minAmount}% - ${job.maxAmount}%`;
      }

      if (job.compFormat === "fixed") {
        return `₹${Number(
          job.minAmount || 0
        ).toLocaleString("en-IN")}`;
      }

      if (job.compFormat === "range") {
        return `₹${Number(
          job.minAmount || 0
        ).toLocaleString("en-IN")} - ₹${Number(
          job.maxAmount || 0
        ).toLocaleString("en-IN")}`;
      }

      return "Negotiable";
    };

    const schema = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      url: `https://www.cfound.in/careers/${slug}`,
      title: job.title,

      datePosted: job.createdAt?.toDate
        ? job.createdAt.toDate().toISOString()
        : new Date().toISOString(),

      validThrough: job.deadline
        ? new Date(job.deadline).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),

      employmentType: job.jobType || "FULL_TIME",

      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: job.city || "",
          addressRegion: job.state || "",
          addressCountry: job.country || "IN"
        }
      },

      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "INR",
        value: {
          "@type": "QuantitativeValue",
          minValue: Number(job.minAmount || 0),
          maxValue: Number(job.maxAmount || job.minAmount || 0),
          unitText: "MONTH"
        }
      },

      description: [
        job.description || "",
        "Requirements:",
        Array.isArray(job.requirements)
          ? job.requirements.join("\n")
          : "",
        "Responsibilities:",
        job.responsibilities || "",
        "Benefits:",
        Array.isArray(job.jobBenefits)
          ? job.jobBenefits.join("\n")
          : ""
      ].join("\n"),

      directApply: true,

      identifier: {
        "@type": "PropertyValue",
        name: job.companyName || "C Found",
        value: job.id
      },

      hiringOrganization: {
        "@type": "Organization",
        name: job.companyName || "C Found",
        sameAs: "https://www.cfound.in",
        url: "https://www.cfound.in",
        logo: "https://www.cfound.in/logo.png"
      }
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>${job.title} | C Found Careers</title>

<meta
  name="description"
  content="${(job.description || "")
    .replace(/"/g, "&quot;")
    .slice(0, 160)}"
/>

<link rel="canonical"
href="https://www.cfound.in/careers/${slug}" />

<meta name="robots" content="index,follow" />

<script type="application/ld+json">
${JSON.stringify(schema)}
</script>

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
}

body{
background:#0b0b0b;
color:white;
font-family:Inter,Arial,sans-serif;
line-height:1.7;
}

.container{
max-width:1400px;
margin:auto;
padding:40px 20px;
}

.hero{
background:#111;
border:1px solid #222;
border-radius:32px;
padding:50px;
margin-bottom:30px;
}

.badges{
display:flex;
gap:10px;
flex-wrap:wrap;
margin-bottom:20px;
}

.badge{
padding:10px 16px;
border-radius:12px;
background:#181818;
font-size:12px;
font-weight:700;
text-transform:uppercase;
}

.urgent{
background:#220000;
color:#ff4d4d;
}

.title{
font-size:60px;
font-weight:900;
line-height:1;
margin-bottom:20px;
text-transform:uppercase;
}

.meta{
display:flex;
flex-wrap:wrap;
gap:20px;
color:#999;
margin-bottom:25px;
}

.salary{
font-size:42px;
font-weight:900;
color:#3b82f6;
margin-top:20px;
}

.actions{
display:flex;
gap:12px;
margin-top:30px;
flex-wrap:wrap;
}

.btn{
padding:14px 22px;
border-radius:14px;
border:none;
cursor:pointer;
font-weight:700;
text-decoration:none;
display:inline-flex;
align-items:center;
justify-content:center;
}

.btn-primary{
background:#2563eb;
color:white;
}

.btn-secondary{
background:#181818;
color:white;
border:1px solid #333;
}

.grid{
display:grid;
grid-template-columns:2fr 1fr;
gap:30px;
}

.card{
background:#111;
border:1px solid #222;
border-radius:28px;
padding:30px;
margin-bottom:24px;
}

.card h2{
margin-bottom:20px;
font-size:28px;
}

.skills{
display:flex;
flex-wrap:wrap;
gap:10px;
}

.skill{
padding:10px 16px;
border-radius:12px;
background:#0f1b33;
color:#60a5fa;
font-weight:700;
}

.item{
margin-bottom:12px;
}

@media(max-width:900px){

.grid{
grid-template-columns:1fr;
}

.title{
font-size:42px;
}

.hero{
padding:25px;
}

}

</style>

</head>

<body>

<div class="container">

<div class="hero">

<div class="badges">

<span class="badge">
${job.jobType || "Position"}
</span>

${
  job.department
    ? `<span class="badge">${job.department}</span>`
    : ""
}

${
  job.hiringUrgently
    ? `<span class="badge urgent">Urgent Hiring</span>`
    : ""
}

</div>

<h1 class="title">
${job.title}
</h1>

<div class="meta">

<div>
${job.companyName || "C Found"}
</div>

<div>
${job.city || ""} ${job.state || ""}
</div>

<div>
${job.applications || 0} Applicants
</div>

<div>
${job.views || 0} Views
</div>

</div>

<div class="salary">
${formatCompensation()}
</div>

<div class="actions">

<a
href="/careers"
class="btn btn-secondary"
>
Back
</a>

<button
id="shareBtn"
class="btn btn-secondary"
>
Share
</button>

<button
id="applyBtn"
class="btn btn-primary"
>
Loading...
</button>

</div>

</div>

<div class="grid">

<div>

<div class="card">
<h2>About Role</h2>
<p>
${job.description || ""}
</p>
</div>

${
  job.skills?.length
    ? `
<div class="card">
<h2>Skills Required</h2>
<div class="skills">
${job.skills
  .map(
    (skill) =>
      `<span class="skill">${skill}</span>`
  )
  .join("")}
</div>
</div>
`
    : ""
}

${
  job.requirements?.length
    ? `
<div class="card">
<h2>Requirements</h2>

${job.requirements
  .map(
    (r) =>
      `<div class="item">${r}</div>`
  )
  .join("")}

</div>
`
    : ""
}

</div>

<div>

<div class="card">

<h2>Job Details</h2>

<div class="item">
Compensation:
${formatCompensation()}
</div>

<div class="item">
Experience:
${job.experience || "Fresher"}
</div>

<div class="item">
Job Type:
${job.jobType || ""}
</div>

<div class="item">
Work Mode:
${job.mode || ""}
</div>

</div>

<div class="card">

<h2>Company Information</h2>

<div class="item">
${job.companyName || "C Found"}
</div>

<div class="item">
${job.country || "India"}
</div>

</div>

</div>

</div>

</div>

<script src="/job-client.js"></script>

<script>
window.__JOB__ = ${JSON.stringify(job)};
</script>

</body>
</html>
`;

    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(html);

  } catch (err) {
    console.error(err);
    return res.status(500).send(String(err));
  }
}

