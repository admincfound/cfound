import type { Metadata } from "next";
import InternshipDetails from "./InternshipDetails";

export const metadata: Metadata = {
  title: "Internship Details | C Found",

  description:
    "Explore internship opportunities at C Found.",

  openGraph: {
    title: "Internship Details | C Found",

    description:
      "Explore internship opportunities at C Found.",

    url: "https://www.cfound.in/internship",

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

    title: "Internship Details | C Found",

    description:
      "Explore internship opportunities at C Found.",

    images: ["https://www.cfound.in/og-image.png"],
  },
};

export default function Page() {
  return <InternshipDetails />;
}