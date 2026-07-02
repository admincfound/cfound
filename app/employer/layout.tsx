import EmployerProviders from "../components/employer/EmployerProviders";

export default function EmployerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmployerProviders>{children}</EmployerProviders>;
}
