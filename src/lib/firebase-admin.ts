import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import 'dotenv/config';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.PROJECT_ID as string,
      clientEmail: process.env.CLIENT_EMAIL as string,
      privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}


export const adminDb = getFirestore(
  undefined,
  "ai-studio-24810410-2d44-4bca-af7d-11572783e2b5"
);