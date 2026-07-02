import type { MetadataRoute } from "next";
import { adminDb } from "@/app/lib/firebase-admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.cfound.in";

  const pages = [
    "",
    "/about",
    "/services",
    "/projects",
    "/internship",
    "/careers",
    "/courses",
    "/contact",
    "/employer",
    "/employer/features",
    "/employer/pricing",
    "/employer/about",
    "/employer/contact",
    "/employer/login",
    "/employer/register",
  ];

  const sitemap: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: page === "" ? 1 : 0.8,
  }));

  try {
    const careersSnap = await adminDb.collection("careers").get();

    careersSnap.forEach((doc) => {
      const job = doc.data();

      const slug =
        job.slug ||
        job.title
          ?.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");

      sitemap.push({
        url: `${baseUrl}/careers/${slug}-${doc.id}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      });
    });
  } catch (error) {
    console.error("Sitemap error:", error);
  }

  return sitemap;
}