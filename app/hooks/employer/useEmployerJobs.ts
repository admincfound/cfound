"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { EmployerJob } from "../../lib/employer/jobs";

export function useEmployerJobs(employerId?: string | null) {
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employerId) {
      setJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "careers"),
      where("employerId", "==", employerId),
      where("type", "==", "job")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as EmployerJob[];
        data.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        setJobs(data);
        setLoading(false);
      },
      (err) => {
        console.error("useEmployerJobs error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [employerId]);

  return { jobs, loading };
}
