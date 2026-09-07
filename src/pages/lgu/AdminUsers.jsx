import { useEffect, useState } from 'react'
import { listAllProfiles, toggleProfileActive } from '../../services/adminService'

export function AdminUsers() {
  const [profiles, setProfiles] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    listAllProfiles().then(setProfiles).catch((err) => setError(err.message))
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
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold text-green-800">User Accounts</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Barangay</th>
              <th className="p-2">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.full_name}</td>
                <td className="p-2">{p.email}</td>
                <td className="p-2">{p.role}</td>
                <td className="p-2">{p.barangay ?? '—'}</td>
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
