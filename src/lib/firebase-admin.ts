// src/lib/firebase-admin.ts
import 'dotenv/config'; // ✅ Load .env automatically before anything else
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Optional: quick debug to check environment variables
console.log('Loaded project_id:', process.env.project_id?.slice(0,10) + '...'); 
console.log('Loaded client_email:', process.env.client_email);

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.project_id as string,
      clientEmail: process.env.client_email as string,
      privateKey: process.env.private_key?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = getFirestore(
  undefined,
  "ai-studio-24810410-2d44-4bca-af7d-11572783e2b5"
);