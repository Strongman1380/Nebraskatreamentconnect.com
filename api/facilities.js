import { json, methodNotAllowed } from './_utils.js'
import { getDb } from './_firebaseAdmin.js'

const PAGE_SIZE = 24
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

let _cache = null
let _cacheAt = 0

async function getAllActiveFacilities() {
  const now = Date.now()
  if (_cache && now - _cacheAt < CACHE_TTL_MS) return _cache
  const db = getDb()
  const snapshot = await db.collection('facilities').where('active', '==', true).get()
  _cache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  _cacheAt = now
  return _cache
}

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

    // Fetch all active facilities (cached 5 min) — 325 docs, filter in memory
    let facilities = await getAllActiveFacilities()

    // In-memory filters
    if (county) facilities = facilities.filter(f => f.county === county)
    else if (city) facilities = facilities.filter(f => f.city === city)

    if (facilityType) {
      facilities = facilities.filter(f => Array.isArray(f.facilityTypes) && f.facilityTypes.includes(facilityType))
    }
    if (programs.length > 0) {
      facilities = facilities.filter(f => programs.every(p => f.programs?.[p] === true))
    }
    if (populations.length > 0) {
      facilities = facilities.filter(f => populations.every(p => f.populations?.[p] === true))
    }
    if (insurance.length > 0) {
      facilities = facilities.filter(f => insurance.every(i => f.insurance?.[i] === true))
    }

    // Sort in memory by name
    facilities.sort((a, b) => (a.name1 || '').localeCompare(b.name1 || ''))

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
    console.error('facilities error:', err?.message, err?.stack)
    return json(res, 500, { error: 'Failed to fetch facilities' })
  }
}
