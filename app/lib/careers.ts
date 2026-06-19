import { adminDb } from './firebase-admin';

export async function getCareer(id: string): Promise<any> {
  const snap = await adminDb
    .collection('careers')
    .doc(id)
    .get();

  if (!snap.exists) {
    return null;
  }

  const data = snap.data();

  return JSON.parse(
    JSON.stringify({
      id: snap.id,
      ...data,
    })
  );
}