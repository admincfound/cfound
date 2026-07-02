import type { Metadata } from "next";
import EmployerAppShell from "./EmployerAppShell";

export const metadata: Metadata = {
  title: "Employer Dashboard | C Found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmployerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmployerAppShell>{children}</EmployerAppShell>;
}
