import { PageHeader } from '../../components/layout/PageHeader'
import { useEffect, useState } from 'react'
import { listActivityLogs } from '../../services/adminService'

export function ActivityLogs() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    listActivityLogs().then(setLogs).catch((err) => setError(err.message))
  }, [])

  return (
    <div className="page-container">
      <PageHeader title="Activity log" description="Follow the latest updates across your agricultural community." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <section className="dash-card">
        <div className="dash-card-head"><h2>Recent activity</h2><span>Latest {logs.length}</span></div>
        {logs.length === 0 && <p className="dash-empty">No activity yet.</p>}
        <ul className="dash-list">
          {logs.map((log) => (
            <li key={log.id} className="dash-row">
              <span className="text-sm">
                <span className="dash-list-title">{log.actor?.full_name ?? 'Unknown user'}</span>{' '}
                {log.action.replace(/_/g, ' ')}
                {log.resource_type && <span className="dash-list-meta"> ({log.resource_type})</span>}
              </span>
              <span className="dash-list-meta shrink-0">{new Date(log.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
