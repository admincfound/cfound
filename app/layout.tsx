import type { Metadata } from "next";
import "./index.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Providers from "./components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cfound.in"),

  title: {
    default: "C Found",
    template: "%s | C Found",
  },

  description:
    "C Found - Careers, internships, hiring opportunities, and talent discovery platform.",

  keywords: [
    "C Found",
    "Jobs",
    "Careers",
    "Internships",
    "Hiring",
    "Recruitment",
  ],

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: "https://www.cfound.in",
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },

  openGraph: {
    title: "C Found",
    description:
      "Careers, internships, hiring opportunities, and talent discovery platform.",
    url: "https://www.cfound.in",
    siteName: "C Found",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "C Found",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "C Found",
    description:
      "Careers, internships, hiring opportunities, and talent discovery platform.",
    images: ["https://www.cfound.in/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}