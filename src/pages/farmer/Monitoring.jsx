import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ToolbarIcon } from '../../components/dashboard/ToolbarIcon'
import { ReportDetails } from '../../components/fields/ReportDetails'
import { ReportDrawer } from '../../components/fields/ReportDrawer'
import { PageHeader } from '../../components/layout/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import { FIELD_STATUS_LABELS } from '../../lib/constants'
import { listFieldsForFarmer } from '../../services/fieldService'
import { listReportsForFarmer } from '../../services/reportService'

const label = (value) => value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())

export function Monitoring() {
  const { user } = useAuth()
  const [fields, setFields] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [reporting, setReporting] = useState(null) // null = closed, '' = open without a field, id = preselected

  useEffect(() => {
    if (!user) return
    Promise.all([listFieldsForFarmer(user.id), listReportsForFarmer()])
      .then(([f, r]) => { setFields(f); setReports(r) })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  // Reports arrive newest first, so the first match per field is its latest report.
  const latestByField = useMemo(() => {
    const latest = new Map()
    for (const r of reports) if (!latest.has(r.field_id)) latest.set(r.field_id, r)
    return latest
  }, [reports])

  function handleSubmitted(report, { statusError } = {}) {
    const field = fields.find((f) => f.id === report.field_id)
    setReports((prev) => [{ ...report, field: field ? { field_name: field.field_name } : undefined }, ...prev])
    if (field && report.crop_status && report.crop_status !== field.field_status && !statusError) {
      setFields((prev) => prev.map((f) => (f.id === field.id ? { ...f, field_status: report.crop_status, is_verified: false, review_status: 'pending' } : f)))
    }
    setNotice(statusError
      ? `Report submitted, but the crop status could not be updated: ${statusError}`
      : 'Report submitted. LGU staff will review it.')
    setReporting(null)
  }

  return (
    <div className="page-container">
      <PageHeader title="Monitoring" description="Send a monitoring report for each field. A report can also move the field to its new crop stage.">
        <button type="button" onClick={() => setReporting('')} disabled={fields.length === 0} className="tb-btn is-primary"><ToolbarIcon name="plus" />New report</button>
      </PageHeader>
      {reporting !== null && <ReportDrawer fields={fields} initialFieldId={reporting || undefined} onClose={() => setReporting(null)} onSubmitted={handleSubmitted} />}
      {notice && <p role="status" className="dash-note">{notice}</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <section className="dash-card">
        <div className="dash-card-head">
          <h2>My fields</h2>
          <span>{fields.length} {fields.length === 1 ? 'field' : 'fields'}</span>
        </div>
        {loading && <p className="dash-empty">Loading fields...</p>}
        {!loading && fields.length === 0 && <p className="dash-empty">No fields yet. <Link to="/fields/new" className="text-green-700 underline">Add one</Link>.</p>}
        {fields.length > 0 && (
          <table className="dash-table is-text responsive-table">
            <thead>
              <tr><th>Field</th><th>Crop status</th><th>Last condition</th><th>Last report</th><th className="cell-actions">Actions</th></tr>
            </thead>
            <tbody>
              {fields.map((f) => {
                const last = latestByField.get(f.id)
                return (
                  <tr key={f.id}>
                    <td data-label="Field"><Link to={`/fields/${f.id}`} className="dash-list-title">{f.field_name}</Link></td>
                    <td data-label="Crop status"><span className="status-pill">{FIELD_STATUS_LABELS[f.field_status] ?? f.field_status}</span></td>
                    <td data-label="Last condition">{last?.field_condition ? label(last.field_condition) : '—'}</td>
                    <td data-label="Last report">{last ? new Date(last.report_date ?? last.created_at).toLocaleDateString() : 'No reports yet'}</td>
                    <td data-label="Actions" className="cell-actions">
                      <div className="row-actions">
                        <button type="button" onClick={() => setReporting(f.id)} className="row-btn is-edit"><ToolbarIcon name="plus" />Report</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="dash-card mt-4">
        <div className="dash-card-head">
          <h2>Submitted reports</h2>
          <span>{reports.length} {reports.length === 1 ? 'report' : 'reports'}</span>
        </div>
        {!loading && reports.length === 0 && <p className="dash-empty">No reports submitted yet.</p>}
        <ul className="dash-list">
          {reports.map((r) => (
            <li key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <Link to={`/fields/${r.field_id}`} className="dash-list-title">{r.field?.field_name ?? 'Field'}</Link>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${r.status === 'reviewed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{r.status === 'reviewed' ? 'validated' : 'awaiting review'}</span>
              </div>
              <p className="dash-list-meta">{new Date(r.report_date ?? r.created_at).toLocaleDateString()}</p>
              <ReportDetails report={r} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
