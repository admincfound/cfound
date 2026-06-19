import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | C Found",

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

    title: "Contact | C Found",

    description:
      "Contact C Found for software development, AI solutions, game development, internships, careers, partnerships and project inquiries.",

    images: ["/logo.png"],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}