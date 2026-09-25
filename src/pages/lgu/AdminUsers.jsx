import { PageHeader } from '../../components/layout/PageHeader'
import { useEffect, useState } from 'react'
import { listFarmerProfiles, toggleProfileActive } from '../../services/adminService'

export function AdminUsers() {
  const [profiles, setProfiles] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    listFarmerProfiles().then(setProfiles).catch((err) => setError(err.message))
  }, [])

  async function handleToggle(profile) {
    try {
      const updated = await toggleProfileActive(profile.id, !profile.is_active)
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page-container">
      <PageHeader title="Our community" description="Manage farmer accounts." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Purok</th>
              <th className="p-2">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.full_name}</td>
                <td className="p-2">{p.email}</td>
                <td className="p-2">{p.purok ?? '—'}</td>
                <td className="p-2">
                  {p.is_active ? (
                    <span className="text-green-700">Active</span>
                  ) : (
                    <span className="text-red-600">Disabled</span>
                  )}
                </td>
                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(p)}
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    {p.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
