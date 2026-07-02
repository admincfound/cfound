"use client";

import { CreditCard, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { PageHeader, Card, Badge } from "../../../components/employer/UI";

const plans = [
  { name: "Starter", price: "Free", features: ["1 active job post", "Basic applicant tracking"] },
  { name: "Growth", price: "\u20b94,999/mo", features: ["10 active job posts", "5 recruiter seats", "Analytics dashboard"] },
  { name: "Enterprise", price: "Custom", features: ["Unlimited job posts", "Priority support"] },
];

export default function EmployerBillingPage() {
  return (
    <div>
      <PageHeader title="Billing" subtitle="Manage your subscription plan." />

      <Card className="mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
          <CreditCard size={20} />
        </div>
        <div className="flex-1">
          <div className="font-black italic text-[var(--text-main)]">Current Plan: Starter</div>
          <div className="text-xs text-[var(--text-muted)]">Free &middot; No payment method on file</div>
        </div>
        <Badge tone="success">Active</Badge>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <Card key={p.name}>
            <h3 className="font-black italic text-[var(--text-main)] mb-1">{p.name}</h3>
            <div className="text-2xl font-black italic text-[var(--text-main)] mb-4">{p.price}</div>
            <div className="space-y-2.5 mb-6">
              {p.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Check size={14} className="text-blue-600" />
                  {f}
                </div>
              ))}
            </div>
            <button
              onClick={() => toast("Payment integration coming soon.")}
              className="w-full text-xs font-black uppercase tracking-widest border border-[var(--border-main)] py-3 rounded-xl hover:bg-[var(--bg-main)] transition-colors"
            >
              {p.name === "Starter" ? "Current Plan" : "Upgrade"}
            </button>
          </Card>
        ))}
      </div>

      <p className="text-[10px] text-[var(--text-muted)] mt-6 uppercase tracking-widest font-bold">
        Payment integration is not yet enabled
      </p>
    </div>
  );
}
