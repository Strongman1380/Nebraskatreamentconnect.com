import { useState, useEffect, useCallback, useRef } from 'react'
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

  const fetchFacilities = useCallback(async (currentFilters: SearchFilters, currentPage: number) => {
    // Cancel previous request
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const qs = buildQueryString(currentFilters, currentPage)
      const res = await fetch(`/api/facilities?${qs}`, { signal: abortRef.current.signal })
      if (!res.ok) throw new Error(`Failed to fetch facilities: ${res.statusText}`)
      const data = await res.json()
      setFacilities(data.facilities || [])
      setPagination(data.pagination || null)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError((err as Error).message || 'Failed to load facilities')
    } finally {
      setLoading(false)
    }
  }, [])

  // Reset page when filters change (but not when page changes)
  const filtersKey = JSON.stringify({ ...filters })
  const prevFiltersKey = useRef(filtersKey)

  useEffect(() => {
    if (prevFiltersKey.current !== filtersKey) {
      prevFiltersKey.current = filtersKey
      setPage(1)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchFacilities(filters, page)
    }, filters.search ? 400 : 0)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [filtersKey, page, filters, fetchFacilities])

  // When page resets to 1, fetch immediately
  useEffect(() => {
    if (prevFiltersKey.current !== filtersKey) return
    fetchFacilities(filters, page)
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  return { facilities, pagination, loading, error, page, setPage }
}
