import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface EmployerCompany {
  uid: string;
  ownerEmail: string;
  companyName: string;
  logoUrl?: string;
  coverUrl?: string;
  website?: string;
  email?: string;
  phone?: string;
  description?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  verificationStatus?: 'unverified' | 'pending' | 'verified';
  role: 'employer';
  createdAt: string;
  updatedAt?: string;
}

// Fetch an employer's company profile by uid. Returns null if it doesn't exist yet.
export async function getEmployerProfile(uid: string): Promise<EmployerCompany | null> {
  const ref = doc(db, 'employers', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as EmployerCompany;
}

// Creates a blank employer company profile the first time a new employer signs in.
export async function createEmployerProfile(
  uid: string,
  email: string,
  displayName?: string
): Promise<EmployerCompany> {
  const newCompany: EmployerCompany = {
    uid,
    ownerEmail: email,
    companyName: displayName || 'My Company',
    role: 'employer',
    verificationStatus: 'unverified',
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'employers', uid), newCompany, { merge: true });
  return newCompany;
}

// Ensures an employer document exists, creating one if necessary.
export async function ensureEmployerProfile(
  uid: string,
  email: string,
  displayName?: string
): Promise<EmployerCompany> {
  const existing = await getEmployerProfile(uid);
  if (existing) return existing;
  return createEmployerProfile(uid, email, displayName);
}

export async function updateEmployerProfile(
  uid: string,
  data: Partial<EmployerCompany>
): Promise<void> {
  await updateDoc(doc(db, 'employers', uid), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}
