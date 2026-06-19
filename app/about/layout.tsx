import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About C Found",

  description:
    "Learn about C Found, an Indian software, AI, game development and digital solutions company.",

  alternates: {
    canonical: "https://www.cfound.in/about",
  },

  openGraph: {
    title: "About C Found",
    description:
      "Learn about C Found, an Indian software, AI, game development and digital solutions company.",

    url: "https://www.cfound.in/about",

    siteName: "C Found",

    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],

    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title: "About C Found",

    description:
      "Learn about C Found, an Indian software, AI, game development and digital solutions company.",

    images: ["/logo.png"],
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}