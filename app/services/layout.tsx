import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",

  description:
    "Explore C Found services including software development, AI solutions, game development, mobile applications and digital products.",

  alternates: {
    canonical: "https://www.cfound.in/services",
  },

  openGraph: {
    title: "Services | C Found",

    description:
      "Explore C Found services including software development, AI solutions, game development, mobile applications and digital products.",

    url: "https://www.cfound.in/services",

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

    title: "Services | C Found",

    description:
      "Explore C Found services including software development, AI solutions, game development, mobile applications and digital products.",

    images: ["https://www.cfound.in/og-image.png"],
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}