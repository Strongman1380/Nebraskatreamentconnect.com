/**
 * Nebraska Treatment Connect - Facility Import Script
 *
 * Reads 5 CSV files from the Treatment folder, deduplicates by name+city+zip,
 * merges rows, and uploads to Firestore.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_JSON=$(cat /path/to/service-account.json) \
 *   FIREBASE_PROJECT_ID=your-project-id \
 *   node scripts/importFacilities.js [--dry-run] [--dir <path>]
 */

import { createReadStream, existsSync } from 'fs'
import { readdir, writeFile } from 'fs/promises'
import { join, resolve } from 'path'
import { parse } from 'csv-parse'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import admin from 'firebase-admin'

const __dirname = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const dirIdx = args.indexOf('--dir')
const DATA_DIR = dirIdx !== -1
  ? resolve(args[dirIdx + 1])
  : resolve(__dirname, '../../Old Applications/Nebraska Treatment Connect/Treatment')

// ─── Firebase Init ────────────────────────────────────────────────────────────
function initFirebase() {
  if (admin.apps.length) return admin.app()
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (json) {
    return admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) })
  }
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (projectId) {
    return admin.initializeApp({ projectId })
  }
  return admin.initializeApp({ credential: admin.credential.applicationDefault() })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function flag(row, col) {
  return row[col] === '1' || row[col] === 1
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

function titleCase(str) {
  if (!str) return ''
  return str.trim().split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function dedupArray(arr) {
  return [...new Set(arr.filter(Boolean))]
}

function buildSearchKeywords(row) {
  const words = [
    row.name1, row.name2, row.city, row.county, row.state, row.zip,
  ]
  const expanded = words
    .flatMap(w => (w ? w.toLowerCase().split(/\s+/) : []))
    .filter(w => w.length > 1)
  return dedupArray(expanded)
}

// ─── CSV Column → Firestore Mapping ──────────────────────────────────────────
function mapRow(row) {
  return {
    // Identity
    name1: (row.name1 || '').trim(),
    name2: (row.name2 || '').trim(),
    street1: (row.street1 || '').trim(),
    street2: (row.street2 || '').trim(),
    city: (row.city || '').trim(),
    state: (row.state || 'NE').trim(),
    zip: (row.zip || '').trim(),
    county: titleCase(row.county || ''),
    phone: (row.phone || '').trim(),
    website: (row.website || '').trim(),
    latitude: parseFloat(row.latitude) || null,
    longitude: parseFloat(row.longitude) || null,
    facilityType: (row.type_facility || '').trim(),

    // Programs
    programs: {
      residentialTreatment: flag(row, 'res'),
      outpatientTreatment: flag(row, 'op'),
      intensiveOutpatient: flag(row, 'iop'),
      detoxification: flag(row, 'dt'),
      medAssistedTreatment: flag(row, 'moa'),
      otpMethadone: flag(row, 'otp'),
      partialHospitalization: flag(row, 'hid'),
      groupHome: flag(row, 'gh'),
      telehealth: flag(row, 'tele'),
      hospitalInpatient: flag(row, 'inpe'),
      shortTermResidential: flag(row, 'rs'),
      longTermResidential: flag(row, 'rl'),
      outpatientDetox: flag(row, 'od'),
    },

    // Substances / MAT specifics
    substances: {
      buprenorphine: flag(row, 'bup') || flag(row, 'bupren'),
      naltrexone: flag(row, 'nxn'),
      vivitrol: flag(row, 'vtrl'),
      noOpioidPrescribed: flag(row, 'noop'),
    },

    // Populations
    populations: {
      veterans: flag(row, 'vet'),
      activeMilitary: flag(row, 'admil'),
      criminalJustice: flag(row, 'cj'),
      seniors: flag(row, 'sen'),
      adolescents: flag(row, 'adol'),
      pregnantWomen: flag(row, 'pw'),
      womenOnly: flag(row, 'wn'),
      menOnly: flag(row, 'mn'),
      hivAids: flag(row, 'hiv'),
      trauma: flag(row, 'trma'),
      domesticViolence: flag(row, 'dv'),
      youngAdults: flag(row, 'ya'),
      lgbtq: flag(row, 'tgd'),
      nativeAmerican: flag(row, 'ico'),
      dui: flag(row, 'dui'),
    },

    // Insurance / Payment
    insurance: {
      medicaid: flag(row, 'md'),
      medicare: flag(row, 'mc'),
      privateInsurance: flag(row, 'pi'),
      cashSelfPay: flag(row, 'cash'),
      tricare: flag(row, 'tricare'),
      slidingScale: flag(row, 'ss'),
      stateInsurance: flag(row, 'si'),
      socialSecurity: flag(row, 'ss2') || flag(row, 'ssi'),
      paymentAssistance: flag(row, 'pa'),
    },

    // Accreditation
    accreditation: {
      jointCommission: flag(row, 'jc'),
      carf: flag(row, 'carf'),
      ncqa: flag(row, 'ncqa'),
      coa: flag(row, 'coa'),
      hfap: flag(row, 'hfap'),
    },

    // Languages
    languages: {
      spanish: flag(row, 'sp'),
      asl: flag(row, 'asl'),
    },

    // Therapies
    therapies: {
      cbt: flag(row, 'cbt'),
      dbt: flag(row, 'dbt'),
      caseManagement: flag(row, 'cm'),
      peerSupport: flag(row, 'peer'),
      familyCounseling: flag(row, 'fco'),
      groupCounseling: flag(row, 'gco'),
      individualCounseling: flag(row, 'ico2') || flag(row, 'ico'),
      traumaCounseling: flag(row, 'trc'),
    },

    // Capacity
    capacity: {
      totalBeds: parseInt(row.beds) || null,
      adultBeds: parseInt(row.adlt) || null,
      femaleBeds: parseInt(row.fem) || null,
      maleBeds: parseInt(row.male) || null,
    },
  }
}

// ─── Merge duplicate rows ─────────────────────────────────────────────────────
function mergeRows(rows) {
  const base = mapRow(rows[0])
  const types = new Set()

  for (const row of rows) {
    types.add((row.type_facility || '').trim())

    const mapped = mapRow(row)
    // OR-merge all boolean groups
    for (const group of ['programs', 'substances', 'populations', 'insurance', 'accreditation', 'languages', 'therapies']) {
      for (const key of Object.keys(mapped[group])) {
        if (mapped[group][key]) base[group][key] = true
      }
    }
    // Max-merge numeric capacity
    for (const key of Object.keys(mapped.capacity)) {
      if (mapped.capacity[key] !== null) {
        base.capacity[key] = Math.max(base.capacity[key] || 0, mapped.capacity[key])
      }
    }
  }

  base.facilityTypes = [...types].filter(Boolean)
  delete base.facilityType

  return base
}

// ─── Build availability map ───────────────────────────────────────────────────
function buildAvailability(programs) {
  const map = {}
  for (const [key, val] of Object.entries(programs)) {
    if (val) map[key] = 'N/A'
  }
  return map
}

// ─── Parse CSV ────────────────────────────────────────────────────────────────
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const records = []
    createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true, bom: true }))
      .on('data', row => records.push(row))
      .on('end', () => resolve(records))
      .on('error', reject)
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏥 Nebraska Treatment Connect - Facility Importer`)
  console.log(`📂 Data directory: ${DATA_DIR}`)
  console.log(`🔍 Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE IMPORT'}\n`)

  if (!existsSync(DATA_DIR)) {
    console.error(`❌ Data directory not found: ${DATA_DIR}`)
    process.exit(1)
  }

  // Find all CSV files
  const files = (await readdir(DATA_DIR))
    .filter(f => f.toLowerCase().endsWith('.csv'))
    .map(f => join(DATA_DIR, f))

  console.log(`📄 Found ${files.length} CSV file(s):`)
  files.forEach(f => console.log(`   ${f}`))
  console.log()

  // Parse all CSV files
  let allRows = []
  for (const file of files) {
    const rows = await parseCSV(file)
    console.log(`   ${file.split('/').pop()}: ${rows.length} rows`)
    allRows = allRows.concat(rows)
  }
  console.log(`\n📊 Total rows: ${allRows.length}`)

  // Deduplicate by name1 + city + zip
  const groups = new Map()
  for (const row of allRows) {
    const key = [
      (row.name1 || '').trim().toLowerCase(),
      (row.city || '').trim().toLowerCase(),
      (row.zip || '').trim(),
    ].join('|')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }

  console.log(`🏢 Unique facilities: ${groups.size}`)
  console.log(`🔄 Merged ${allRows.length - groups.size} duplicate rows\n`)

  // Build facility documents
  const facilities = []
  const errors = []

  for (const [key, rows] of groups) {
    try {
      const merged = mergeRows(rows)
      if (!merged.name1) {
        errors.push({ key, reason: 'Missing name1' })
        continue
      }

      const docId = slugify(`${merged.name1}-${merged.city}-ne`)
      const availability = buildAvailability(merged.programs)
      const searchKeywords = buildSearchKeywords(rows[0])

      facilities.push({
        id: docId,
        data: {
          ...merged,
          availability,
          searchKeywords,
          active: true,
          importedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdatedBy: 'import',
        },
      })
    } catch (err) {
      errors.push({ key, reason: err.message })
    }
  }

  console.log(`✅ Prepared ${facilities.length} facility documents`)
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} errors:`)
    errors.forEach(e => console.log(`   ${e.key}: ${e.reason}`))
  }

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN — showing first 3 facilities:')
    facilities.slice(0, 3).forEach(f => {
      console.log(`\n  ID: ${f.id}`)
      console.log(`  Name: ${f.data.name1}`)
      console.log(`  City: ${f.data.city}, ${f.data.county}`)
      console.log(`  Types: ${f.data.facilityTypes?.join(', ')}`)
      console.log(`  Programs: ${Object.entries(f.data.programs).filter(([,v]) => v).map(([k]) => k).join(', ')}`)
      console.log(`  Availability keys: ${Object.keys(f.data.availability).join(', ')}`)
    })
    console.log('\n✅ Dry run complete. No data was written.')
    return
  }

  // Upload to Firestore in batches of 400
  initFirebase()
  const db = admin.firestore()

  const BATCH_SIZE = 400
  let totalWritten = 0

  for (let i = 0; i < facilities.length; i += BATCH_SIZE) {
    const batch = db.batch()
    const chunk = facilities.slice(i, i + BATCH_SIZE)

    for (const { id, data } of chunk) {
      const ref = db.collection('facilities').doc(id)
      // merge: true preserves existing availability data on re-import
      batch.set(ref, data, { merge: true })
    }

    await batch.commit()
    totalWritten += chunk.length
    console.log(`   ✍️  Wrote batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} facilities (${totalWritten}/${facilities.length})`)
  }

  // Write import log
  const log = {
    importedAt: new Date().toISOString(),
    filesProcessed: files.map(f => f.split('/').pop()),
    totalRows: allRows.length,
    uniqueFacilities: groups.size,
    facilitiesWritten: totalWritten,
    errors,
  }
  await writeFile(join(__dirname, '../import-log.json'), JSON.stringify(log, null, 2))

  console.log(`\n🎉 Import complete! ${totalWritten} facilities written to Firestore.`)
  console.log(`📝 Import log saved to import-log.json`)
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message)
  process.exit(1)
})
