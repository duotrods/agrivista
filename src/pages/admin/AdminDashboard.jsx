import { PageHeader } from '../../components/layout/PageHeader'
import { useEffect, useState } from 'react'
import { listLGUAccountsForApproval, toggleProfileActive } from '../../services/adminService'

export function AdminDashboard() {
  const [accounts, setAccounts] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listLGUAccountsForApproval()
      .then(setAccounts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleApprove(id) {
    setError(null)
    try {
      await toggleProfileActive(id, true)
      setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: true } : a)))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRevoke(id) {
    setError(null)
    try {
      await toggleProfileActive(id, false)
      setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: false } : a)))
    } catch (err) {
      setError(err.message)
    }
  }

  const pending = accounts.filter((a) => !a.is_active)
  const approved = accounts.filter((a) => a.is_active)

  return (
    <div className="page-container">
      <PageHeader
        title="LGU staff approvals"
        description="Review and approve LGU Staff registrations for AgriVista."
      />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <h2 className="mb-2 text-lg font-medium">
        Pending approval {pending.length > 0 && `(${pending.length})`}
      </h2>
      <div className="mb-8 overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Purok</th>
              <th className="p-2">Email Verified</th>
              <th className="p-2">Registered</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="p-2 text-gray-500" colSpan={6}>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && pending.length === 0 && (
              <tr>
                <td className="p-2 text-gray-500" colSpan={6}>
                  No pending LGU registrations.
                </td>
              </tr>
            )}
            {pending.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-2">{a.full_name}</td>
                <td className="p-2">{a.email}</td>
                <td className="p-2">{a.purok ?? '—'}</td>
                <td className="p-2">
                  {a.email_confirmed ? (
                    <span className="text-green-700">✓ Verified</span>
                  ) : (
                    <span className="text-amber-700">✗ Not verified</span>
                  )}
                </td>
                <td className="p-2">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(a.id)}
                    className="rounded bg-green-700 px-2 py-1 text-xs text-white hover:bg-green-600"
                  >
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 text-lg font-medium">Approved LGU staff</h2>
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Purok</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {approved.length === 0 && (
              <tr>
                <td className="p-2 text-gray-500" colSpan={4}>
                  No approved LGU staff yet.
                </td>
              </tr>
            )}
            {approved.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-2">{a.full_name}</td>
                <td className="p-2">{a.email}</td>
                <td className="p-2">{a.purok ?? '—'}</td>
                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => handleRevoke(a.id)}
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    Revoke
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
