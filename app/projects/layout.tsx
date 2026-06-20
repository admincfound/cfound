import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",

  description:
    "Explore projects built by C Found including software platforms, AI solutions, game development and digital products.",

  alternates: {
    canonical: "https://www.cfound.in/projects",
  },

  openGraph: {
    title: "Projects | C Found",

    description:
      "Explore projects built by C Found including software platforms, AI solutions, game development and digital products.",

    url: "https://www.cfound.in/projects",

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

    title: "Projects | C Found",

    description:
      "Explore projects built by C Found including software platforms, AI solutions, game development and digital products.",

    images: ["https://www.cfound.in/og-image.png"],
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}