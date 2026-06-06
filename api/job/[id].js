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

const db = admin.firestore();

db.settings({
  databaseId: "ai-studio-24810410-2d44-4bca-af7d-11572783e2b5"
});

export default async function handler(req, res) {
  const { id } = req.query;

  const snap = await db.collection("careers").doc(id).get();

  if (!snap.exists) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.status(200).json({
    id: snap.id,
    ...snap.data(),
  });
}