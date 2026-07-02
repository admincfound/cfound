"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getEmployerJob, updateEmployerJob, EmployerJob } from "../../../../../lib/employer/jobs";
import { PageHeader } from "../../../../../components/employer/UI";
import JobForm, { JobFormValues } from "../../JobForm";

export default function EditJobPage() {
  const params = useParams();
  const id = params?.id as string;
  const [job, setJob] = useState<EmployerJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getEmployerJob(id);
        if (!data) {
          setNotFound(true);
        } else {
          setJob(data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="text-sm text-[var(--text-muted)]">Loading job...</div>;
  }

  if (notFound || !job) {
    return <div className="text-sm text-[var(--text-muted)]">Job not found.</div>;
  }

  const initialValues: JobFormValues = {
    title: job.title || "",
    companyName: job.companyName || "",
    location: job.location || "",
    jobType: job.jobType || "full-time",
    experience: job.experience || "",
    salary: job.salary || "",
    description: job.description || "",
    requirements: job.requirements || "",
    skills: (job.skills || []).join(", "),
  };

  const handleSubmit = async (values: JobFormValues, status: "draft" | "active") => {
    await updateEmployerJob(id, {
      title: values.title,
      companyName: values.companyName,
      location: values.location,
      jobType: values.jobType,
      experience: values.experience,
      salary: values.salary,
      description: values.description,
      requirements: values.requirements,
      skills: values.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      status,
    });
  };

  return (
    <div>
      <PageHeader title="Edit Job" subtitle={job.title} />
      <JobForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Update & Publish" />
    </div>
  );
}
