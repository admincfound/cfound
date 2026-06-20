import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",

  description:
    "Learn AI, Machine Learning, Web Development, Game Development and industry-ready technologies with C Found courses.",

  alternates: {
    canonical: "https://www.cfound.in/courses",
  },

  openGraph: {
    title: "Courses | C Found",

    description:
      "Learn AI, Machine Learning, Web Development, Game Development and industry-ready technologies with C Found courses.",

    url: "https://www.cfound.in/courses",

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

    title: "Courses | C Found",

    description:
      "Learn AI, Machine Learning, Web Development, Game Development and industry-ready technologies with C Found courses.",

    images: ["https://www.cfound.in/og-image.png"],
  },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}