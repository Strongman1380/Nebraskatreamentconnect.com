import { json, methodNotAllowed, readJson } from './_utils.js'
import { getAuth, getDb } from './_firebaseAdmin.js'
import { requireAdminAuth } from './_auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res)

  const decoded = await requireAdminAuth(req, res)
  if (!decoded) return

  try {
    const { email, password, displayName, facilityId } = await readJson(req)
    if (!email || !password) return json(res, 400, { error: 'email and password are required' })
    if (!facilityId) return json(res, 400, { error: 'facilityId is required' })

    const auth = getAuth()
    const db = getDb()

    // Verify the facility exists
    const facilityDoc = await db.collection('facilities').doc(facilityId).get()
    if (!facilityDoc.exists) {
      return json(res, 404, { error: 'Facility not found' })
    }

    const userRecord = await auth.createUser({ email, password, displayName: displayName || email })

    // Write provider document
    await db.collection('providers').doc(userRecord.uid).set({
      email,
      displayName: displayName || email,
      facilityId,
      facilityName: facilityDoc.data().name1 || facilityId,
      createdAt: new Date(),
      createdBy: decoded.uid,
      active: true,
      lastLoginAt: null,
    })

    return json(res, 200, { ok: true, uid: userRecord.uid })
  } catch (err) {
    console.error('createUser error:', err?.message)
    return json(res, 500, { error: err?.message || 'User creation failed' })
  }
}
