import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatsPanel } from '../../components/dashboard/StatsPanel'
import { MapView } from '../../components/maps/MapView'
import { FIELD_STATUSES } from '../../lib/constants'
import { listAllFields } from '../../services/fieldService'

export function LGUDashboard() {
  const [fields, setFields] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const [barangayFilter, setBarangayFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    listAllFields()
      .then(setFields)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filteredFields = useMemo(() => {
    return fields.filter((f) => {
      if (barangayFilter && !f.barangay?.toLowerCase().includes(barangayFilter.toLowerCase())) {
        return false
      }
      if (statusFilter && f.field_status !== statusFilter) return false
      return true
    })
  }, [fields, barangayFilter, statusFilter])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold text-green-800">All Rice Fields</h1>
        <div className="flex gap-2">
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

      <div className="mb-6">
        <StatsPanel fields={filteredFields} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <input
          type="text"
          placeholder="Filter by barangay..."
          value={barangayFilter}
          onChange={(e) => setBarangayFilter(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {FIELD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
                {field.farmer?.full_name ?? 'Unknown farmer'} · {field.barangay ?? '—'} ·{' '}
                {field.field_status}
              </p>
            </div>
            {field.is_verified ? (
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">Verified</span>
            ) : (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Unverified</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
