import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/common/Button'
import { ErrorBanner } from '../components/common/ErrorBanner'

export function LoginPage() {
  const { signIn, role, loading, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (!loading) {
      if (role === 'admin') navigate('/admin', { replace: true })
      else if (role === 'provider') navigate('/provider', { replace: true })
    }
  }, [role, loading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setLocalError('Email and password are required.')
      return
    }
    setLocalError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      // onAuthStateChanged will update role → useEffect above redirects
    } catch (err) {
      const msg = (err as Error).message || 'Sign in failed'
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setLocalError('Invalid email or password.')
      } else {
        setLocalError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-900 rounded-2xl mb-4">
            <Heart className="w-7 h-7 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Provider Login</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Sign in to update your facility's availability
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {(localError || error) && (
            <ErrorBanner message={localError || error || ''} className="mb-5" />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              fullWidth
              size="lg"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Don't have an account? Contact your administrator to request access.
        </p>
      </div>
    </main>
  )
}
