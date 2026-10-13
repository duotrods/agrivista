import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ARFieldView } from '../../components/ar/ARFieldView'
import { ReportDetails } from '../../components/fields/ReportDetails'
import { PageHeader } from '../../components/layout/PageHeader'
import { StatsPanel } from '../../components/dashboard/StatsPanel'
import { isReadyToHarvest } from '../../lib/helpers'
import { listFarmerProfiles } from '../../services/adminService'
import { listAllFields } from '../../services/fieldService'
import { listAllReports } from '../../services/reportService'

function Stat({ label, value, loading, to }) {
  const body = (
    <>
      <p className="text-3xl font-semibold text-green-800">{loading ? '—' : value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </>
  )
  const cls = 'block rounded border bg-white p-4 text-center'
  return to ? <Link to={to} className={`${cls} hover:bg-green-50`}>{body}</Link> : <div className={cls}>{body}</div>
}

export function LGUDashboard() {
  const [fields, setFields] = useState([])
  const [farmers, setFarmers] = useState([])
  const [reports, setReports] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAR, setShowAR] = useState(false)

  useEffect(() => {
    Promise.all([listAllFields(), listFarmerProfiles(), listAllReports()])
      .then(([f, p, r]) => { setFields(f); setFarmers(p); setReports(r) })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const count = (status) => fields.filter((f) => f.field_status === status).length
  const pendingCount = fields.filter((f) => !f.is_verified && f.review_status === 'pending').length

  return (
    <div className="page-container">
      <div className="dashboard-heading mb-4 flex items-center justify-between print:hidden">
        <PageHeader title="Dashboard" description="A connected view of rice fields across Barangay Caganganan." />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowAR(true)} className="rounded border border-green-700 px-3 py-2 text-sm text-green-700 hover:bg-green-50">View in AR</button>
          <Link to="/lgu/announcements" className="rounded border px-3 py-2 text-sm hover:bg-gray-50">Announcements</Link>
          <Link to="/lgu/settings" className="rounded border px-3 py-2 text-sm hover:bg-gray-50">Settings</Link>
          <button type="button" onClick={() => window.print()} className="rounded border px-3 py-2 text-sm hover:bg-gray-50">Print dashboard</button>
        </div>
      </div>
      <h1 className="mb-4 hidden text-2xl font-semibold text-green-800 print:block">AgriVista — Rice Field Report</h1>
      {showAR && <ARFieldView fields={fields} linkBase="/lgu/fields" onClose={() => setShowAR(false)} />}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total rice fields" value={fields.length} loading={loading} to="/lgu/fields" />
        <Stat label="Total farmers" value={farmers.length} loading={loading} to="/lgu/users" />
        <Stat label="Pending verification" value={pendingCount} loading={loading} to="/lgu/verify" />
        <Stat label="Unplanted (fallow)" value={count('fallow') + count('land_prep')} loading={loading} />
        <Stat label="Planted" value={count('planted')} loading={loading} />
        <Stat label="Growing" value={count('growing')} loading={loading} />
        <Stat label="Ready to harvest" value={fields.filter(isReadyToHarvest).length} loading={loading} to="/lgu/crop-monitoring" />
        <Stat label="Reports awaiting validation" value={reports.filter((r) => r.status !== 'reviewed').length} loading={loading} to="/lgu/reports" />
      </div>

      <section className="mb-6 rounded border p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent monitoring reports</h2>
          <Link to="/lgu/reports" className="text-sm text-green-700 hover:underline">View all</Link>
        </div>
        {!loading && reports.length === 0 && <p className="text-sm text-gray-500">No reports submitted yet.</p>}
        <ul className="flex flex-col gap-2">
          {reports.slice(0, 4).map((r) => (
            <li key={r.id} className="rounded bg-gray-50 p-2">
              <Link to={`/lgu/fields/${r.field_id}`} className="text-sm font-medium text-green-700 hover:underline">{r.field?.field_name ?? 'Unknown field'}</Link>
              <span className="text-xs text-gray-500"> · {r.submitter?.full_name ?? 'Unknown farmer'} · {new Date(r.report_date ?? r.created_at).toLocaleDateString()}</span>
              <ReportDetails report={r} />
            </li>
          ))}
        </ul>
      </section>

      <StatsPanel fields={fields} />
    </div>
  )
}
