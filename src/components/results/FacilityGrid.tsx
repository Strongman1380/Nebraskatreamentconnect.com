import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="h-5 bg-gray-100 rounded-lg w-3/4 mb-3" />
            <div className="h-3 bg-gray-100 rounded-lg w-1/2 mb-3" />
            <div className="h-3 bg-gray-100 rounded-lg w-full mb-2" />
            <div className="flex gap-2 mb-4">
              <div className="h-6 bg-gray-100 rounded-md w-20" />
              <div className="h-6 bg-gray-100 rounded-md w-24" />
            </div>
            <div className="h-px bg-gray-100 mb-3" />
            <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  if (facilities.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-xl border border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-5">
          <Search className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No facilities found</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">Try adjusting your search terms or removing some filters to see more results.</p>
      </div>
    )
  }

  return (
    <div>
      {pagination && (
        <p className="text-sm text-gray-500 mb-5">
          Showing{' '}
          <span className="font-medium text-gray-700">
            {(pagination.page - 1) * pagination.pageSize + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)}
          </span>
          {' '}of{' '}
          <span className="font-medium text-gray-700">{pagination.total}</span> facilities
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {facilities.map(facility => (
          <FacilityCard key={facility.id} facility={facility} />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10 pb-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-sm text-gray-500 px-2 tabular-nums">
            Page <span className="font-medium text-gray-700">{pagination.page}</span> of <span className="font-medium text-gray-700">{pagination.totalPages}</span>
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
