"use client";

import { useAuth } from "../../../../context/AuthContext";
import { useEmployerAuth } from "../../../../context/employer/EmployerAuthContext";
import { createEmployerJob } from "../../../../lib/employer/jobs";
import { PageHeader } from "../../../../components/employer/UI";
import JobForm, { JobFormValues } from "../JobForm";

export default function NewJobPage() {
  const { user } = useAuth();
  const { company } = useEmployerAuth();

  const initialValues: JobFormValues = {
    title: "",
    companyName: company?.companyName || "",
    location: company?.location || "",
    jobType: "full-time",
    experience: "",
    salary: "",
    description: "",
    requirements: "",
    skills: "",
  };

  const handleSubmit = async (values: JobFormValues, status: "draft" | "active") => {
    if (!user) return;
    await createEmployerJob(user.uid, {
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
      <PageHeader title="Post a Job" subtitle="Fill in the details for your new job listing." />
      <JobForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Publish Job" />
    </div>
  );
}
