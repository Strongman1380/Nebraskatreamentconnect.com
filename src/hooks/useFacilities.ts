import { useState, useEffect, useRef } from 'react'
import type { Facility, SearchFilters } from '../types/facility'

interface Pagination {
  page: number
  totalPages: number
  total: number
  pageSize: number
}

interface UseFacilitiesResult {
  facilities: Facility[]
  pagination: Pagination | null
  loading: boolean
  error: string | null
  page: number
  setPage: (p: number) => void
}

function buildQueryString(filters: SearchFilters, page: number): string {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.county) params.set('county', filters.county)
  if (filters.city) params.set('city', filters.city)
  if (filters.facilityType) params.set('facilityType', filters.facilityType)
  filters.programs.forEach(p => params.append('programs[]', p))
  filters.populations.forEach(p => params.append('populations[]', p))
  filters.insurance.forEach(i => params.append('insurance[]', i))
  params.set('page', String(page))
  return params.toString()
}

export function useFacilities(filters: SearchFilters): UseFacilitiesResult {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const pageRef = useRef(page)
  pageRef.current = page

  const filtersKey = JSON.stringify(filters)
  const prevFiltersKey = useRef(filtersKey)

  // Reset page to 1 when filters change
  useEffect(() => {
    if (prevFiltersKey.current !== filtersKey) {
      prevFiltersKey.current = filtersKey
      setPage(1)
    }
  }, [filtersKey])

  useEffect(() => {
    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller

    const delay = filters.search ? 400 : 0

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const qs = buildQueryString(filters, pageRef.current)
        const res = await fetch(`/api/facilities?${qs}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`Failed to fetch facilities: ${res.statusText}`)
        const data = await res.json()
        setFacilities(data.facilities || [])
        setPagination(data.pagination || null)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError((err as Error).message || 'Failed to load facilities')
        setFacilities([])
      } finally {
        setLoading(false)
      }
    }, delay)

    return () => {
      controller.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [filtersKey, page]) // eslint-disable-line react-hooks/exhaustive-deps

  return { facilities, pagination, loading, error, page, setPage }
}
