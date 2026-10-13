import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { FIELD_STATUSES, FIELD_STATUS_LABELS } from '../../lib/constants'
import { isReadyToHarvest } from '../../lib/helpers'
import { listAllFields, listRecentStatusLogs } from '../../services/fieldService'

export function CropMonitoring() {
  const [fields, setFields] = useState([])
  const [logs, setLogs] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listAllFields(), listRecentStatusLogs()])
      .then(([f, l]) => { setFields(f); setLogs(l) })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const ready = fields.filter(isReadyToHarvest).sort((a, b) => a.expected_harvest.localeCompare(b.expected_harvest))

  return (
    <div className="page-container">
      <PageHeader title="Crop monitoring" description="Where every field stands in the crop cycle, and what changed recently." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {FIELD_STATUSES.map((s) => (
          <div key={s} className="rounded border bg-white p-4 text-center">
            <p className="text-3xl font-semibold text-green-800">{loading ? '—' : fields.filter((f) => f.field_status === s).length}</p>
            <p className="text-sm text-gray-600">{FIELD_STATUS_LABELS[s]}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded border p-4">
          <h2 className="mb-2 text-lg font-medium">Ready to harvest soon</h2>
          <p className="mb-2 text-xs text-gray-500">Planted or growing fields with an expected harvest within 14 days.</p>
          {!loading && ready.length === 0 && <p className="text-sm text-gray-500">No fields are due for harvest.</p>}
          <ul className="flex flex-col gap-1 text-sm">
            {ready.map((f) => (
              <li key={f.id} className="flex justify-between gap-2">
                <Link to={`/lgu/fields/${f.id}`} className="text-green-700 hover:underline">{f.field_name}</Link>
                <span className="text-gray-600">{new Date(f.expected_harvest).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded border p-4">
          <h2 className="mb-2 text-lg font-medium">Recent status changes</h2>
          {!loading && logs.length === 0 && <p className="text-sm text-gray-500">No status changes recorded yet.</p>}
          <ul className="flex flex-col gap-1 text-sm">
            {logs.map((log) => (
              <li key={log.id}>
                <span className="text-gray-500">{new Date(log.created_at).toLocaleDateString()} · </span>
                <Link to={`/lgu/fields/${log.field_id}`} className="text-green-700 hover:underline">{log.field?.field_name ?? 'Field'}</Link>
                : {FIELD_STATUS_LABELS[log.old_status] ?? log.old_status ?? '—'} → {FIELD_STATUS_LABELS[log.new_status] ?? log.new_status}
                {log.remarks && <span className="text-gray-500"> ({log.remarks})</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
