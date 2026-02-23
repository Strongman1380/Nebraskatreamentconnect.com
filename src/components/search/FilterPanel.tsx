import { useState } from 'react'
import { ChevronDown, ChevronUp, X, SlidersHorizontal } from 'lucide-react'
import type { SearchFilters } from '../../types/facility'
import {
  PROGRAM_LABELS,
  POPULATION_LABELS,
  INSURANCE_LABELS,
  FACILITY_TYPE_LABELS,
  NEBRASKA_COUNTIES,
} from '../../types/facility'

interface FilterPanelProps {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
}

function Section({ title, children, defaultOpen = false }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
      >
        {title}
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />
        }
      </button>
      {open && <div className="pb-4 space-y-2">{children}</div>}
    </div>
  )
}

function CheckboxGroup({ options, selected, onChange }: {
  options: Record<string, string>
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter(s => s !== key) : [...selected, key])
  }
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 filter-scroll">
      {Object.entries(options).map(([key, label]) => (
        <label key={key} className="flex items-center gap-2.5 cursor-pointer group py-0.5">
          <input
            type="checkbox"
            checked={selected.includes(key)}
            onChange={() => toggle(key)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 shrink-0"
          />
          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>
        </label>
      ))}
    </div>
  )
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const activeFilterCount = [
    filters.county,
    filters.facilityType,
    ...filters.programs,
    ...filters.populations,
    ...filters.insurance,
  ].filter(Boolean).length

  const clearAll = () => {
    onChange({
      search: filters.search,
      county: '',
      city: '',
      facilityType: '',
      programs: [],
      populations: [],
      insurance: [],
    })
  }

  const panelContent = (
    <div className="space-y-0">
      {/* Facility Type */}
      <Section title="Facility Type" defaultOpen>
        <div className="space-y-2">
          {Object.entries(FACILITY_TYPE_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer group py-0.5">
              <input
                type="radio"
                name="facilityType"
                value={key}
                checked={filters.facilityType === key}
                onChange={() => onChange({ ...filters, facilityType: key === filters.facilityType ? '' : key })}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* County */}
      <Section title="County">
        <select
          value={filters.county}
          onChange={e => onChange({ ...filters, county: e.target.value, city: '' })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="">All Counties</option>
          {NEBRASKA_COUNTIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Section>

      {/* Programs */}
      <Section title="Treatment Programs" defaultOpen>
        <CheckboxGroup
          options={PROGRAM_LABELS}
          selected={filters.programs}
          onChange={programs => onChange({ ...filters, programs })}
        />
      </Section>

      {/* Populations */}
      <Section title="Populations Served">
        <CheckboxGroup
          options={POPULATION_LABELS}
          selected={filters.populations}
          onChange={populations => onChange({ ...filters, populations })}
        />
      </Section>

      {/* Insurance */}
      <Section title="Payment / Insurance">
        <CheckboxGroup
          options={INSURANCE_LABELS}
          selected={filters.insurance}
          onChange={insurance => onChange({ ...filters, insurance })}
        />
      </Section>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(o => !o)}
          className={`flex items-center gap-2 text-sm font-medium rounded-xl px-4 py-2.5 transition-all ${
            mobileOpen
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 bg-white border border-gray-200 hover:border-gray-300 shadow-sm'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold ${
              mobileOpen ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
            }`}>
              {activeFilterCount}
            </span>
          )}
        </button>
        {mobileOpen && (
          <div className="mt-3 bg-white rounded-xl border border-gray-200 p-5 shadow-lg shadow-gray-200/50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-900 text-sm">Filters</h2>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>
            {panelContent}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 p-5 sticky top-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {activeFilterCount}
              </span>
            )}
          </h2>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>
        {panelContent}
      </div>
    </>
  )
}
