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

    title: "Services | C Found",

    description:
      "Explore C Found services including software development, AI solutions, game development, mobile applications and digital products.",

    images: ["/logo.png"],
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}