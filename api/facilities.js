import { json, methodNotAllowed } from './_utils.js'
import { getDb } from './_firebaseAdmin.js'

const PAGE_SIZE = 24

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res)

  try {
    const db = getDb()
    const {
      county,
      city,
      search,
      facilityType,
      page = '1',
    } = req.query || {}

    // Multi-value query params (arrays sent as repeated keys or comma-separated)
    const parseList = (val) => {
      if (!val) return []
      if (Array.isArray(val)) return val.filter(Boolean)
      return val.split(',').filter(Boolean)
    }

    const programs = parseList(req.query['programs[]'] || req.query.programs)
    const populations = parseList(req.query['populations[]'] || req.query.populations)
    const insurance = parseList(req.query['insurance[]'] || req.query.insurance)

    let query = db.collection('facilities').where('active', '==', true)

    // Firestore only supports one inequality filter per query
    // So we apply simple equality filters in Firestore, do the rest client-side
    if (county) {
      query = query.where('county', '==', county)
    } else if (city) {
      query = query.where('city', '==', city)
    }

    if (facilityType) {
      query = query.where('facilityTypes', 'array-contains', facilityType)
    }

    // For program/population/insurance filters, Firestore array-contains only supports one at a time.
    // If exactly one filter is selected use Firestore; otherwise filter in memory.
    if (programs.length === 1 && populations.length === 0 && insurance.length === 0 && !facilityType) {
      query = query.where(`programs.${programs[0]}`, '==', true)
    }

    query = query.orderBy('name1').limit(500)

    const snapshot = await query.get()
    let facilities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // In-memory filters for complex multi-filter scenarios
    if (programs.length > 1 || (programs.length === 1 && (populations.length > 0 || insurance.length > 0))) {
      facilities = facilities.filter(f =>
        programs.every(p => f.programs?.[p] === true)
      )
    }
    if (populations.length > 0) {
      facilities = facilities.filter(f =>
        populations.every(p => f.populations?.[p] === true)
      )
    }
    if (insurance.length > 0) {
      facilities = facilities.filter(f =>
        insurance.every(i => f.insurance?.[i] === true)
      )
    }

    // Text search across name, city, county
    if (search) {
      const q = search.toLowerCase().trim()
      facilities = facilities.filter(f => {
        const keywords = f.searchKeywords || []
        return (
          f.name1?.toLowerCase().includes(q) ||
          f.name2?.toLowerCase().includes(q) ||
          f.city?.toLowerCase().includes(q) ||
          f.county?.toLowerCase().includes(q) ||
          keywords.some(k => k.includes(q))
        )
      })
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1)
    const total = facilities.length
    const totalPages = Math.ceil(total / PAGE_SIZE)
    const start = (pageNum - 1) * PAGE_SIZE
    const paginated = facilities.slice(start, start + PAGE_SIZE)

    return json(res, 200, {
      facilities: paginated,
      pagination: { page: pageNum, totalPages, total, pageSize: PAGE_SIZE },
    })
  } catch (err) {
    console.error('facilities error:', err?.message)
    return json(res, 500, { error: 'Failed to fetch facilities' })
  }
}
