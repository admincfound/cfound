const fs = require("fs");

const urls = [
  "https://www.cfound.in/",
  "https://www.cfound.in/about",
  "https://www.cfound.in/services",
  "https://www.cfound.in/projects",
  "https://www.cfound.in/internship",
  "https://www.cfound.in/careers",
  "https://www.cfound.in/courses",
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