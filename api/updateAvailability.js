import { json, methodNotAllowed, readJson } from './_utils.js'
import { requireProviderAuth } from './_auth.js'
import { getDb } from './_firebaseAdmin.js'
import admin from 'firebase-admin'

const VALID_STATUSES = ['Open', 'Waitlist', 'Closed', 'N/A']

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res)

  const decoded = await requireProviderAuth(req, res)
  if (!decoded) return

  try {
    const { programKey, status, facilityId: bodyFacilityId } = await readJson(req)

    if (!programKey) return json(res, 400, { error: 'programKey is required' })
    if (!VALID_STATUSES.includes(status)) {
      return json(res, 400, { error: `status must be one of: ${VALID_STATUSES.join(', ')}` })
    }

    const db = getDb()

    // Admins can pass facilityId explicitly; providers use their linked facility
    const facilityId = decoded._isAdmin ? (bodyFacilityId || decoded._facilityId) : decoded._facilityId
    if (!facilityId) return json(res, 400, { error: 'No facility linked to this account' })

    const facilityRef = db.collection('facilities').doc(facilityId)
    const facilityDoc = await facilityRef.get()
    if (!facilityDoc.exists) return json(res, 404, { error: 'Facility not found' })

    const currentAvailability = facilityDoc.data().availability || {}
    const previousStatus = currentAvailability[programKey]

    // Update the specific program's availability
    await facilityRef.update({
      [`availability.${programKey}`]: status,
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdatedBy: decoded.uid,
    })

    // Write audit log entry
    await db.collection('availabilityLog').add({
      facilityId,
      providerUid: decoded.uid,
      changedAt: admin.firestore.FieldValue.serverTimestamp(),
      changes: {
        [programKey]: { from: previousStatus ?? 'N/A', to: status },
      },
    })

    const updatedAvailability = { ...currentAvailability, [programKey]: status }
    return json(res, 200, { ok: true, availability: updatedAvailability })
  } catch (err) {
    console.error('updateAvailability error:', err?.message)
    return json(res, 500, { error: err?.message || 'Failed to update availability' })
  }
}
