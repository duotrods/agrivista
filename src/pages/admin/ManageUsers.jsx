import { useEffect, useMemo, useState } from 'react'
import { Select } from '../../components/common/Select'
import { PageHeader } from '../../components/layout/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import { deleteUser, listAllUsers, toggleProfileActive } from '../../services/adminService'

const ROLE_LABELS = { farmer: 'Farmer', lgu_staff: 'LGU Staff', admin: 'Admin' }

export function ManageUsers() {
  const { user, profile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (profile?.role !== 'admin') return
    listAllUsers().then(setUsers).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [profile])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter((u) => (!role || u.role === role) && (!term || [u.full_name, u.email].some((v) => v?.toLowerCase().includes(term))))
  }, [users, search, role])

  if (!profile) return <div className="p-8 text-center text-gray-500">Loading...</div>
  if (profile.role !== 'admin') return <div className="p-8 text-center text-red-600">Only admins can manage users.</div>

  async function handleToggle(target) {
    setBusyId(target.id)
    setError(null)
    try {
      await toggleProfileActive(target.id, !target.is_active)
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, is_active: !target.is_active } : u)))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(target) {
    setBusyId(target.id)
    setError(null)
    try {
      await deleteUser(target.id, { deletedBy: user.id, email: target.email, role: target.role })
      setUsers((prev) => prev.filter((u) => u.id !== target.id))
      setConfirmingId(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page-container">
      <PageHeader title="Users" description="Manage every account: farmers, LGU staff and admins." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input type="search" aria-label="Search users" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <Select aria-label="Filter by role" value={role} onChange={(e) => setRole(e.target.value)} className="rounded border px-3 py-2 text-sm">
          <option value="">All roles</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <span className="text-sm text-gray-600">{loading ? 'Loading...' : `${visible.length} of ${users.length}`}</span>
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Purok</th>
              <th className="p-2">Status</th>
              <th className="p-2">Registered</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {!loading && visible.length === 0 && <tr><td colSpan={7} className="p-3 text-gray-500">No users match.</td></tr>}
            {visible.map((u) => {
              const isSelf = u.id === user.id
              return (
                <tr key={u.id} className="border-t align-top">
                  <td className="p-2">{u.full_name}{isSelf && <span className="ml-1 text-xs text-gray-500">(you)</span>}</td>
                  <td className="p-2 break-all">{u.email}{!u.email_confirmed && <span className="ml-1 text-xs text-amber-700">unverified</span>}</td>
                  <td className="p-2">{ROLE_LABELS[u.role] ?? u.role}</td>
                  <td className="p-2">{u.purok ?? '—'}</td>
                  <td className="p-2">{u.is_active ? <span className="text-green-700">Active</span> : <span className="text-red-600">{u.role === 'lgu_staff' ? 'Pending / disabled' : 'Disabled'}</span>}</td>
                  <td className="p-2">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-2">
                    {isSelf ? null : confirmingId === u.id ? (
                      <div className="flex max-w-xs flex-col gap-2">
                        <p className="text-xs text-red-700">
                          Permanently delete {u.full_name}?{u.role === 'farmer' && ' Their fields, reports and notifications are deleted too.'} This cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleDelete(u)} disabled={busyId === u.id} className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50">{busyId === u.id ? 'Deleting...' : 'Yes, delete'}</button>
                          <button type="button" onClick={() => setConfirmingId(null)} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleToggle(u)} disabled={busyId === u.id} className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50">{u.is_active ? 'Disable' : 'Enable'}</button>
                        <button type="button" onClick={() => setConfirmingId(u.id)} className="rounded border border-red-600 px-2 py-1 text-xs text-red-700 hover:bg-red-50">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
