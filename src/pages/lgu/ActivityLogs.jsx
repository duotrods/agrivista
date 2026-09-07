import { useEffect, useState } from 'react'
import { listActivityLogs } from '../../services/adminService'

export function ActivityLogs() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    listActivityLogs().then(setLogs).catch((err) => setError(err.message))
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold text-green-800">Activity Log</h1>
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
