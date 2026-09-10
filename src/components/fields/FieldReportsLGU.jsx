import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listReportsForField, markReportReviewed } from '../../services/reportService'

export function FieldReportsLGU({ fieldId }) {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    listReportsForField(fieldId).then(setReports).catch((err) => setError(err.message))
  }, [fieldId])

  async function handleReview(reportId) {
    try {
      const updated = await markReportReviewed(reportId, user.id)
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <ul className="flex flex-col gap-2">
        {reports.length === 0 && (
          <li className="text-sm text-gray-500">No reports submitted by this farmer yet.</li>
        )}
        {reports.map((r) => (
          <li key={r.id} className="rounded bg-gray-50 p-2 text-sm">
            <p>{r.summary}</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {new Date(r.created_at).toLocaleDateString()} ·{' '}
                <span className={r.status === 'reviewed' ? 'text-green-700' : 'text-amber-700'}>
                  {r.status}
                </span>
              </p>
              {r.status !== 'reviewed' && (
                <button
                  type="button"
                  onClick={() => handleReview(r.id)}
                  className="rounded border px-2 py-0.5 text-xs hover:bg-white"
                >
                  Mark Reviewed
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
