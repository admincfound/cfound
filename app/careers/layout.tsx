import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers",

  description:
    "Explore job opportunities at C Found. Apply for software, AI, game development and other technology roles.",

  alternates: {
    canonical: "https://www.cfound.in/careers",
  },

  openGraph: {
    title: "Careers | C Found",

    description:
      "Explore job opportunities at C Found. Apply for software, AI, game development and other technology roles.",

    url: "https://www.cfound.in/careers",

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

    title: "Careers | C Found",

    description:
      "Explore job opportunities at C Found. Apply for software, AI, game development and other technology roles.",

    images: ["https://www.cfound.in/og-image.png"],
  },
};

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}