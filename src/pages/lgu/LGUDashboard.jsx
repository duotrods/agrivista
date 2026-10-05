import { Select } from '../../components/common/Select'
import { PageHeader } from '../../components/layout/PageHeader'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ARFieldView } from '../../components/ar/ARFieldView'
import { StatsPanel } from '../../components/dashboard/StatsPanel'
import { MapView } from '../../components/maps/MapView'
import { FIELD_STATUSES, FIELD_STATUS_LABELS, PUROKS } from '../../lib/constants'
import { listAllFields } from '../../services/fieldService'

export function LGUDashboard() {
  const [fields, setFields] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAR, setShowAR] = useState(false)

  const [purokFilter, setPurokFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')

  useEffect(() => {
    listAllFields()
      .then(setFields)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filteredFields = useMemo(() => {
    return fields.filter((f) => {
      if (purokFilter && f.purok !== purokFilter) return false
      if (statusFilter && f.field_status !== statusFilter) return false
      if (approvalFilter === 'pending' && f.is_verified) return false
      if (approvalFilter === 'approved' && !f.is_verified) return false
      return true
    })
  }, [fields, purokFilter, statusFilter, approvalFilter])

  const pendingCount = fields.filter((field) => !field.is_verified).length

  return (
    <div className="page-container">
      <div className="dashboard-heading mb-4 flex items-center justify-between print:hidden">
        <PageHeader title="Agricultural overview" description="A connected view of rice fields across Barangay Caganganan." />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAR(true)}
            className="rounded border border-green-700 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
          >
            View in AR
          </button>
          <Link to="/lgu/reports" className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
            Reports
          </Link>
          <Link to="/lgu/announcements" className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
            Announcements
          </Link>
          <Link to="/lgu/users" className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
            Users
          </Link>
          <Link to="/lgu/activity" className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
            Activity Log
          </Link>
          <Link to="/lgu/settings" className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
            Settings
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Print / Export PDF
          </button>
        </div>
      </div>

      <h1 className="mb-4 hidden text-2xl font-semibold text-green-800 print:block">
        AgriVista — Rice Field Report
      </h1>

      {showAR && (
        <ARFieldView fields={filteredFields} linkBase="/lgu/fields" onClose={() => setShowAR(false)} />
      )}

      <div className="mb-6">
        <StatsPanel fields={filteredFields} />
      </div>

      {!loading && pendingCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 print:hidden">
          <p>{pendingCount} {pendingCount === 1 ? 'field needs' : 'fields need'} LGU approval before appearing in Community.</p>
          <button type="button" onClick={() => { setApprovalFilter('pending'); setPurokFilter(''); setStatusFilter('') }} className="rounded border px-3 py-2 font-medium">
            Review Pending Fields
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <Select
          aria-label="Filter by purok" value={purokFilter}
          onChange={(e) => setPurokFilter(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All puroks</option>
          {PUROKS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by status" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {FIELD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {FIELD_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by approval"
          value={approvalFilter}
          onChange={(e) => setApprovalFilter(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All approval statuses</option>
          <option value="pending">Pending LGU approval</option>
          <option value="approved">Approved by LGU</option>
        </Select>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="print:hidden">
        <MapView fields={filteredFields} fieldLinkBase="/lgu/fields" />
      </div>

      <ul className="mt-6 flex flex-col gap-2">
        {loading && <li className="text-gray-500">Loading fields...</li>}
        {!loading && filteredFields.length === 0 && (
          <li className="text-gray-500">No fields match these filters.</li>
        )}
        {filteredFields.map((field) => (
          <li key={field.id} className="flex items-center justify-between rounded border px-3 py-2">
            <div>
              <Link to={`/lgu/fields/${field.id}`} className="text-green-700 hover:underline">
                {field.field_name}
              </Link>
              <p className="text-xs text-gray-500">
                {field.farmer?.full_name ?? 'Unknown farmer'} · {field.purok ?? '—'} ·{' '}
                {FIELD_STATUS_LABELS[field.field_status] ?? field.field_status}
              </p>
            </div>
            {field.is_verified ? (
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">Approved by LGU</span>
            ) : (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Pending LGU approval</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
