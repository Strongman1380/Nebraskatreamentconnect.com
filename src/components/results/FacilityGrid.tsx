import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FacilityCard } from './FacilityCard'
import type { Facility } from '../../types/facility'
import { Button } from '../common/Button'

interface Pagination {
  page: number
  totalPages: number
  total: number
  pageSize: number
}

interface FacilityGridProps {
  facilities: Facility[]
  pagination: Pagination | null
  loading: boolean
  onPageChange: (page: number) => void
}

export function FacilityGrid({ facilities, pagination, loading, onPageChange }: FacilityGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-full mb-2" />
            <div className="flex gap-2 mb-4">
              <div className="h-5 bg-gray-100 rounded w-20" />
              <div className="h-5 bg-gray-100 rounded w-24" />
            </div>
            <div className="h-px bg-gray-100 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  if (facilities.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No facilities found</h3>
        <p className="text-gray-500 text-sm">Try adjusting your search or removing some filters.</p>
      </div>
    )
  }

  return (
    <div>
      {pagination && (
        <p className="text-sm text-gray-500 mb-4">
          Showing {(pagination.page - 1) * pagination.pageSize + 1}–
          {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
          <strong className="text-gray-900">{pagination.total}</strong> facilities
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.map(facility => (
          <FacilityCard key={facility.id} facility={facility} />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="secondary"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-sm text-gray-600 px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
