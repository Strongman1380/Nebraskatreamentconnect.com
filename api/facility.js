import { json, methodNotAllowed } from './_utils.js'
import { getDb } from './_firebaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res)

  try {
    const { id } = req.query || {}
    if (!id) return json(res, 400, { error: 'id is required' })

    const db = getDb()
    const doc = await db.collection('facilities').doc(id).get()

    if (!doc.exists) return json(res, 404, { error: 'Facility not found' })
    if (!doc.data().active) return json(res, 404, { error: 'Facility not found' })

    return json(res, 200, { facility: { id: doc.id, ...doc.data() } })
  } catch (err) {
    console.error('facility error:', err?.message)
    return json(res, 500, { error: 'Failed to fetch facility' })
  }
}
