import { Link } from 'react-router-dom'
import { MapPin, Phone, Globe, Clock, ExternalLink } from 'lucide-react'
import { useProviderFacility } from '../hooks/useProviderFacility'
import { AvailabilityRow } from '../components/provider/AvailabilityRow'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ErrorBanner } from '../components/common/ErrorBanner'
import type { ProgramKey, AvailabilityStatus } from '../types/facility'

function formatTimestamp(ts: unknown): string {
  if (!ts) return 'Not yet updated'
  const date = ts && typeof (ts as { toDate?: () => Date }).toDate === 'function'
    ? (ts as { toDate: () => Date }).toDate()
    : new Date(ts as string)
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export function ProviderDashboardPage() {
  const { facility, loading, error, updating, updateAvailability, updateError } = useProviderFacility()

  if (loading) return <LoadingSpinner className="min-h-screen" />

  if (error || !facility) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <ErrorBanner message={error || 'Could not load your facility.'} />
      </div>
    )
  }

  const address = [facility.street1, facility.city, facility.state, facility.zip].filter(Boolean).join(', ')
  const availabilityEntries = Object.entries(facility.availability || {}) as [ProgramKey, AvailabilityStatus][]

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-blue-300 text-sm mb-1">Provider Dashboard</p>
              <h1 className="text-2xl font-bold">{facility.name1}</h1>
              {facility.name2 && <p className="text-blue-200 mt-1">{facility.name2}</p>}
            </div>
            <Link
              to={`/facility/${facility.id}`}
              target="_blank"
              className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm border border-blue-600 rounded-lg px-3 py-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View public listing
            </Link>
          </div>

          <div className="flex flex-wrap gap-5 mt-4 text-sm text-blue-200">
            {address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {address}
              </span>
            )}
            {facility.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <a href={`tel:${facility.phone}`} className="hover:text-white">{facility.phone}</a>
              </span>
            )}
            {facility.website && (
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <a href={facility.website} target="_blank" rel="noreferrer" className="hover:text-white">Website</a>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {updateError && <ErrorBanner message={updateError} className="mb-5" />}

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Availability Status</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Update the availability of each program at your facility. Changes are visible to the public immediately.
              </p>
            </div>
            {!!facility.lastUpdatedAt && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                Last updated: {formatTimestamp(facility.lastUpdatedAt)}
              </div>
            )}
          </div>

          <div className="px-6 py-2">
            {availabilityEntries.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                No programs are listed for this facility. Contact your administrator.
              </p>
            ) : (
              availabilityEntries.map(([key, status]) => (
                <AvailabilityRow
                  key={key}
                  programKey={key}
                  status={status}
                  isUpdating={updating === key}
                  onUpdate={updateAvailability}
                />
              ))
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <p className="text-xs text-gray-500">
              <strong>Open</strong> — accepting new clients · <strong>Waitlist</strong> — accepting wait list entries · <strong>Closed</strong> — not accepting referrals · <strong>N/A</strong> — not tracked / unknown
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
