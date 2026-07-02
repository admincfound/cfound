import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Employer Login | C Found",
  description: "Sign in to your C Found employer account to manage jobs and applicants.",
  alternates: { canonical: "https://www.cfound.in/employer/login" },
};

export default function EmployerLoginPage() {
  return <LoginClient />;
}
