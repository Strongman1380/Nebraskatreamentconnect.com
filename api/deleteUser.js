import { json, methodNotAllowed, readJson } from './_utils.js'
import { requireAdminAuth } from './_auth.js'
import { getDb } from './_firebaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return methodNotAllowed(res)

  const decoded = await requireAdminAuth(req, res)
  if (!decoded) return

  try {
    const { uid } = await readJson(req)
    if (!uid) return json(res, 400, { error: 'uid is required' })

    const db = getDb()
    // Soft-delete: set active=false (preserves audit trail)
    await db.collection('providers').doc(uid).update({ active: false })
    return json(res, 200, { ok: true })
  } catch (err) {
    console.error('deleteUser error:', err?.message)
    return json(res, 500, { error: err?.message || 'Failed to deactivate provider' })
  }
}
