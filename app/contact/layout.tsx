import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",

  description:
    "Contact C Found for software development, AI solutions, game development, internships, careers, partnerships and project inquiries.",

  alternates: {
    canonical: "https://www.cfound.in/contact",
  },

  openGraph: {
    title: "Contact | C Found",

    description:
      "Contact C Found for software development, AI solutions, game development, internships, careers, partnerships and project inquiries.",

    url: "https://www.cfound.in/contact",

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

    title: "Contact | C Found",

    description:
      "Contact C Found for software development, AI solutions, game development, internships, careers, partnerships and project inquiries.",

    images: ["https://www.cfound.in/og-image.png"],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}