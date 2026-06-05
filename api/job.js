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
  console.log("JOB API HIT:", req.url);
  try {
    const slug = req.url.split("/").pop();

    const id = slug.split("-").pop();

    const snap = await db
      .collection("careers")
      .doc(id)
      .get();

    if (!snap.exists) {
      return res
        .status(404)
        .send("Job not found");
    }

    const job = snap.data();

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

      return `₹${Number(
        job.minAmount || 0
      ).toLocaleString("en-IN")} - ₹${Number(
        job.maxAmount || 0
      ).toLocaleString("en-IN")}`;
    };

    const schema = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: job.title,
      description: job.description || "",
      datePosted:
        job.createdAt?.toDate?.()?.toISOString?.(),
      validThrough:
        job.deadline || undefined,
      employmentType:
        job.jobType || "FULL_TIME",

      hiringOrganization: {
        "@type": "Organization",
        name:
          job.companyName ||
          "C Found Technologies",
      },

      jobLocationType:
        job.mode === "Remote"
          ? "TELECOMMUTE"
          : undefined,

      applicantLocationRequirements:
        job.mode === "Remote"
          ? {
              "@type": "Country",
              name: "India",
            }
          : undefined,

      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "INR",
        value: {
          "@type": "QuantitativeValue",
          minValue: Number(
            job.minAmount || 0
          ),
          maxValue: Number(
            job.maxAmount || 0
          ),
          unitText: "MONTH",
        },
      },
    };

    return res.send(`
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="utf-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1"
/>

<title>${job.title} | C Found Careers</title>

<meta
name="description"
content="${(
  job.description || ""
)
  .replace(/"/g, "&quot;")
  .slice(0, 160)}"
/>

<meta
name="robots"
content="index,follow"
/>

<link
rel="canonical"
href="https://www.cfound.in/careers/${slug}"
/>

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
font-family:Inter,Arial,sans-serif;
background:#f6f7fb;
color:#111827;
}

.page{
max-width:1280px;
margin:auto;
padding:40px 20px;
}

.card{
background:white;
border:1px solid #e5e7eb;
border-radius:32px;
}

.hero{
padding:60px;
margin-bottom:32px;
}

</style>

</head>

<body>

<div class="page">
<div class="card hero">

<div
style="
display:flex;
flex-wrap:wrap;
gap:12px;
margin-bottom:24px;
"
>

<div
style="
padding:10px 18px;
border-radius:14px;
background:#eef4ff;
color:#2563eb;
font-size:11px;
font-weight:800;
text-transform:uppercase;
letter-spacing:1px;
"
>
${job.jobType || "POSITION"}
</div>

${
job.department
? `
<div
style="
padding:10px 18px;
border-radius:14px;
border:1px solid #d1d5db;
font-size:11px;
font-weight:800;
text-transform:uppercase;
letter-spacing:1px;
"
>
${job.department}
</div>
`
: ""
}

${
job.hiringUrgently
? `
<div
style="
padding:10px 18px;
border-radius:14px;
background:#fee2e2;
color:#dc2626;
font-size:11px;
font-weight:800;
text-transform:uppercase;
letter-spacing:1px;
"
>
⚡ URGENT HIRING
</div>
`
: ""
}

</div>

<h1
style="
font-size:72px;
font-weight:900;
font-style:italic;
text-transform:uppercase;
line-height:1;
margin-bottom:24px;
"
>
${job.title}
</h1>

<div
style="
display:flex;
flex-wrap:wrap;
gap:24px;
color:#6b7280;
margin-bottom:40px;
"
>

<div>
🏢 ${job.companyName || "C Found Technologies"}
</div>

<div>
📍 ${job.location || "Remote"}
</div>

<div>
👥 ${job.applications || 0} Applicants
</div>

<div>
👁 ${job.views || 0} Views
</div>

</div>

<div
style="
display:grid;
grid-template-columns:1fr auto;
gap:24px;
align-items:end;
"
>

<div>

<div
style="
font-size:12px;
text-transform:uppercase;
letter-spacing:2px;
color:#6b7280;
margin-bottom:10px;
"
>
COMPENSATION
</div>

<div
style="
font-size:52px;
font-weight:900;
color:#2563eb;
"
>
${formatCompensation()}
</div>

<div
style="
display:flex;
flex-wrap:wrap;
gap:12px;
margin-top:20px;
"
>

<div
style="
padding:10px 16px;
border-radius:14px;
border:1px solid #e5e7eb;
"
>
⏰ ${job.timing || "Flexible"}
</div>

<div
style="
padding:10px 16px;
border-radius:14px;
border:1px solid #e5e7eb;
"
>
💼 ${job.experience || "Fresher"}
</div>

</div>

</div>

<div
style="
display:flex;
gap:12px;
flex-wrap:wrap;
"
>

<a
href="https://www.cfound.in/careers"
style="
height:52px;
padding:0 24px;
display:flex;
align-items:center;
justify-content:center;
border-radius:16px;
border:1px solid #d1d5db;
text-decoration:none;
color:#111827;
font-weight:700;
"
>
Back
</a>

<a
href="https://www.cfound.in/careers/${slug}"
style="
height:52px;
padding:0 24px;
display:flex;
align-items:center;
justify-content:center;
border-radius:16px;
background:#2563eb;
text-decoration:none;
color:white;
font-weight:700;
"
>
Apply Now
</a>

</div>

</div>

</div>

<div
style="
display:grid;
grid-template-columns:2fr 1fr;
gap:32px;
"
>

<div>

<!-- ABOUT ROLE -->

<div
class="card"
style="
padding:32px;
margin-bottom:32px;
"
>

<h2
style="
font-size:32px;
font-weight:900;
margin-bottom:20px;
"
>
About Role
</h2>

<p
style="
line-height:1.8;
color:#6b7280;
white-space:pre-wrap;
"
>
${job.description || "No description available."}
</p>

</div>

<!-- SKILLS -->

${
job.skills?.length
? `
<div
class="card"
style="
padding:32px;
margin-bottom:32px;
"
>

<h2
style="
font-size:32px;
font-weight:900;
margin-bottom:20px;
"
>
Skills Required
</h2>

<div
style="
display:flex;
flex-wrap:wrap;
gap:12px;
"
>

${job.skills
.map(
(skill) => `
<span
style="
padding:10px 16px;
border-radius:14px;
background:#eef4ff;
color:#2563eb;
font-size:13px;
font-weight:700;
"
>
${skill}
</span>
`
)
.join("")}

</div>

</div>
`
: ""
}

<!-- BENEFITS -->

${
job.jobBenefits?.length
? `
<div
class="card"
style="
padding:32px;
margin-bottom:32px;
"
>

<h2
style="
font-size:32px;
font-weight:900;
margin-bottom:20px;
"
>
Benefits & Perks
</h2>

<div
style="
display:grid;
grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
gap:14px;
"
>

${job.jobBenefits
.map(
(item) => `
<div
style="
padding:16px;
border-radius:16px;
border:1px solid #e5e7eb;
display:flex;
gap:12px;
align-items:center;
"
>
<span
style="
color:#16a34a;
font-size:18px;
"
>
✓
</span>

<span>
${item}
</span>

</div>
`
)
.join("")}

</div>

</div>
`
: ""
}
<!-- REQUIREMENTS -->

${
job.requirements?.length
? `
<div
class="card"
style="
padding:32px;
margin-bottom:32px;
"
>

<h2
style="
font-size:32px;
font-weight:900;
margin-bottom:24px;
"
>
Requirements
</h2>

<div
style="
display:flex;
flex-direction:column;
gap:18px;
"
>

${job.requirements
.map(
(req) => `
<div
style="
display:flex;
align-items:flex-start;
gap:12px;
"
>

<span
style="
color:#2563eb;
font-weight:900;
font-size:18px;
"
>
✓
</span>

<span>
${req}
</span>

</div>
`
)
.join("")}

</div>

</div>
`
: ""
}

<!-- RESPONSIBILITIES -->

${
job.responsibilities
? `
<div
class="card"
style="
padding:32px;
margin-bottom:32px;
"
>

<h2
style="
font-size:32px;
font-weight:900;
margin-bottom:24px;
"
>
Responsibilities
</h2>

<div
style="
display:flex;
flex-direction:column;
gap:18px;
"
>

${job.responsibilities
.split("\n")
.filter(
(item) => item.trim()
)
.map(
(item) => `
<div
style="
display:flex;
align-items:flex-start;
gap:12px;
"
>

<span
style="
color:#2563eb;
font-weight:900;
font-size:18px;
"
>
✓
</span>

<span>
${item}
</span>

</div>
`
)
.join("")}

</div>

</div>
`
: ""
}
</div>

<div>

<!-- JOB DETAILS -->

<div
class="card"
style="
padding:32px;
margin-bottom:32px;
"
>

<h2
style="
font-size:24px;
font-weight:900;
margin-bottom:24px;
"
>
Job Details
</h2>

<div
style="
display:flex;
flex-direction:column;
gap:20px;
"
>

<div>
<strong>💰 Compensation</strong>
<br>
<span style="color:#6b7280;">
${formatCompensation()}
</span>
</div>

<div>
<strong>💼 Job Type</strong>
<br>
<span style="color:#6b7280;">
${job.jobType || "Not Specified"}
</span>
</div>

<div>
<strong>⏰ Shift</strong>
<br>
<span style="color:#6b7280;">
${job.timing || "Flexible"}
</span>
</div>

${
job.workHours
? `
<div>
<strong>🕒 Work Hours</strong>
<br>
<span style="color:#6b7280;">
${job.workHours}
</span>
</div>
`
: ""
}

${
job.workDays
? `
<div>
<strong>📅 Work Days</strong>
<br>
<span style="color:#6b7280;">
${job.workDays}
</span>
</div>
`
: ""
}

<div>
<strong>👥 Experience</strong>
<br>
<span style="color:#6b7280;">
${job.experience || "Fresher"}
</span>
</div>

${
job.educationRequirement
? `
<div>
<strong>🎓 Education</strong>
<br>
<span style="color:#6b7280;">
${job.educationRequirement}
</span>
</div>
`
: ""
}

${
job.industry
? `
<div>
<strong>🏭 Industry</strong>
<br>
<span style="color:#6b7280;">
${job.industry}
</span>
</div>
`
: ""
}

${
job.contractDuration
? `
<div>
<strong>📆 Contract Duration</strong>
<br>
<span style="color:#6b7280;">
${job.contractDuration}
</span>
</div>
`
: ""
}

${
job.joiningTime
? `
<div>
<strong>⚡ Joining Time</strong>
<br>
<span style="color:#6b7280;">
${job.joiningTime}
</span>
</div>
`
: ""
}

${
job.deadline
? `
<div>
<strong>📅 Application Deadline</strong>
<br>
<span style="color:#6b7280;">
${new Date(job.deadline).toLocaleDateString("en-IN")}
</span>
</div>
`
: ""
}

</div>

</div>

<!-- COMPANY INFORMATION -->

<div
class="card"
style="
padding:32px;
margin-bottom:32px;
"
>

<h2
style="
font-size:24px;
font-weight:900;
margin-bottom:24px;
"
>
Company Information
</h2>

<div
style="
display:flex;
flex-direction:column;
gap:20px;
"
>

<div>
<strong>Company</strong>
<br>
<span style="color:#6b7280;">
${job.companyName || "C Found Technologies"}
</span>
</div>

<div>
<strong>Work Mode</strong>
<br>
<span style="color:#6b7280;">
${job.mode || "Remote"}
</span>
</div>

<div>
<strong>Location</strong>
<br>
<span style="color:#6b7280;">
${job.location || "Remote"}
</span>
</div>

${
job.openings
? `
<div>
<strong>Open Positions</strong>
<br>
<span style="color:#6b7280;">
${job.openings}
</span>
</div>
`
: ""
}

</div>

</div>

<!-- CONTACT INFORMATION -->

${
job.contactEmail || job.contactPhone
? `
<div
class="card"
style="
padding:32px;
margin-bottom:32px;
"
>

<h2
style="
font-size:24px;
font-weight:900;
margin-bottom:24px;
"
>
Contact Information
</h2>

<div
style="
display:flex;
flex-direction:column;
gap:20px;
"
>

${
job.contactEmail
? `
<div>
<strong>📧 Email</strong>
<br>
<span style="color:#6b7280;word-break:break-all;">
${job.contactEmail}
</span>
</div>
`
: ""
}

${
job.contactPhone
? `
<div>
<strong>📞 Phone</strong>
<br>
<span style="color:#6b7280;">
${job.contactPhone}
</span>
</div>
`
: ""
}

</div>

</div>
`
: ""
}
</div>

</div>

</div>

</body>

</html>
`);
  } catch (err) {
    console.error("FULL ERROR:", err);

    return res
      .status(500)
      .send(
        String(
          err.stack || err
        )
      );
  }
}