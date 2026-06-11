import fs from "fs";
import path from "path";
import { adminDb } from "../src/lib/firebase-admin";

function slugify(title: string, id: string) {
  return `${title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")}-${id}`;
}

async function buildJobs() {
  const snapshot = await adminDb
    .collection("careers")
    .get();

  for (const doc of snapshot.docs) {
    const job: any = doc.data();
    const id = doc.id;

    const slug = slugify(
      job.title || "job",
      id
    );

    const dir = path.join(
      process.cwd(),
      "dist",
      "careers",
      slug
    );

    fs.mkdirSync(dir, {
      recursive: true,
    });

    fs.writeFileSync(
      path.join(dir, "index.html"),
      `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<title>${job.title} | C Found Careers</title>

<meta
name="description"
content="${(job.description || "")
  .replace(/"/g, "&quot;")
  .slice(0, 160)}">

<link
rel="canonical"
href="https://www.cfound.in/careers/${slug}">
</head>

<body>
<h1>${job.title}</h1>

<div>
${job.description || ""}
</div>

<script>
location.replace("/careers/${slug}");
</script>
</body>
</html>
`
    );

    console.log("Generated:", slug);
  }
}

buildJobs()
  .then(() => {
    console.log("Done");
  })
  .catch(console.error);