import { json, methodNotAllowed, readJson } from './_utils.js'
import { requireAdminAuth } from './_auth.js'
import { getDb } from './_firebaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return methodNotAllowed(res)

  const decoded = await requireAdminAuth(req, res)
  if (!decoded) return

  try {
    const { uid, facilityId, active, displayName } = await readJson(req)
    if (!uid) return json(res, 400, { error: 'uid is required' })

    const db = getDb()
    const updates = {}

    if (facilityId !== undefined) {
      // Verify facility exists
      const facilityDoc = await db.collection('facilities').doc(facilityId).get()
      if (!facilityDoc.exists) return json(res, 404, { error: 'Facility not found' })
      updates.facilityId = facilityId
      updates.facilityName = facilityDoc.data().name1 || facilityId
    }

    if (active !== undefined) updates.active = Boolean(active)
    if (displayName !== undefined) updates.displayName = displayName

    if (Object.keys(updates).length === 0) {
      return json(res, 400, { error: 'No fields to update' })
    }

    await db.collection('providers').doc(uid).update(updates)
    return json(res, 200, { ok: true })
  } catch (err) {
    console.error('updateProvider error:', err?.message)
    return json(res, 500, { error: err?.message || 'Failed to update provider' })
  }
}
