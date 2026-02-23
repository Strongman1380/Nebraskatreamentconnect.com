import { useState, useEffect, useCallback } from 'react'
import { getFirebaseAuth } from '../config/firebase'
import type { Facility, ProgramKey, AvailabilityStatus } from '../types/facility'

interface UseProviderFacilityResult {
  facility: Facility | null
  loading: boolean
  error: string | null
  updating: string | null  // currently-updating programKey
  updateAvailability: (programKey: ProgramKey, status: AvailabilityStatus) => Promise<void>
  updateError: string | null
}

export function useProviderFacility(): UseProviderFacilityResult {
  const [facility, setFacility] = useState<Facility | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchFacility() {
      try {
        const user = getFirebaseAuth().currentUser
        if (!user) throw new Error('Not authenticated')
        const token = await user.getIdToken()
        const res = await fetch('/api/providerFacility', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to load facility')
        }
        const data = await res.json()
        if (!cancelled) {
          setFacility(data.facility)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message || 'Failed to load facility')
          setLoading(false)
        }
      }
    }

    fetchFacility()
    return () => { cancelled = true }
  }, [])

  const updateAvailability = useCallback(async (programKey: ProgramKey, status: AvailabilityStatus) => {
    if (!facility) return

    // Optimistic update
    const previous = facility.availability?.[programKey]
    setFacility(f => f ? {
      ...f,
      availability: { ...f.availability, [programKey]: status },
    } : f)
    setUpdating(programKey)
    setUpdateError(null)

    try {
      const user = getFirebaseAuth().currentUser
      if (!user) throw new Error('Not authenticated')
      const token = await user.getIdToken()
      const res = await fetch('/api/updateAvailability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ programKey, status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Update failed')
      }
    } catch (err) {
      // Revert on error
      setFacility(f => f ? {
        ...f,
        availability: { ...f.availability, [programKey]: previous ?? 'N/A' },
      } : f)
      setUpdateError((err as Error).message || 'Failed to update')
    } finally {
      setUpdating(null)
    }
  }, [facility])

  return { facility, loading, error, updating, updateAvailability, updateError }
}
