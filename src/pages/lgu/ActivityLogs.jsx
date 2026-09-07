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
      <ul className="flex flex-col gap-2">
        {logs.length === 0 && <li className="text-sm text-gray-500">No activity yet.</li>}
        {logs.map((log) => (
          <li key={log.id} className="rounded border p-2 text-sm">
            <span className="font-medium">{log.actor?.full_name ?? 'Unknown user'}</span>{' '}
            {log.action.replace(/_/g, ' ')}
            {log.resource_type && ` (${log.resource_type})`}
            <span className="ml-2 text-xs text-gray-500">
              {new Date(log.created_at).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
