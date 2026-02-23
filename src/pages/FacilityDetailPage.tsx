import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Phone, Globe, Building2,
  CheckSquare, Users, CreditCard, Award
} from 'lucide-react'
import { useFacility } from '../hooks/useFacility'
import { AvailabilityPanel } from '../components/detail/AvailabilityPanel'
import { ProgramBadge } from '../components/results/ProgramBadge'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ErrorBanner } from '../components/common/ErrorBanner'
import {
  PROGRAM_LABELS, POPULATION_LABELS, INSURANCE_LABELS, FACILITY_TYPE_LABELS
} from '../types/facility'

function InfoRow({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  )
}

function BooleanList({ data, labels, title, icon: Icon }: {
  data: Record<string, boolean | undefined>
  labels: Record<string, string>
  title: string
  icon: React.ComponentType<{ className?: string }>
}) {
  const active = Object.entries(data)
    .filter(([, v]) => v)
    .map(([k]) => labels[k] || k)

  if (!active.length) return null

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
        <Icon className="w-4 h-4 text-blue-600" />
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {active.map(label => (
          <ProgramBadge key={label} label={label} variant="gray" />
        ))}
      </div>
    </div>
  )
}

export function FacilityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { facility, loading, error } = useFacility(id)

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />
  }

  if (error || !facility) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <ErrorBanner message={error || 'Facility not found'} />
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    )
  }

  const address = [facility.street1, facility.street2, facility.city, `${facility.state} ${facility.zip}`]
    .filter(Boolean).join(', ')

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                {facility.facilityTypes?.map(type => (
                  <ProgramBadge
                    key={type}
                    label={FACILITY_TYPE_LABELS[type] || type}
                    variant={type === 'MH' ? 'purple' : type === 'HRSA' ? 'teal' : 'blue'}
                  />
                ))}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-1">{facility.name1}</h1>
              {facility.name2 && <p className="text-gray-500 mb-4">{facility.name2}</p>}

              <div className="space-y-2.5">
                {address && (
                  <InfoRow icon={MapPin}>
                    <a href={mapsUrl} target="_blank" rel="noreferrer" className="hover:text-blue-700 hover:underline">
                      {address} {facility.county && `· ${facility.county} County`}
                    </a>
                  </InfoRow>
                )}
                {facility.phone && (
                  <InfoRow icon={Phone}>
                    <a href={`tel:${facility.phone}`} className="hover:text-blue-700">{facility.phone}</a>
                  </InfoRow>
                )}
                {facility.website && (
                  <InfoRow icon={Globe}>
                    <a href={facility.website} target="_blank" rel="noreferrer noopener" className="text-blue-600 hover:underline break-all">
                      {facility.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  </InfoRow>
                )}
              </div>
            </div>

            {/* Programs */}
            {facility.programs && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <BooleanList
                  data={facility.programs as Record<string, boolean>}
                  labels={PROGRAM_LABELS}
                  title="Treatment Programs"
                  icon={Building2}
                />
                {facility.populations && (
                  <BooleanList
                    data={facility.populations as Record<string, boolean>}
                    labels={POPULATION_LABELS}
                    title="Populations Served"
                    icon={Users}
                  />
                )}
                {facility.insurance && (
                  <BooleanList
                    data={facility.insurance as Record<string, boolean>}
                    labels={INSURANCE_LABELS}
                    title="Payment / Insurance Accepted"
                    icon={CreditCard}
                  />
                )}
                {facility.accreditation && Object.values(facility.accreditation).some(Boolean) && (
                  <BooleanList
                    data={facility.accreditation as Record<string, boolean>}
                    labels={{ jointCommission: 'Joint Commission', carf: 'CARF', ncqa: 'NCQA', coa: 'COA', hfap: 'HFAP' }}
                    title="Accreditation"
                    icon={Award}
                  />
                )}
                {facility.therapies && Object.values(facility.therapies).some(Boolean) && (
                  <BooleanList
                    data={facility.therapies}
                    labels={{
                      cbt: 'Cognitive Behavioral Therapy (CBT)',
                      dbt: 'Dialectical Behavior Therapy (DBT)',
                      caseManagement: 'Case Management',
                      peerSupport: 'Peer Support',
                      familyCounseling: 'Family Counseling',
                      groupCounseling: 'Group Counseling',
                      individualCounseling: 'Individual Counseling',
                      traumaCounseling: 'Trauma Counseling',
                    }}
                    title="Therapies & Services"
                    icon={CheckSquare}
                  />
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <AvailabilityPanel facility={facility} />

            {/* Capacity info if available */}
            {facility.capacity?.totalBeds && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-3">Capacity</h2>
                <div className="space-y-2 text-sm">
                  {facility.capacity.totalBeds && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Beds</span>
                      <span className="font-medium">{facility.capacity.totalBeds}</span>
                    </div>
                  )}
                  {facility.capacity.adultBeds && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Adult Beds</span>
                      <span className="font-medium">{facility.capacity.adultBeds}</span>
                    </div>
                  )}
                  {facility.capacity.femaleBeds && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Female Beds</span>
                      <span className="font-medium">{facility.capacity.femaleBeds}</span>
                    </div>
                  )}
                  {facility.capacity.maleBeds && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Male Beds</span>
                      <span className="font-medium">{facility.capacity.maleBeds}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Call to action */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <h3 className="font-semibold text-blue-900 mb-2">Need help finding treatment?</h3>
              <p className="text-sm text-blue-700 mb-3">
                SAMHSA's National Helpline is free, confidential, and available 24/7.
              </p>
              <a
                href="tel:18006624357"
                className="flex items-center justify-center gap-2 bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-800 transition-colors"
              >
                <Phone className="w-4 h-4" />
                1-800-662-4357
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
