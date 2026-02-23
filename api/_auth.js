import { json } from './_utils.js'
import { getAuth, getDb } from './_firebaseAdmin.js'

const FALLBACK_ADMIN_EMAILS = []

function getBearerToken(req) {
  const header = req.headers?.authorization || ''
  const match = /^Bearer\s+(.*)$/i.exec(header)
  return match?.[1] || null
}

function getAdminEmails() {
  const raw = String(process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return raw.length ? raw : FALLBACK_ADMIN_EMAILS
}

function isAdmin(email) {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}

/**
 * Verify Firebase ID token. Any authenticated user is authorized.
 * Attaches _isAdmin flag to the decoded token.
 */
export async function requireAuth(req, res) {
  const token = getBearerToken(req)
  if (!token) {
    json(res, 401, { error: 'Missing Authorization bearer token' })
    return null
  }

  try {
    const auth = getAuth()
    const decoded = await auth.verifyIdToken(token)
    decoded._isAdmin = isAdmin(decoded.email)
    return decoded
  } catch (err) {
    const msg = err?.message || ''
    if (msg.includes('credential') || msg.includes('FIREBASE') || msg.includes('default credentials')) {
      console.error('Firebase Admin init error:', msg)
      json(res, 500, { error: 'Server auth configuration error' })
    } else {
      json(res, 401, { error: 'Invalid or expired token' })
    }
    return null
  }
}

/**
 * Require admin role (email in ADMIN_EMAILS env var).
 */
export async function requireAdminAuth(req, res) {
  const decoded = await requireAuth(req, res)
  if (!decoded) return null
  if (!decoded._isAdmin) {
    json(res, 403, { error: 'Admin access required' })
    return null
  }
  return decoded
}

/**
 * Require active provider: valid auth token + active providers/{uid} doc.
 * Returns decoded token with _facilityId attached.
 */
export async function requireProviderAuth(req, res) {
  const decoded = await requireAuth(req, res)
  if (!decoded) return null

  // Admins can also act as providers
  if (decoded._isAdmin) {
    decoded._facilityId = null
    return decoded
  }

  try {
    const db = getDb()
    const providerDoc = await db.collection('providers').doc(decoded.uid).get()
    if (!providerDoc.exists) {
      json(res, 403, { error: 'No provider account found' })
      return null
    }
    const providerData = providerDoc.data()
    if (!providerData.active) {
      json(res, 403, { error: 'Provider account is inactive' })
      return null
    }
    decoded._facilityId = providerData.facilityId
    return decoded
  } catch (err) {
    console.error('requireProviderAuth error:', err?.message)
    json(res, 500, { error: 'Failed to verify provider access' })
    return null
  }
}
