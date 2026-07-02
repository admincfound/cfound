"use client";

import { EmployerAuthProvider } from "../../context/employer/EmployerAuthContext";

export default function EmployerProviders({ children }: { children: React.ReactNode }) {
  return <EmployerAuthProvider>{children}</EmployerAuthProvider>;
}
