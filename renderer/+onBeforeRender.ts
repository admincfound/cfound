import { doc, getDoc } from 'firebase/firestore'
import { db } from '../src/lib/firebase'

export async function onBeforeRender(pageContext) {
  const slug = pageContext.routeParams?.slug

  const id = slug?.split('-').slice(-1)[0]

  const snap = await getDoc(doc(db, 'careers', id))

  const job = snap.exists()
    ? { id: snap.id, ...snap.data() }
    : null

  return {
    pageContext: {
      job
    }
  }
}