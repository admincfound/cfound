import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface EmployerJob {
  id?: string;
  employerId: string;
  title: string;
  companyName: string;
  location?: string;
  jobType?: 'full-time' | 'part-time' | 'freelance' | 'internship';
  experience?: string;
  salary?: string;
  description?: string;
  requirements?: string;
  skills?: string[];
  type: 'job';
  status: 'draft' | 'active' | 'closed';
  views?: number;
  applicantCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Jobs belonging only to this employer, newest first.
export async function getEmployerJobs(employerId: string): Promise<EmployerJob[]> {
  const q = query(
    collection(db, 'careers'),
    where('employerId', '==', employerId),
    where('type', '==', 'job')
  );
  const snap = await getDocs(q);
  const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as EmployerJob[];
  jobs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return jobs;
}

export async function getEmployerJob(id: string): Promise<EmployerJob | null> {
  const snap = await getDoc(doc(db, 'careers', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as EmployerJob;
}

export async function createEmployerJob(
  employerId: string,
  data: Partial<EmployerJob>
): Promise<string> {
  const ref = await addDoc(collection(db, 'careers'), {
    ...data,
    employerId,
    type: 'job',
    status: data.status || 'draft',
    views: 0,
    applicantCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateEmployerJob(id: string, data: Partial<EmployerJob>): Promise<void> {
  await updateDoc(doc(db, 'careers', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteEmployerJob(id: string): Promise<void> {
  await deleteDoc(doc(db, 'careers', id));
}

export async function setJobStatus(id: string, status: EmployerJob['status']): Promise<void> {
  await updateDoc(doc(db, 'careers', id), {
    status,
    updatedAt: new Date().toISOString(),
  });
}
