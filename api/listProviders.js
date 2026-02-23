import { json, methodNotAllowed } from './_utils.js'
import { requireAdminAuth } from './_auth.js'
import { getDb } from './_firebaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res)

  const decoded = await requireAdminAuth(req, res)
  if (!decoded) return

  try {
    const db = getDb()
    const snapshot = await db.collection('providers').orderBy('createdAt', 'desc').get()
    const providers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
    return json(res, 200, { providers })
  } catch (err) {
    console.error('listProviders error:', err?.message)
    return json(res, 500, { error: 'Failed to list providers' })
  }
}
