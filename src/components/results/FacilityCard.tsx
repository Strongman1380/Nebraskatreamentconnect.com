import { Link } from 'react-router-dom'
import { MapPin, Phone, Globe, ChevronRight } from 'lucide-react'
import { ProgramBadge } from './ProgramBadge'
import { AvailabilityBadge } from './AvailabilityBadge'
import type { Facility, AvailabilityStatus } from '../../types/facility'
import { PROGRAM_LABELS, FACILITY_TYPE_LABELS } from '../../types/facility'

interface FacilityCardProps {
  facility: Facility
}

// Show the top programs offered by a facility
function getTopPrograms(facility: Facility): string[] {
  const programs = facility.programs || {}
  const keys = Object.entries(programs)
    .filter(([, v]) => v)
    .map(([k]) => k)
  return keys.slice(0, 4)
}

// Summarize overall availability from all tracked programs
function getOverallAvailability(facility: Facility): AvailabilityStatus | null {
  const availability = facility.availability || {}
  const statuses = Object.values(availability) as AvailabilityStatus[]
  if (!statuses.length) return null
  if (statuses.some(s => s === 'Open')) return 'Open'
  if (statuses.some(s => s === 'Waitlist')) return 'Waitlist'
  if (statuses.every(s => s === 'Closed')) return 'Closed'
  return 'N/A'
}

export function FacilityCard({ facility }: FacilityCardProps) {
  const topPrograms = getTopPrograms(facility)
  const overallStatus = getOverallAvailability(facility)
  const address = [facility.street1, facility.city, facility.state, facility.zip]
    .filter(Boolean)
    .join(', ')

  return (
    <Link
      to={`/facility/${facility.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all duration-150 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug">
            {facility.name1}
          </h3>
          {facility.name2 && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{facility.name2}</p>
          )}
        </div>
        {overallStatus && overallStatus !== 'N/A' && (
          <div className="shrink-0">
            <AvailabilityBadge status={overallStatus} size="sm" />
          </div>
        )}
      </div>

      {/* Address */}
      {address && (
        <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-3">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
          <span>{address}</span>
        </div>
      )}

      {/* Facility types */}
      {facility.facilityTypes?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {facility.facilityTypes.map(type => (
            <ProgramBadge
              key={type}
              label={FACILITY_TYPE_LABELS[type] || type}
              variant={type === 'MH' ? 'purple' : type === 'HRSA' ? 'teal' : 'blue'}
            />
          ))}
        </div>
      )}

      {/* Programs */}
      {topPrograms.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {topPrograms.map(key => (
            <ProgramBadge key={key} label={PROGRAM_LABELS[key as keyof typeof PROGRAM_LABELS] || key} variant="gray" />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {facility.phone && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Phone className="w-3 h-3" />
              {facility.phone}
            </span>
          )}
          {facility.website && (
            <span className="flex items-center gap-1 text-xs text-blue-600">
              <Globe className="w-3 h-3" />
              Website
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
      </div>
    </Link>
  )
}
