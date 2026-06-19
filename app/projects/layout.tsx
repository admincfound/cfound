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

    title: "Projects | C Found",

    description:
      "Explore projects built by C Found including software platforms, AI solutions, game development and digital products.",

    images: ["/logo.png"],
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}