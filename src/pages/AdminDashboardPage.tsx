import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, UserX, ExternalLink, Users, Building2 } from 'lucide-react'
import { useAdmin } from '../hooks/useAdmin'
import { CreateProviderModal } from '../components/admin/CreateProviderModal'
import { Button } from '../components/common/Button'
import { ErrorBanner } from '../components/common/ErrorBanner'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import type { Provider } from '../types/facility'

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
      active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function ProviderRow({
  provider,
  onDeactivate,
}: {
  provider: Provider
  onDeactivate: (uid: string) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [working, setWorking] = useState(false)

  const handleDeactivate = async () => {
    if (!confirming) { setConfirming(true); return }
    setWorking(true)
    await onDeactivate(provider.uid)
    setWorking(false)
    setConfirming(false)
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900 text-sm">{provider.displayName || provider.email}</div>
        <div className="text-xs text-gray-400">{provider.email}</div>
      </td>
      <td className="px-4 py-3">
        <Link
          to={`/facility/${provider.facilityId}`}
          target="_blank"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          {provider.facilityName || provider.facilityId}
          <ExternalLink className="w-3 h-3" />
        </Link>
      </td>
      <td className="px-4 py-3">
        <StatusBadge active={provider.active} />
      </td>
      <td className="px-4 py-3 text-right">
        {provider.active && (
          <button
            onClick={handleDeactivate}
            disabled={working}
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
              confirming
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'text-gray-500 border border-gray-200 hover:text-red-600 hover:border-red-200'
            } disabled:opacity-50`}
          >
            <UserX className="w-3.5 h-3.5" />
            {working ? 'Working...' : confirming ? 'Confirm deactivate' : 'Deactivate'}
          </button>
        )}
      </td>
    </tr>
  )
}

export function AdminDashboardPage() {
  const {
    providers, facilities, loading, facilitiesLoading, error,
    loadFacilities, createProvider, deactivateProvider,
  } = useAdmin()

  const [showCreate, setShowCreate] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleCreate = async (params: { email: string; password: string; displayName: string; facilityId: string }) => {
    setActionError(null)
    try {
      await createProvider(params)
    } catch (err) {
      setActionError((err as Error).message)
      throw err
    }
  }

  const handleDeactivate = async (uid: string) => {
    setActionError(null)
    try {
      await deactivateProvider(uid)
    } catch (err) {
      setActionError((err as Error).message)
    }
  }

  const activeProviders = providers.filter(p => p.active)
  const inactiveProviders = providers.filter(p => !p.active)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-blue-300 text-sm mb-1">Admin Dashboard</p>
          <h1 className="text-2xl font-bold">Nebraska Treatment Connect</h1>

          <div className="flex gap-6 mt-5">
            <div className="bg-blue-800 rounded-xl px-5 py-4">
              <div className="flex items-center gap-2 text-blue-300 text-sm mb-1">
                <Users className="w-4 h-4" />
                Active Providers
              </div>
              <div className="text-3xl font-bold">{activeProviders.length}</div>
            </div>
            <div className="bg-blue-800 rounded-xl px-5 py-4">
              <div className="flex items-center gap-2 text-blue-300 text-sm mb-1">
                <Building2 className="w-4 h-4" />
                Linked Facilities
              </div>
              <div className="text-3xl font-bold">
                {new Set(activeProviders.map(p => p.facilityId)).size}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(error || actionError) && (
          <ErrorBanner message={error || actionError || ''} className="mb-5" />
        )}

        {loading ? (
          <LoadingSpinner className="py-20" />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="font-semibold text-gray-900">Provider Accounts</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage facility provider logins and availability update access
                </p>
              </div>
              <Button onClick={() => { setShowCreate(true); loadFacilities('') }}>
                <UserPlus className="w-4 h-4" />
                Add Provider
              </Button>
            </div>

            {providers.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No provider accounts yet</p>
                <p className="text-sm mt-1">Click "Add Provider" to create the first one.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Provider</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Facility</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...activeProviders, ...inactiveProviders].map(provider => (
                      <ProviderRow
                        key={provider.uid}
                        provider={provider}
                        onDeactivate={handleDeactivate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateProviderModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        facilities={facilities}
        facilitiesLoading={facilitiesLoading}
        onSearchFacilities={loadFacilities}
      />
    </main>
  )
}
