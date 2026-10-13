import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReportDetails } from '../../components/fields/ReportDetails'
import { ReportForm } from '../../components/fields/ReportForm'
import { PageHeader } from '../../components/layout/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import { listFieldsForFarmer } from '../../services/fieldService'
import { listReportsForFarmer } from '../../services/reportService'

export function FarmerReports() {
  const { user } = useAuth()
  const [fields, setFields] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    Promise.all([listFieldsForFarmer(user.id), listReportsForFarmer()])
      .then(([f, r]) => { setFields(f); setReports(r) })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="page-container">
      <PageHeader title="Reports" description="Submit monitoring reports for LGU review and track their status." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <section className="mb-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">New report</h2>
        {!loading && fields.length === 0
          ? <p className="text-sm text-gray-500">Register a field first. <Link to="/fields/new" className="text-green-700 underline">Add field</Link></p>
          : !loading && <ReportForm fields={fields} onSubmitted={(r) => setReports((prev) => [r, ...prev])} />}
      </section>
      <h2 className="mb-2 text-lg font-medium">Submitted reports</h2>
      <ul className="flex flex-col gap-2">
        {!loading && reports.length === 0 && <li className="text-sm text-gray-500">No reports submitted yet.</li>}
        {reports.map((r) => (
          <li key={r.id} className="rounded border p-3">
            <div className="flex items-start justify-between gap-3">
              <Link to={`/fields/${r.field_id}`} className="font-medium text-green-700 hover:underline">{r.field?.field_name ?? 'Field'}</Link>
              <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${r.status === 'reviewed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{r.status === 'reviewed' ? 'validated' : 'awaiting review'}</span>
            </div>
            <p className="text-xs text-gray-500">{new Date(r.report_date ?? r.created_at).toLocaleDateString()}</p>
            <ReportDetails report={r} />
          </li>
        ))}
      </ul>
    </div>
  )
}
