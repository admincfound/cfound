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
  },

  twitter: {
    card: "summary_large_image",

    title: "Courses | C Found",

    description:
      "Learn AI, Machine Learning, Web Development, Game Development and industry-ready technologies with C Found courses.",

  },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}