import admin from "firebase-admin";

export default async function handler(req, res) {
  try {
    res.status(200).json({
      project_id: !!process.env.project_id,
      client_email: !!process.env.client_email,
      private_key: !!process.env.private_key,
    });
  } catch (err) {
    res.status(500).send(String(err));
  }
}