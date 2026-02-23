import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { ErrorBanner } from '../common/ErrorBanner'
import type { FacilityOption } from '../../hooks/useAdmin'

interface CreateProviderModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: { email: string; password: string; displayName: string; facilityId: string }) => Promise<void>
  facilities: FacilityOption[]
  facilitiesLoading: boolean
  onSearchFacilities: (search: string) => void
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function CreateProviderModal({
  open, onClose, onSubmit, facilities, facilitiesLoading, onSearchFacilities,
}: CreateProviderModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [facilityId, setFacilityId] = useState('')
  const [facilitySearch, setFacilitySearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setEmail(''); setPassword(generatePassword()); setDisplayName('')
      setFacilityId(''); setFacilitySearch(''); setError(null); setSuccess(false)
    }
  }, [open])

  useEffect(() => {
    const timer = setTimeout(() => onSearchFacilities(facilitySearch), 300)
    return () => clearTimeout(timer)
  }, [facilitySearch, onSearchFacilities])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !facilityId) {
      setError('Email, password, and facility are required.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({ email, password, displayName, facilityId })
      setSuccess(true)
      setTimeout(() => { onClose() }, 1500)
    } catch (err) {
      setError((err as Error).message || 'Failed to create provider')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedFacility = facilities.find(f => f.id === facilityId)

  return (
    <Modal open={open} onClose={onClose} title="Create Provider Account" maxWidth="max-w-xl">
      {success ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-semibold text-gray-900">Provider account created!</p>
          <p className="text-sm text-gray-500 mt-1">Send the credentials to the facility contact.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorBanner message={error} />}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Facility contact name (optional)"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="provider@facility.org"
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temporary Password <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => setPassword(generatePassword())}>
                Generate
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Share this with the provider. They should change it after first login.</p>
          </div>

          {/* Facility picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facility <span className="text-red-500">*</span>
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={facilitySearch}
                onChange={e => { setFacilitySearch(e.target.value); setFacilityId('') }}
                placeholder="Search facilities..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {selectedFacility && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800 mb-2">
                ✓ {selectedFacility.name1} — {selectedFacility.city}
              </div>
            )}

            {facilitySearch && !selectedFacility && (
              <div className="border border-gray-200 rounded-lg max-h-44 overflow-y-auto">
                {facilitiesLoading ? (
                  <div className="px-3 py-3 text-sm text-gray-400 text-center">Loading...</div>
                ) : facilities.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-gray-400 text-center">No facilities found</div>
                ) : (
                  facilities.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => { setFacilityId(f.id); setFacilitySearch(f.name1) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{f.name1}</div>
                      <div className="text-xs text-gray-500">{f.city}, NE</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" fullWidth disabled={submitting || !facilityId}>
              {submitting ? 'Creating...' : 'Create Provider'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
