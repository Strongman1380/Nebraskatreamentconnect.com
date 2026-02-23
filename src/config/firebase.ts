import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import 'firebase/compat/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
}

function isFirebaseConfigured(cfg: typeof firebaseConfig): boolean {
  if (!cfg) return false
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'] as const
  if (!required.every(k => Boolean(cfg[k]))) return false
  return !['YOUR_API_KEY', 'YOUR_PROJECT_ID', 'YOUR_AUTH_DOMAIN', 'YOUR_APP_ID']
    .some(placeholder => Object.values(cfg).includes(placeholder))
}

let _auth: firebase.auth.Auth | null = null
let _db: firebase.firestore.Firestore | null = null
let _initError: string | null = null

try {
  if (isFirebaseConfigured(firebaseConfig)) {
    firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig)
    _auth = firebase.auth()
    _db = firebase.firestore()
  } else {
    _initError = 'Firebase configuration is incomplete. Set VITE_FIREBASE_* environment variables.'
    console.warn(_initError)
  }
} catch (error) {
  _initError = (error as Error).message || 'Firebase initialization failed'
  console.error('Firebase init error:', error)
}

export function getFirebaseAuth(): firebase.auth.Auth {
  if (!_auth) throw new Error(_initError || 'Firebase not configured')
  return _auth
}

export function getFirebaseDb(): firebase.firestore.Firestore {
  if (!_db) throw new Error(_initError || 'Firebase not configured')
  return _db
}

export { firebase, firebaseConfig }
