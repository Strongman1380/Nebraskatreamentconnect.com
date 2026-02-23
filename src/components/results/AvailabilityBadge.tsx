import { CheckCircle, Clock, XCircle, MinusCircle } from 'lucide-react'
import type { AvailabilityStatus } from '../../types/facility'

interface AvailabilityBadgeProps {
  status: AvailabilityStatus
  label?: string
  size?: 'sm' | 'md'
}

const STATUS_CONFIG: Record<AvailabilityStatus, {
  icon: React.ComponentType<{ className?: string }>
  classes: string
  text: string
}> = {
  Open: { icon: CheckCircle, classes: 'bg-green-100 text-green-800 border-green-200', text: 'Open' },
  Waitlist: { icon: Clock, classes: 'bg-amber-100 text-amber-800 border-amber-200', text: 'Waitlist' },
  Closed: { icon: XCircle, classes: 'bg-red-100 text-red-800 border-red-200', text: 'Closed' },
  'N/A': { icon: MinusCircle, classes: 'bg-gray-100 text-gray-500 border-gray-200', text: 'Unknown' },
}

export function AvailabilityBadge({ status, label, size = 'md' }: AvailabilityBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['N/A']
  const Icon = config.icon
  const isSmall = size === 'sm'

  return (
    <span className={`inline-flex items-center gap-1 border rounded-full font-medium ${config.classes} ${isSmall ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
      <Icon className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {label ? `${label}: ${config.text}` : config.text}
    </span>
  )
}
