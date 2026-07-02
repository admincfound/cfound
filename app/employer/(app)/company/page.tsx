"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Save, Building2, BadgeCheck } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useEmployerAuth } from "../../../context/employer/EmployerAuthContext";
import { updateEmployerProfile } from "../../../lib/employer/employers";
import { PageHeader, Card, Badge } from "../../../components/employer/UI";

const emptyForm = {
  companyName: "",
  logoUrl: "",
  coverUrl: "",
  website: "",
  email: "",
  phone: "",
  description: "",
  industry: "",
  companySize: "",
  location: "",
  linkedin: "",
  twitter: "",
  facebook: "",
  instagram: "",
};

export default function EmployerCompanyPage() {
  const { user } = useAuth();
  const { company, companyLoading, refreshCompany } = useEmployerAuth();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!company) return;
    setForm({
      companyName: company.companyName || "",
      logoUrl: company.logoUrl || "",
      coverUrl: company.coverUrl || "",
      website: company.website || "",
      email: company.email || "",
      phone: company.phone || "",
      description: company.description || "",
      industry: company.industry || "",
      companySize: company.companySize || "",
      location: company.location || "",
      linkedin: company.socialLinks?.linkedin || "",
      twitter: company.socialLinks?.twitter || "",
      facebook: company.socialLinks?.facebook || "",
      instagram: company.socialLinks?.instagram || "",
    });
  }, [company]);

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateEmployerProfile(user.uid, {
        companyName: form.companyName,
        logoUrl: form.logoUrl,
        coverUrl: form.coverUrl,
        website: form.website,
        email: form.email,
        phone: form.phone,
        description: form.description,
        industry: form.industry,
        companySize: form.companySize,
        location: form.location,
        socialLinks: {
          linkedin: form.linkedin,
          twitter: form.twitter,
          facebook: form.facebook,
          instagram: form.instagram,
        },
      });
      await refreshCompany();
      toast.success("Company profile updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save company profile");
    } finally {
      setSaving(false);
    }
  };

  if (companyLoading) {
    return <div className="text-sm text-[var(--text-muted)]">Loading company profile...</div>;
  }

  return (
    <div>
      <PageHeader
        title="Company Profile"
        subtitle="This information is shown to candidates on your job listings."
        action={
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs px-5 py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-4 overflow-hidden">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 size={28} />
            )}
          </div>
          <h3 className="font-black italic text-[var(--text-main)] mb-1">
            {form.companyName || "Your Company"}
          </h3>
          <Badge tone={company?.verificationStatus === "verified" ? "success" : "warning"}>
            <span className="inline-flex items-center gap-1">
              <BadgeCheck size={11} />
              {company?.verificationStatus || "unverified"}
            </span>
          </Badge>

          <div className="w-full mt-6 text-left">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Logo URL
            </label>
            <input
              value={form.logoUrl}
              onChange={set("logoUrl")}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-xs mb-4 focus:outline-none focus:border-blue-500 text-[var(--text-main)]"
              placeholder="https://..."
            />
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Cover Image URL
            </label>
            <input
              value={form.coverUrl}
              onChange={set("coverUrl")}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-[var(--text-main)]"
              placeholder="https://..."
            />
          </div>
        </Card>

        <Card className="lg:col-span-2 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Company Name" value={form.companyName} onChange={set("companyName")} />
            <Field label="Website" value={form.website} onChange={set("website")} placeholder="https://" />
            <Field label="Email" value={form.email} onChange={set("email")} type="email" />
            <Field label="Phone" value={form.phone} onChange={set("phone")} />
            <Field label="Industry" value={form.industry} onChange={set("industry")} />
            <Field label="Company Size" value={form.companySize} onChange={set("companySize")} placeholder="e.g. 11-50" />
            <Field label="Location" value={form.location} onChange={set("location")} />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Description
            </label>
            <textarea
              rows={5}
              value={form.description}
              onChange={set("description")}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-[var(--text-main)] resize-none"
              placeholder="Tell candidates about your company..."
            />
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">
              Social Links
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="LinkedIn" value={form.linkedin} onChange={set("linkedin")} />
              <Field label="Twitter / X" value={form.twitter} onChange={set("twitter")} />
              <Field label="Facebook" value={form.facebook} onChange={set("facebook")} />
              <Field label="Instagram" value={form.instagram} onChange={set("instagram")} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-[var(--text-main)]"
      />
    </div>
  );
}
