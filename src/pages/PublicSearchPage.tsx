import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
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
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-teal-900 text-white py-16 sm:py-20 px-4">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-blue-200 mb-6 border border-white/10">
            <Search className="w-3.5 h-3.5" />
            306 treatment facilities across Nebraska
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
            Find Treatment in Nebraska
          </h1>
          <p className="text-blue-200/80 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Search substance use, mental health, and recovery service providers statewide.
          </p>

          <div className="max-w-2xl mx-auto">
            <SearchBar
              value={filters.search}
              onChange={search => updateFilters({ ...filters, search })}
            />
          </div>

          {/* Quick type filters */}
          <div className="flex flex-wrap justify-center gap-2.5 mt-6">
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
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  filters.facilityType === value
                    ? 'bg-white text-blue-900 border-white shadow-lg shadow-white/20'
                    : 'bg-white/5 text-blue-100 border-white/20 hover:bg-white/10 hover:border-white/40'
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

        <div className="lg:flex lg:gap-8">
          {/* Sidebar - hidden on mobile, toggle handled inside FilterPanel */}
          <aside className="lg:w-72 lg:shrink-0">
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
