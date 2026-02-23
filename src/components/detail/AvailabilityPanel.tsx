import { Clock } from 'lucide-react'
import { AvailabilityBadge } from '../results/AvailabilityBadge'
import type { Facility, AvailabilityStatus, ProgramKey } from '../../types/facility'
import { PROGRAM_LABELS } from '../../types/facility'

interface AvailabilityPanelProps {
  facility: Facility
}

function formatTimestamp(ts: unknown): string {
  if (!ts) return 'Unknown'
  // Firestore Timestamp has toDate()
  const date = ts && typeof (ts as { toDate?: () => Date }).toDate === 'function'
    ? (ts as { toDate: () => Date }).toDate()
    : new Date(ts as string)
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export function AvailabilityPanel({ facility }: AvailabilityPanelProps) {
  const entries = Object.entries(facility.availability || {}) as [ProgramKey, AvailabilityStatus][]

  if (entries.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-2">Availability</h2>
        <p className="text-sm text-gray-500">No availability information on record. Call the facility directly.</p>
      </div>
    )
  }

  const hasAnyUpdated = entries.some(([, s]) => s !== 'N/A')

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Current Availability</h2>
        {!!facility.lastUpdatedAt && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            Updated {formatTimestamp(facility.lastUpdatedAt)}
          </div>
        )}
      </div>

      {!hasAnyUpdated && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          The provider hasn't confirmed availability yet. Call to confirm openings.
        </p>
      )}

      <div className="divide-y divide-gray-100">
        {entries.map(([key, status]) => (
          <div key={key} className="flex items-center justify-between py-2.5">
            <span className="text-sm text-gray-700">
              {PROGRAM_LABELS[key] || key}
            </span>
            <AvailabilityBadge status={status} />
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
        Availability is self-reported by facilities and may change. Always call to confirm.
      </p>
    </div>
  )
}
