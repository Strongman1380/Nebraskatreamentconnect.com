#!/usr/bin/env node
/**
 * Creates the initial admin user in Firebase Authentication.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_JSON=$(cat /path/to/service-account.json) \
 *   node scripts/createAdmin.js
 */

import admin from 'firebase-admin'

const EMAIL = 'bhinrichs1380@gmail.com'
const PASSWORD = 'BAseBAll!#80'
const DISPLAY_NAME = 'Admin'

// ── Firebase init ──────────────────────────────────────────────
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!serviceAccountJson) {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT_JSON env var is required.')
  console.error('  FIREBASE_SERVICE_ACCOUNT_JSON=$(cat /path/to/key.json) node scripts/createAdmin.js')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
})

const auth = admin.auth()

// ── Create or update admin user ────────────────────────────────
async function main() {
  try {
    // Check if user already exists
    const existing = await auth.getUserByEmail(EMAIL).catch(() => null)

    if (existing) {
      console.log(`User ${EMAIL} already exists (uid: ${existing.uid}). Updating password...`)
      await auth.updateUser(existing.uid, {
        password: PASSWORD,
        displayName: DISPLAY_NAME,
      })
      console.log('Password updated successfully.')
    } else {
      const user = await auth.createUser({
        email: EMAIL,
        password: PASSWORD,
        displayName: DISPLAY_NAME,
        emailVerified: true,
      })
      console.log(`Admin user created: ${user.uid}`)
    }

    console.log(`\nAdmin account ready:`)
    console.log(`  Email:    ${EMAIL}`)
    console.log(`  Password: (as specified)`)
  } catch (err) {
    console.error('Failed to create admin user:', err.message)
    process.exit(1)
  }
}

main().then(() => process.exit(0))
