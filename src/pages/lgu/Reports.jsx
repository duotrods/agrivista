import { PageHeader } from '../../components/layout/PageHeader'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { listAllReports, markReportReviewed } from '../../services/reportService'

export function Reports() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    listAllReports().then(setReports).catch((err) => setError(err.message))
  }, [])

  async function handleReview(reportId) {
    try {
      const updated = await markReportReviewed(reportId, user.id)
      setReports((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page-container">
      <PageHeader title="Monitoring reports" description="Reports submitted by farmers for validation and follow-up." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <ul className="flex flex-col gap-3">
        {reports.length === 0 && <li className="text-sm text-gray-500">No reports submitted yet.</li>}
        {reports.map((r) => (
          <li key={r.id} className="rounded border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link to={`/lgu/fields/${r.field_id}`} className="font-medium text-green-700 hover:underline">
                  {r.field?.field_name ?? 'Unknown field'}
                </Link>
                <p className="text-xs text-gray-500">
                  {r.submitter?.full_name ?? 'Unknown farmer'} · {r.field?.purok ?? '—'} ·{' '}
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs ${
                  r.status === 'reviewed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {r.status}
              </span>
            </div>
            <p className="mt-2 text-sm">{r.summary}</p>
            {r.status !== 'reviewed' && (
              <button
                type="button"
                onClick={() => handleReview(r.id)}
                className="mt-2 rounded border px-3 py-1 text-xs hover:bg-gray-50"
              >
                Mark Reviewed
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
