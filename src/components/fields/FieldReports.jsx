import { useEffect, useState } from 'react'
import { listReportsForField } from '../../services/reportService'
import { ReportDetails } from './ReportDetails'
import { ReportForm } from './ReportForm'

export function FieldReports({ fieldId }) {
  const [reports, setReports] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    listReportsForField(fieldId).then(setReports).catch((err) => setError(err.message))
  }, [fieldId])

  return (
    <div>
      <p className="mb-2 text-sm text-gray-600">
        Submit a monitoring report on this field's condition, crop status, or harvest for LGU review.
      </p>
      <ReportForm fixedFieldId={fieldId} onSubmitted={(report) => setReports((prev) => [report, ...prev])} />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-3 flex flex-col gap-2">
        {reports.length === 0 && <li className="text-sm text-gray-500">No reports submitted yet.</li>}
        {reports.map((r) => (
          <li key={r.id} className="rounded bg-gray-50 p-2 text-sm">
            <ReportDetails report={r} />
            <p className="mt-1 text-xs text-gray-500">
              {new Date(r.report_date ?? r.created_at).toLocaleDateString()} ·{' '}
              <span className={r.status === 'reviewed' ? 'text-green-700' : 'text-amber-700'}>
                {r.status === 'reviewed' ? 'validated' : r.status}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
