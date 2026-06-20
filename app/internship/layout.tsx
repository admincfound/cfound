import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Internships",

  description:
    "Join C Found internship programs and gain practical experience in AI, software development, game development and modern technologies.",

  alternates: {
    canonical: "https://www.cfound.in/internship",
  },

  openGraph: {
    title: "Internships | C Found",

    description:
      "Join C Found internship programs and gain practical experience in AI, software development, game development and modern technologies.",

    url: "https://www.cfound.in/internship",

    siteName: "C Found",

    type: "website",

    images: [
      {
        url: "https://www.cfound.in/og-image.png",
        width: 1200,
        height: 630,
        alt: "C Found",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "Internships | C Found",

    description:
      "Join C Found internship programs and gain practical experience in AI, software development, game development and modern technologies.",

    images: ["https://www.cfound.in/og-image.png"],
  },
};

export default function InternshipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}