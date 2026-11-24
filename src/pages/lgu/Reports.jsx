import { PageHeader } from '../../components/layout/PageHeader'
import { useEffect, useState } from 'react'
import { ReportDetails } from '../../components/fields/ReportDetails'
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
      <section className="dash-card">
        <div className="dash-card-head"><h2>Reports from farmers</h2><span>{reports.length} {reports.length === 1 ? 'report' : 'reports'}</span></div>
        {reports.length === 0 && <p className="dash-empty">No reports submitted yet.</p>}
        <ul className="dash-list">
          {reports.map((r) => (
            <li key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link to={`/lgu/fields/${r.field_id}`} className="dash-list-title">{r.field?.field_name ?? 'Unknown field'}</Link>
                  <p className="dash-list-meta">
                    {r.submitter?.full_name ?? 'Unknown farmer'} · {r.field?.purok ?? '—'} · {new Date(r.report_date ?? r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`stat-pill shrink-0 ${r.status === 'reviewed' ? 'tone-green' : 'tone-amber'}`}>{r.status === 'reviewed' ? 'validated' : 'submitted'}</span>
              </div>
              <div className="mt-2"><ReportDetails report={r} /></div>
              {r.status !== 'reviewed' && (
                <div className="mt-3"><button type="button" onClick={() => handleReview(r.id)} className="row-btn is-edit">Validate</button></div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
