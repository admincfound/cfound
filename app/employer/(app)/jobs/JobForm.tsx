"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Save, Send } from "lucide-react";
import { EmployerJob } from "../../../lib/employer/jobs";
import { Card } from "../../../components/employer/UI";

export interface JobFormValues {
  title: string;
  companyName: string;
  location: string;
  jobType: EmployerJob["jobType"];
  experience: string;
  salary: string;
  description: string;
  requirements: string;
  skills: string;
}

const jobTypes: NonNullable<EmployerJob["jobType"]>[] = [
  "full-time",
  "part-time",
  "freelance",
  "internship",
];

export default function JobForm({
  initialValues,
  onSubmit,
  submitLabel = "Save",
}: {
  initialValues: JobFormValues;
  onSubmit: (values: JobFormValues, status: "draft" | "active") => Promise<void>;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState<"draft" | "active" | null>(null);

  const set = (key: keyof JobFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (status: "draft" | "active") => {
    if (!values.title.trim()) {
      toast.error("Job title is required");
      return;
    }
    setSaving(status);
    try {
      await onSubmit(values, status);
      toast.success(status === "active" ? "Job published" : "Draft saved");
      router.push("/employer/jobs");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save job");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card className="space-y-5 max-w-3xl">
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Job Title" value={values.title} onChange={set("title")} placeholder="e.g. Frontend Developer" />
        <Field label="Company Name" value={values.companyName} onChange={set("companyName")} />
        <Field label="Location" value={values.location} onChange={set("location")} placeholder="e.g. Chennai, Remote" />
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Job Type
          </label>
          <select
            value={values.jobType}
            onChange={set("jobType")}
            className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-[var(--text-main)]"
          >
            {jobTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <Field label="Experience" value={values.experience} onChange={set("experience")} placeholder="e.g. 2" />
        <Field label="Salary" value={values.salary} onChange={set("salary")} placeholder="e.g. 6-10 LPA" />
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
          Skills (comma separated)
        </label>
        <input
          value={values.skills}
          onChange={set("skills")}
          placeholder="React, TypeScript, Node.js"
          className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-[var(--text-main)]"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
          Description
        </label>
        <textarea
          rows={6}
          value={values.description}
          onChange={set("description")}
          className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-[var(--text-main)] resize-none"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
          Requirements
        </label>
        <textarea
          rows={4}
          value={values.requirements}
          onChange={set("requirements")}
          className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-[var(--text-main)] resize-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={() => handleSubmit("draft")}
          disabled={saving !== null}
          className="inline-flex items-center justify-center gap-2 border border-[var(--border-main)] text-[var(--text-main)] font-black uppercase tracking-widest text-xs px-5 py-3.5 rounded-xl hover:bg-[var(--bg-main)] transition-all active:scale-95 disabled:opacity-50"
        >
          <Save size={16} />
          {saving === "draft" ? "Saving..." : "Save as Draft"}
        </button>
        <button
          onClick={() => handleSubmit("active")}
          disabled={saving !== null}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs px-5 py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          <Send size={16} />
          {saving === "active" ? "Publishing..." : submitLabel}
        </button>
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
        {label}
      </label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-[var(--text-main)]"
      />
    </div>
  );
}
