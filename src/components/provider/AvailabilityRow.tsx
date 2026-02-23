import { CheckCircle, Loader2 } from 'lucide-react'
import type { ProgramKey, AvailabilityStatus } from '../../types/facility'
import { PROGRAM_LABELS } from '../../types/facility'

interface AvailabilityRowProps {
  programKey: ProgramKey
  status: AvailabilityStatus
  isUpdating: boolean
  onUpdate: (key: ProgramKey, status: AvailabilityStatus) => void
}

const STATUS_OPTIONS: AvailabilityStatus[] = ['Open', 'Waitlist', 'Closed', 'N/A']

const STATUS_CLASSES: Record<AvailabilityStatus, string> = {
  Open: 'text-green-700 bg-green-50 border-green-200',
  Waitlist: 'text-amber-700 bg-amber-50 border-amber-200',
  Closed: 'text-red-700 bg-red-50 border-red-200',
  'N/A': 'text-gray-500 bg-gray-50 border-gray-200',
}

export function AvailabilityRow({ programKey, status, isUpdating, onUpdate }: AvailabilityRowProps) {
  const label = PROGRAM_LABELS[programKey] || programKey

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 gap-4">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        {isUpdating && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
        <select
          value={status}
          onChange={e => onUpdate(programKey, e.target.value as AvailabilityStatus)}
          disabled={isUpdating}
          className={`text-sm font-medium border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${STATUS_CLASSES[status]} disabled:opacity-60`}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {!isUpdating && status !== 'N/A' && (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
      </div>
    </div>
  )
}
