import { PageHeader } from '../../components/layout/PageHeader'
import { useEffect, useState } from 'react'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { StatCard } from '../../components/dashboard/StatCard'
import { useAuth } from '../../hooks/useAuth'
import { deleteUser, listLGUAccountsForApproval, logActivity, toggleProfileActive } from '../../services/adminService'

export function AdminDashboard() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [rejecting, setRejecting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
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
      logActivity({ userId: user.id, action: 'approved_lgu_staff', resourceType: 'user', resourceId: id })
      setNotice('LGU staff account approved. They can log in now.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRevoke(id) {
    setError(null)
    try {
      await toggleProfileActive(id, false)
      setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: false } : a)))
      logActivity({ userId: user.id, action: 'revoked_lgu_staff', resourceType: 'user', resourceId: id })
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleReject() {
    setBusy(true)
    setError(null)
    try {
      await deleteUser(rejecting.id, { deletedBy: user.id, email: rejecting.email, role: 'lgu_staff' })
      setAccounts((prev) => prev.filter((a) => a.id !== rejecting.id))
      setNotice('LGU staff registration rejected and removed.')
      setRejecting(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const pending = accounts.filter((a) => !a.is_active)
  const approved = accounts.filter((a) => a.is_active)
  const unverified = pending.filter((a) => !a.email_confirmed).length

  return (
    <div className="page-container">
      <PageHeader title="LGU staff approvals" description="Review and approve LGU Staff registrations for AgriVista." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {notice && <p role="status" className="dash-note">{notice}</p>}
      <ConfirmDialog
        open={Boolean(rejecting)}
        danger
        busy={busy}
        title="Reject this registration?"
        message={rejecting ? `${rejecting.full_name ?? rejecting.email} will be removed and will not be able to log in. This cannot be undone.` : ''}
        confirmLabel="Reject"
        onConfirm={handleReject}
        onCancel={() => setRejecting(null)}
      />

      <div className="grid grid-cols-2 items-stretch gap-4 lg:grid-cols-3">
        <StatCard icon="pending" tone="amber" label="Pending approval" description="Waiting for your decision." value={pending.length} loading={loading} pill={pending.length > 0 ? 'Needs review' : undefined} />
        <StatCard icon="approved" label="Approved LGU staff" description="Can log in and review fields." value={approved.length} loading={loading} />
        <StatCard icon="report" tone="red" label="Email not verified" description="Pending requests to double-check." value={unverified} loading={loading} />
      </div>

      <section className="dash-card mt-4">
        <div className="dash-card-head">
          <h2>Pending approval {pending.length > 0 && `(${pending.length})`}</h2>
          <span>New LGU staff registrations</span>
        </div>
        <table className="dash-table is-text responsive-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Purok</th><th>Email verified</th><th>Registered</th><th className="cell-actions">Actions</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="dash-table-empty">Loading...</td></tr>}
            {!loading && pending.length === 0 && <tr><td colSpan={6} className="dash-table-empty">No pending LGU registrations.</td></tr>}
            {pending.map((a) => (
              <tr key={a.id}>
                <td data-label="Name">{a.full_name}</td>
                <td data-label="Email" className="break-all">{a.email}</td>
                <td data-label="Purok">{a.purok ?? '—'}</td>
                <td data-label="Email verified">
                  <span className={`stat-pill ${a.email_confirmed ? 'tone-green' : 'tone-amber'}`}>{a.email_confirmed ? '✓ Verified' : '✗ Not verified'}</span>
                </td>
                <td data-label="Registered">{new Date(a.created_at).toLocaleDateString()}</td>
                <td data-label="Actions" className="cell-actions">
                  <div className="row-actions">
                    <button type="button" onClick={() => handleApprove(a.id)} className="row-btn is-edit">Approve</button>
                    <button type="button" onClick={() => setRejecting(a)} className="row-btn is-danger">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="dash-card mt-4">
        <div className="dash-card-head">
          <h2>Approved LGU staff</h2>
          <span>{approved.length} {approved.length === 1 ? 'account' : 'accounts'}</span>
        </div>
        <table className="dash-table is-text responsive-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Purok</th><th className="cell-actions">Actions</th></tr>
          </thead>
          <tbody>
            {approved.length === 0 && <tr><td colSpan={4} className="dash-table-empty">No approved LGU staff yet.</td></tr>}
            {approved.map((a) => (
              <tr key={a.id}>
                <td data-label="Name">{a.full_name}</td>
                <td data-label="Email" className="break-all">{a.email}</td>
                <td data-label="Purok">{a.purok ?? '—'}</td>
                <td data-label="Actions" className="cell-actions">
                  <div className="row-actions">
                    <button type="button" onClick={() => handleRevoke(a.id)} className="row-btn">Revoke</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
