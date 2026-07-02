import MarketingNavbar from "../../components/employer/MarketingNavbar";
import MarketingFooter from "../../components/employer/MarketingFooter";

export default function EmployerMarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
