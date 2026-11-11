import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listReportsForField } from '../../services/reportService'
import { ReportDetails } from './ReportDetails'

// Read-only history of a field's monitoring reports. New reports are sent from the Monitoring page.
export function FieldReportsList({ fieldId }) {
  const [reports, setReports] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    listReportsForField(fieldId).then(setReports).catch((err) => setError(err.message))
  }, [fieldId])

  return (
    <div>
      <p className="mb-3 text-sm text-gray-600">
        Reports submitted for this field. To send a new one, go to <Link to="/monitoring" className="text-green-700 underline">Monitoring</Link>.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && reports === null && <p className="text-sm text-gray-500">Loading reports...</p>}
      {reports?.length === 0 && <p className="text-sm text-gray-500">No reports submitted yet.</p>}
      <ul className="flex flex-col gap-2">
        {reports?.map((r) => (
          <li key={r.id} className="rounded bg-gray-50 p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-gray-500">{new Date(r.report_date ?? r.created_at).toLocaleDateString()}</p>
              <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${r.status === 'reviewed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{r.status === 'reviewed' ? 'validated' : 'awaiting review'}</span>
            </div>
            <ReportDetails report={r} />
          </li>
        ))}
      </ul>
    </div>
  )
}
