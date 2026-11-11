import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatCard } from '../../components/dashboard/StatCard'
import { STATUS_CARDS } from '../../components/dashboard/statusCards'
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
      <div className="grid grid-cols-2 items-stretch gap-4 md:grid-cols-3 xl:grid-cols-5">
        {FIELD_STATUSES.map((s) => (
          <StatCard key={s} {...STATUS_CARDS[s]} label={FIELD_STATUS_LABELS[s]} value={fields.filter((f) => f.field_status === s).length} loading={loading} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Ready to harvest soon</h2>
            <span>Within 14 days</span>
          </div>
          <p className="dash-subtext">Planted or growing fields with an expected harvest within 14 days.</p>
          {!loading && ready.length === 0 && <p className="dash-empty">No fields are due for harvest.</p>}
          <ul className="dash-list">
            {ready.map((f) => (
              <li key={f.id} className="dash-row">
                <Link to={`/lgu/fields/${f.id}`} className="dash-list-title">{f.field_name}</Link>
                <span className="dash-list-meta">{new Date(f.expected_harvest).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Recent status changes</h2>
          </div>
          {!loading && logs.length === 0 && <p className="dash-empty">No status changes recorded yet.</p>}
          <ul className="dash-list">
            {logs.map((log) => (
              <li key={log.id}>
                <Link to={`/lgu/fields/${log.field_id}`} className="dash-list-title">{log.field?.field_name ?? 'Field'}</Link>
                <span className="dash-list-meta"> · {new Date(log.created_at).toLocaleDateString()}</span>
                <p className="mt-1 text-sm">
                  {FIELD_STATUS_LABELS[log.old_status] ?? log.old_status ?? '—'} → {FIELD_STATUS_LABELS[log.new_status] ?? log.new_status}
                  {log.remarks && <span className="dash-list-meta"> ({log.remarks})</span>}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
