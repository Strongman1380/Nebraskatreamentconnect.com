import { json, methodNotAllowed } from './_utils.js'
import { requireProviderAuth } from './_auth.js'
import { getDb } from './_firebaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res)

  const decoded = await requireProviderAuth(req, res)
  if (!decoded) return

  try {
    const db = getDb()
    const facilityId = decoded._facilityId

    if (!facilityId) {
      return json(res, 404, { error: 'No facility linked to this provider account' })
    }

    const doc = await db.collection('facilities').doc(facilityId).get()
    if (!doc.exists) return json(res, 404, { error: 'Facility not found' })

    return json(res, 200, { facility: { id: doc.id, ...doc.data() } })
  } catch (err) {
    console.error('providerFacility error:', err?.message)
    return json(res, 500, { error: 'Failed to fetch facility' })
  }
}
