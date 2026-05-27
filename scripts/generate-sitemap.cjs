const fs = require("fs");

const urls = [
  "https://www.cfound.in/",
  "https://www.cfound.in/internships",
  "https://www.cfound.in/jobs",
  "https://www.cfound.in/contact",
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

urls.forEach((url) => {
  xml += `
  <url>
    <loc>${url}</loc>
  </url>`;
});

xml += `
</urlset>`;

fs.writeFileSync("./public/sitemap.xml", xml);

console.log("done");