import { useEffect, useMemo, useState } from 'react'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { Select } from '../../components/common/Select'
import { StatCard } from '../../components/dashboard/StatCard'
import { ToolbarIcon } from '../../components/dashboard/ToolbarIcon'
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
  const [deleting, setDeleting] = useState(null)
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

  async function handleDelete() {
    const target = deleting
    setBusyId(target.id)
    setError(null)
    try {
      await deleteUser(target.id, { deletedBy: user.id, email: target.email, role: target.role })
      setUsers((prev) => prev.filter((u) => u.id !== target.id))
      setDeleting(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const count = (r) => users.filter((u) => u.role === r).length
  const inactive = users.filter((u) => !u.is_active).length

  return (
    <div className="page-container">
      <PageHeader title="Users" description="Manage every account: farmers, LGU staff and admins." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <ConfirmDialog
        open={Boolean(deleting)}
        danger
        busy={Boolean(deleting) && busyId === deleting.id}
        title="Delete this account?"
        message={deleting ? `Permanently delete ${deleting.full_name}?${deleting.role === 'farmer' ? ' Their fields, reports and notifications are deleted too.' : ''} This cannot be undone.` : ''}
        confirmLabel="Yes, delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />

      <div className="grid grid-cols-2 items-stretch gap-4 lg:grid-cols-4">
        <StatCard icon="users" tone="blue" label="Total accounts" description="Every registered user." value={users.length} loading={loading} />
        <StatCard icon="sprout" label="Farmers" description="Registered farmers." value={count('farmer')} loading={loading} />
        <StatCard icon="approved" label="LGU staff" description="Staff and admins." value={count('lgu_staff') + count('admin')} loading={loading} />
        <StatCard icon="pending" tone="amber" label="Disabled or pending" description="Cannot log in right now." value={inactive} loading={loading} />
      </div>

      <section className="dash-card mt-4">
        <div className="dash-card-head">
          <h2>All accounts</h2>
          <span>{loading ? 'Loading...' : `${visible.length} of ${users.length}`}</span>
        </div>
        <div className="toolbar toolbar-start">
          <div className="tb-group">
            <span className="tb-icon"><ToolbarIcon name="search" /></span>
            <input type="search" aria-label="Search users" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="tb-input" />
          </div>
          <div className="tb-group">
            <Select aria-label="Filter by role" value={role} onChange={(e) => setRole(e.target.value)} className="tb-select">
              <option value="">All roles</option>
              {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </div>
          {(search || role) && <button type="button" onClick={() => { setSearch(''); setRole('') }} className="tb-btn">Clear</button>}
        </div>
        <table className="dash-table is-text responsive-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Purok</th><th>Status</th><th>Registered</th><th className="cell-actions">Actions</th></tr>
          </thead>
          <tbody>
            {!loading && visible.length === 0 && <tr><td colSpan={7} className="dash-table-empty">No users match.</td></tr>}
            {visible.map((u) => {
              const isSelf = u.id === user.id
              return (
                <tr key={u.id}>
                  <td data-label="Name">{u.full_name}{isSelf && <span className="form-hint"> (you)</span>}</td>
                  <td data-label="Email" className="break-all">{u.email}{!u.email_confirmed && <span className="stat-pill tone-amber ml-1">unverified</span>}</td>
                  <td data-label="Role"><span className={`stat-pill ${u.role === 'admin' ? 'tone-blue' : u.role === 'lgu_staff' ? 'tone-amber' : 'tone-green'}`}>{ROLE_LABELS[u.role] ?? u.role}</span></td>
                  <td data-label="Purok">{u.purok ?? '—'}</td>
                  <td data-label="Status"><span className={`stat-pill ${u.is_active ? 'tone-green' : 'tone-red'}`}>{u.is_active ? 'Active' : u.role === 'lgu_staff' ? 'Pending / disabled' : 'Disabled'}</span></td>
                  <td data-label="Registered">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td data-label="Actions" className="cell-actions">
                    {!isSelf && (
                      <div className="row-actions">
                        <button type="button" onClick={() => handleToggle(u)} disabled={busyId === u.id} className="row-btn">{u.is_active ? 'Disable' : 'Enable'}</button>
                        <button type="button" onClick={() => setDeleting(u)} className="row-btn is-danger">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
