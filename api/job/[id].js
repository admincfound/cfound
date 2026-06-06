export default async function handler(req, res) {
  const { id } = req.query;

  console.log("REQ ID:", id);

  const snap = await db.collection("careers").doc(id).get();

  console.log("EXISTS:", snap.exists);

  if (!snap.exists) {
    return res.status(404).json({
      error: "Job not found",
      requestedId: id
    });
  }

  res.status(200).json({
    id: snap.id,
    ...snap.data(),
  });
}