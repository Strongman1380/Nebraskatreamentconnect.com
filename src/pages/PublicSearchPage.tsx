import { useSearchParams } from 'react-router-dom'
import { SearchBar } from '../components/search/SearchBar'
import { FilterPanel } from '../components/search/FilterPanel'
import { FacilityGrid } from '../components/results/FacilityGrid'
import { useFacilities } from '../hooks/useFacilities'
import { ErrorBanner } from '../components/common/ErrorBanner'
import type { SearchFilters } from '../types/facility'

function parseFilters(params: URLSearchParams): SearchFilters {
  return {
    search: params.get('search') || '',
    county: params.get('county') || '',
    city: params.get('city') || '',
    facilityType: params.get('facilityType') || '',
    programs: params.getAll('programs[]'),
    populations: params.getAll('populations[]'),
    insurance: params.getAll('insurance[]'),
  }
}

function filtersToParams(filters: SearchFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.county) p.set('county', filters.county)
  if (filters.city) p.set('city', filters.city)
  if (filters.facilityType) p.set('facilityType', filters.facilityType)
  filters.programs.forEach(v => p.append('programs[]', v))
  filters.populations.forEach(v => p.append('populations[]', v))
  filters.insurance.forEach(v => p.append('insurance[]', v))
  return p
}

export function PublicSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseFilters(searchParams)

  const { facilities, pagination, loading, error, setPage } = useFacilities(filters)

  const updateFilters = (newFilters: SearchFilters) => {
    setSearchParams(filtersToParams(newFilters), { replace: true })
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Find Treatment in Nebraska</h1>
          <p className="text-blue-200 text-lg mb-8">
            Search hundreds of substance use, mental health, and recovery service providers.
          </p>
          <div className="max-w-2xl mx-auto">
            <SearchBar
              value={filters.search}
              onChange={search => updateFilters({ ...filters, search })}
            />
          </div>

          {/* Quick type filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {[
              { label: 'Substance Use', value: 'SU' },
              { label: 'Mental Health', value: 'MH' },
              { label: 'MAT / Buprenorphine', value: 'BUPREN' },
              { label: 'Opioid Treatment', value: 'OTP' },
              { label: 'Community Health', value: 'HRSA' },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => updateFilters({
                  ...filters,
                  facilityType: filters.facilityType === value ? '' : value,
                })}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                  filters.facilityType === value
                    ? 'bg-white text-blue-900 border-white'
                    : 'bg-transparent text-blue-200 border-blue-400 hover:border-white hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <ErrorBanner message={error} className="mb-6" />}
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-72 shrink-0">
            <FilterPanel filters={filters} onChange={updateFilters} />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <FacilityGrid
              facilities={facilities}
              pagination={pagination}
              loading={loading}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
