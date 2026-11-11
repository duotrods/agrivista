import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ARFieldView } from '../../components/ar/ARFieldView'
import { PeriodFilter } from '../../components/dashboard/PeriodFilter'
import { ToolbarIcon } from '../../components/dashboard/ToolbarIcon'
import { StatCard } from '../../components/dashboard/StatCard'
import { FIELD_STATUS_LABELS } from '../../lib/constants'
import { isReadyToHarvest } from '../../lib/helpers'
import { inPeriod as inPeriodOf, periodYears } from '../../lib/period'
import { listFarmerProfiles } from '../../services/adminService'
import { listAllFields } from '../../services/fieldService'
import { listAllReports } from '../../services/reportService'

const label = (value) => value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())

const lazyChart = (name) => lazy(() => import('../../components/dashboard/DashboardCharts').then((m) => ({ default: m[name] })))
const ConditionChart = lazyChart('ConditionChart')
const PurokChart = lazyChart('PurokChart')
const StatusDonut = lazyChart('StatusDonut')
const chartFallback = <div className="dash-card dash-empty">Loading chart...</div>

export function LGUDashboard() {
  const [fields, setFields] = useState([])
  const [farmers, setFarmers] = useState([])
  const [reports, setReports] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAR, setShowAR] = useState(false)
  // The dashboard opens on the current month; clear the filter to see everything.
  const [year, setYear] = useState(() => String(new Date().getFullYear()))
  const [month, setMonth] = useState(() => String(new Date().getMonth() + 1))

  useEffect(() => {
    Promise.all([listAllFields(), listFarmerProfiles(), listAllReports()])
      .then(([f, p, r]) => { setFields(f); setFarmers(p); setReports(r) })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Fields and farmers are filtered by when they registered, reports by report date.
  const inPeriod = (iso) => inPeriodOf(iso, year, month)
  const periodFields = fields.filter((f) => inPeriod(f.created_at))
  const periodFarmers = farmers.filter((p) => inPeriod(p.created_at))
  const periodReports = reports.filter((r) => inPeriod(r.report_date ?? r.created_at))
  const years = periodYears([...fields.map((f) => f.created_at), ...reports.map((r) => r.report_date ?? r.created_at)])
  const filtered = Boolean(year || month)

  const count = (status) => periodFields.filter((f) => f.field_status === status).length
  const approvedCount = periodFields.filter((f) => f.is_verified).length
  const readyCount = periodFields.filter(isReadyToHarvest).length
  const awaitingCount = periodReports.filter((r) => r.status !== 'reviewed').length
  const totalHectares = periodFields.reduce((sum, f) => sum + (f.area_hectares ?? 0), 0).toFixed(1)
  const pendingCount = periodFields.filter((f) => !f.is_verified && f.review_status === 'pending').length

  return (
    <div className="page-container">
      <div className="dash-toolbar print:hidden">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">A connected view of rice fields across Barangay Caganganan.</p>
        </div>
        <div className="toolbar">
          <PeriodFilter month={month} year={year} years={years} onMonth={setMonth} onYear={setYear} />
          <button type="button" onClick={() => setShowAR(true)} className="tb-btn"><ToolbarIcon name="ar" />View in AR</button>
          <button type="button" onClick={() => window.print()} className="tb-btn"><ToolbarIcon name="print" />Print</button>
        </div>
      </div>
      <h1 className="mb-4 hidden text-2xl font-semibold text-green-800 print:block">AgriVista — Rice Field Report</h1>
      {showAR && <ARFieldView fields={fields} linkBase="/lgu/fields" onClose={() => setShowAR(false)} />}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 items-stretch gap-4 lg:grid-cols-4">
        <StatCard icon="fields" label="Total rice fields" description="Registered fields in this period." value={periodFields.length} loading={loading} to="/lgu/fields" />
        <StatCard icon="approved" label="Approved fields" description="Fields approved for Community." value={approvedCount} loading={loading} to="/lgu/fields" pill={periodFields.length ? `${Math.round((approvedCount / periodFields.length) * 100)}%` : undefined} />
        <StatCard icon="pending" tone="amber" label="Pending verification" description="Waiting for LGU review." value={pendingCount} loading={loading} to="/lgu/verify" pill={pendingCount > 0 ? 'Needs review' : undefined} />
        <StatCard icon="users" tone="blue" label="Total farmers" description="Farmer accounts registered." value={periodFarmers.length} loading={loading} to="/lgu/users" />
        <StatCard icon="area" label="Total hectares" description="Combined area of all fields." value={totalHectares} loading={loading} />
        <StatCard icon="sprout" label="Planted & growing" description="Fields currently in the crop cycle." value={count('planted') + count('growing')} loading={loading} />
        <StatCard icon="harvest" tone="amber" label="Ready to harvest" description="Fields due for harvest." value={readyCount} loading={loading} to="/lgu/crop-monitoring" pill={readyCount > 0 ? 'Due' : undefined} />
        <StatCard icon="report" tone="red" label="Reports awaiting validation" description="Monitoring reports not yet validated." value={awaitingCount} loading={loading} to="/lgu/reports" pill={awaitingCount > 0 ? 'To validate' : undefined} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <Suspense fallback={chartFallback}><ConditionChart reports={periodReports} /></Suspense>
        </div>
        <div>
          <Suspense fallback={chartFallback}><StatusDonut fields={periodFields} /></Suspense>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <Suspense fallback={chartFallback}><PurokChart fields={periodFields} /></Suspense>
        </div>
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Recent monitoring reports</h2>
            <Link to="/lgu/reports" className="dash-link">View all</Link>
          </div>
          {!loading && periodReports.length === 0 && <p className="dash-empty">{filtered ? 'No reports in this period.' : 'No reports submitted yet.'}</p>}
          <ul className="dash-list">
            {periodReports.slice(0, 5).map((r) => (
              <li key={r.id}>
                <Link to={`/lgu/fields/${r.field_id}`} className="dash-list-title">{r.field?.field_name ?? 'Unknown field'}</Link>
                <span className="dash-list-meta"> · {r.submitter?.full_name ?? 'Unknown farmer'} · {new Date(r.report_date ?? r.created_at).toLocaleDateString()}</span>
                <p className="dash-list-meta mt-0.5 truncate">
                  {[r.crop_status && (FIELD_STATUS_LABELS[r.crop_status] ?? r.crop_status), r.field_condition && label(r.field_condition), r.summary].filter(Boolean).join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
