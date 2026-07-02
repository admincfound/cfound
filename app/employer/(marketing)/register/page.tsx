import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Create Employer Account | C Found",
  description: "Create a free C Found employer account to start posting jobs and hiring.",
  alternates: { canonical: "https://www.cfound.in/employer/register" },
};

export default function EmployerRegisterPage() {
  return <RegisterClient />;
}
