import { json, methodNotAllowed } from './_utils.js'
import { requireAdminAuth } from './_auth.js'
import { getDb } from './_firebaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res)

  const decoded = await requireAdminAuth(req, res)
  if (!decoded) return

  try {
    const db = getDb()
    const { search } = req.query || {}

    let query = db.collection('facilities').orderBy('name1').limit(200)

    const snapshot = await query.get()
    let facilities = snapshot.docs.map(doc => ({
      id: doc.id,
      name1: doc.data().name1,
      name2: doc.data().name2,
      city: doc.data().city,
      state: doc.data().state,
      county: doc.data().county,
      active: doc.data().active,
    }))

    // Client-side search filter for the admin facility picker
    if (search) {
      const q = search.toLowerCase()
      facilities = facilities.filter(f =>
        f.name1?.toLowerCase().includes(q) ||
        f.name2?.toLowerCase().includes(q) ||
        f.city?.toLowerCase().includes(q) ||
        f.county?.toLowerCase().includes(q)
      )
    }

    return json(res, 200, { facilities })
  } catch (err) {
    console.error('listFacilitiesAdmin error:', err?.message)
    return json(res, 500, { error: 'Failed to list facilities' })
  }
}
