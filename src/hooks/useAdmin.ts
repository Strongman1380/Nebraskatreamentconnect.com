import { useState, useEffect, useCallback } from 'react'
import { getFirebaseAuth } from '../config/firebase'
import type { Provider } from '../types/facility'

async function authFetch(path: string, options: RequestInit = {}) {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Not authenticated')
  const token = await user.getIdToken()
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

export interface FacilityOption {
  id: string
  name1: string
  city: string
  active: boolean
}

export function useAdmin() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [facilities, setFacilities] = useState<FacilityOption[]>([])
  const [loading, setLoading] = useState(true)
  const [facilitiesLoading, setFacilitiesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProviders = useCallback(async () => {
    try {
      const data = await authFetch('/api/listProviders')
      setProviders(data.providers || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProviders() }, [loadProviders])

  const loadFacilities = useCallback(async (search?: string) => {
    setFacilitiesLoading(true)
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}` : ''
      const data = await authFetch(`/api/listFacilitiesAdmin${qs}`)
      setFacilities(data.facilities || [])
    } catch {
      // Non-fatal for facility search
    } finally {
      setFacilitiesLoading(false)
    }
  }, [])

  const createProvider = useCallback(async (params: {
    email: string
    password: string
    displayName: string
    facilityId: string
  }) => {
    await authFetch('/api/createUser', {
      method: 'POST',
      body: JSON.stringify(params),
    })
    await loadProviders()
  }, [loadProviders])

  const updateProvider = useCallback(async (uid: string, updates: {
    facilityId?: string
    active?: boolean
    displayName?: string
  }) => {
    await authFetch('/api/updateProvider', {
      method: 'PATCH',
      body: JSON.stringify({ uid, ...updates }),
    })
    await loadProviders()
  }, [loadProviders])

  const deactivateProvider = useCallback(async (uid: string) => {
    await authFetch('/api/deleteUser', {
      method: 'DELETE',
      body: JSON.stringify({ uid }),
    })
    await loadProviders()
  }, [loadProviders])

  return {
    providers,
    facilities,
    loading,
    facilitiesLoading,
    error,
    loadFacilities,
    createProvider,
    updateProvider,
    deactivateProvider,
  }
}
