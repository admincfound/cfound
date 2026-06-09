import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.project_id,
      clientEmail: process.env.client_email,
      privateKey: process.env.private_key?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminDb = admin.firestore();