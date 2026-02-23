import { useState, useEffect } from 'react'
import { getFirebaseDb } from '../config/firebase'
import type { Facility } from '../types/facility'

interface UseFacilityResult {
  facility: Facility | null
  loading: boolean
  error: string | null
}

export function useFacility(id: string | undefined): UseFacilityResult {
  const [facility, setFacility] = useState<Facility | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('No facility ID provided')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const db = getFirebaseDb()
      // Use Firestore real-time listener so availability updates appear live
      const unsubscribe = db.collection('facilities').doc(id).onSnapshot(
        snap => {
          if (!snap.exists) {
            setError('Facility not found')
            setFacility(null)
          } else {
            setFacility({ id: snap.id, ...snap.data() } as Facility)
          }
          setLoading(false)
        },
        err => {
          console.error('useFacility snapshot error:', err)
          setError('Failed to load facility details')
          setLoading(false)
        }
      )
      return unsubscribe
    } catch (err) {
      setError((err as Error).message || 'Failed to load facility')
      setLoading(false)
    }
  }, [id])

  return { facility, loading, error }
}
