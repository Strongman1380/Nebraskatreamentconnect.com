import { json, methodNotAllowed } from './_utils.js'
import { requireAuth } from './_auth.js'
import { getDb } from './_firebaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res)

  const decoded = await requireAuth(req, res)
  if (!decoded) return

  let facilityId = null

  if (!decoded._isAdmin) {
    try {
      const db = getDb()
      const providerDoc = await db.collection('providers').doc(decoded.uid).get()
      if (providerDoc.exists && providerDoc.data().active) {
        facilityId = providerDoc.data().facilityId || null
      }
    } catch (err) {
      console.error('whoami provider lookup error:', err?.message)
    }
  }

  return json(res, 200, {
    uid: decoded.uid,
    email: decoded.email,
    isAdmin: decoded._isAdmin,
    facilityId,
  })
}
