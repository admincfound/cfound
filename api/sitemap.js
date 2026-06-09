import { adminDb } from "../firebase-admin.js";

export default async function handler(req, res) {
  try {
    const test = await adminDb.listCollections();

    res.status(200).json({
      collections: test.map(c => c.id)
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
      code: err.code,
      stack: err.stack
    });
  }
}