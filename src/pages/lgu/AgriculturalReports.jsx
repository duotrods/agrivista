import { useEffect, useMemo, useState } from 'react'
import { PeriodFilter } from '../../components/dashboard/PeriodFilter'
import { StatCard } from '../../components/dashboard/StatCard'
import { ToolbarIcon } from '../../components/dashboard/ToolbarIcon'
import { Select } from '../../components/common/Select'
import { FIELD_STATUSES, FIELD_STATUS_LABELS, HEALTH_STATUSES, PUROKS } from '../../lib/constants'
import { MONTHS, inPeriod as inPeriodOf, periodYears } from '../../lib/period'
import { listAllObservations } from '../../services/cropService'
import { listFarmerProfiles } from '../../services/adminService'
import { listAllFields } from '../../services/fieldService'
import { listAllReports } from '../../services/reportService'

const label = (value) => value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
const area = (fields) => fields.reduce((sum, f) => sum + Number(f.area_hectares ?? 0), 0)

function tally(items, keyFn) {
  const counts = new Map()
  for (const item of items) {
    const key = keyFn(item)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function AgriculturalReports() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [purok, setPurok] = useState('')

  useEffect(() => {
    Promise.all([listAllFields(), listFarmerProfiles(), listAllReports(), listAllObservations()])
      .then(([fields, farmers, reports, observations]) => setData({ fields, farmers, reports, observations }))
      .catch((err) => setError(err.message))
  }, [])

  const years = useMemo(() => (data ? periodYears([...data.fields.map((f) => f.created_at), ...data.reports.map((r) => r.report_date ?? r.created_at)]) : []), [data])
  const filtered = Boolean(year || month || purok)
  const periodText = [month && MONTHS[Number(month) - 1], year, purok].filter(Boolean).join(' ') || 'All data'

  // Fields and farmers are filtered by registration date, reports by report date.
  const view = useMemo(() => {
    if (!data) return null
    const inPeriod = (iso) => inPeriodOf(iso, year, month)
    const fields = data.fields.filter((f) => inPeriod(f.created_at) && (!purok || f.purok === purok))
    const fieldIds = new Set(fields.map((f) => f.id))
    const farmers = data.farmers.filter((p) => inPeriod(p.created_at) && (!purok || p.purok === purok))
    const reports = data.reports.filter((r) => inPeriod(r.report_date ?? r.created_at) && (!purok || r.field?.purok === purok))
    const observations = data.observations.filter((o) => fieldIds.has(o.cycle?.field_id))
    return { fields, farmers, reports, observations }
  }, [data, year, month, purok])

  const cards = view && [
    ['Rice fields', view.fields.length, 'fields', 'green', 'Registered fields.'],
    ['Approved fields', view.fields.filter((f) => f.is_verified).length, 'approved', 'green', 'Approved for Community.'],
    ['Pending review', view.fields.filter((f) => !f.is_verified && f.review_status === 'pending').length, 'pending', 'amber', 'Waiting for LGU review.'],
    ['Needs correction', view.fields.filter((f) => !f.is_verified && f.review_status === 'needs_correction').length, 'report', 'amber', 'Sent back to the farmer.'],
    ['Rejected', view.fields.filter((f) => !f.is_verified && f.review_status === 'rejected').length, 'pending', 'red', 'Not approved.'],
    ['Total area (ha)', area(view.fields).toFixed(2), 'area', 'green', 'Combined field area.'],
    ['Registered farmers', view.farmers.length, 'users', 'blue', 'Farmer accounts.'],
    ['Reports submitted', view.reports.length, 'report', 'blue', 'Monitoring reports.'],
  ]

  const sections = useMemo(() => {
    if (!view) return null
    const { fields, reports, observations } = view
    const statusCounts = tally(fields, (f) => f.field_status)
    const purokRows = [...new Set(fields.map((f) => f.purok ?? 'Unspecified'))].sort().map((name) => {
      const inPurok = fields.filter((f) => (f.purok ?? 'Unspecified') === name)
      return [name, inPurok.length, area(inPurok).toFixed(2)]
    })
    const latestHealth = new Map()
    for (const obs of observations) {
      const fieldId = obs.cycle?.field_id
      if (fieldId && !latestHealth.has(fieldId)) latestHealth.set(fieldId, obs.health_status)
    }
    const healthCounts = tally([...latestHealth.values()], (h) => h)
    const today = new Date().toISOString().slice(0, 10)
    const projections = new Map()
    for (const f of fields) {
      if (!f.expected_harvest || f.expected_harvest < today) continue
      const key = f.expected_harvest.slice(0, 7)
      const row = projections.get(key) ?? { count: 0, area: 0 }
      row.count += 1
      row.area += Number(f.area_hectares ?? 0)
      projections.set(key, row)
    }
    return [
      { title: 'Crop status', head: ['Status', 'Fields'], rows: FIELD_STATUSES.map((s) => [FIELD_STATUS_LABELS[s], statusCounts.get(s) ?? 0]) },
      { title: 'Field distribution by purok', head: ['Purok', 'Fields', 'Hectares'], rows: purokRows },
      { title: 'Field conditions', note: 'Latest observation', head: ['Condition', 'Fields'], rows: [
        ...HEALTH_STATUSES.map((h) => [label(h), healthCounts.get(h) ?? 0]),
        ['No observation yet', fields.length - latestHealth.size],
      ] },
      { title: 'Monitoring reports', head: ['Status', 'Reports'], rows: [
        ['Submitted', reports.length],
        ['Reviewed', reports.filter((r) => r.status === 'reviewed').length],
        ['Awaiting review', reports.filter((r) => r.status !== 'reviewed').length],
      ] },
      { title: 'Harvest projections', head: ['Expected month', 'Fields', 'Hectares'], rows: [...projections.entries()].sort().map(([key, v]) => [key, v.count, v.area.toFixed(2)]) },
    ]
  }, [view])

  function handleExport() {
    const lines = [csvCell('Period'), csvCell(periodText), '', csvCell('Summary'), 'Measure,Total']
    for (const [name, value] of cards) lines.push([name, value].map(csvCell).join(','))
    lines.push('')
    for (const section of sections) {
      lines.push(csvCell(section.title), section.head.map(csvCell).join(','))
      for (const row of section.rows) lines.push(row.map(csvCell).join(','))
      lines.push('')
    }
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `agrivista-agricultural-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-container">
      <div className="dash-toolbar print:hidden">
        <div>
          <h1 className="page-title">Agricultural reports</h1>
          <p className="page-description">A snapshot of rice fields, crops, farmers and harvests in Barangay Caganganan.</p>
        </div>
        <div className="toolbar">
          <PeriodFilter month={month} year={year} years={years} onMonth={setMonth} onYear={setYear} />
          <div className="tb-group">
            <span className="tb-icon"><ToolbarIcon name="pin" /></span>
            <Select aria-label="Filter by purok" value={purok} onChange={(e) => setPurok(e.target.value)} className="tb-select">
              <option value="">All puroks</option>
              {PUROKS.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>
          {purok && !month && !year && <button type="button" onClick={() => setPurok('')} className="tb-btn">Clear</button>}
          <button type="button" onClick={() => window.print()} disabled={!view} className="tb-btn"><ToolbarIcon name="print" />Print</button>
          <button type="button" onClick={handleExport} disabled={!view} className="tb-btn"><ToolbarIcon name="download" />Export CSV</button>
        </div>
      </div>
      <p className="mb-4 hidden text-sm print:block">Agricultural report · {periodText} · generated {new Date().toLocaleDateString()}</p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {!view && !error && <p className="dash-empty">Loading report...</p>}

      {view && (
        <>
          {filtered && <p className="dash-subtext print:hidden">Showing: {periodText}. Fields and farmers by registration date, reports by report date.</p>}
          <div className="grid grid-cols-2 items-stretch gap-4 lg:grid-cols-4">
            {cards.map(([name, value, icon, tone, description]) => (
              <StatCard key={name} label={name} value={value} description={description} icon={icon} tone={tone} />
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {sections.map((section) => (
              <section key={section.title} className="dash-card break-inside-avoid">
                <div className="dash-card-head">
                  <h2>{section.title}</h2>
                  {section.note && <span>{section.note}</span>}
                </div>
                <table className="dash-table">
                  <thead>
                    <tr>{section.head.map((h) => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {section.rows.length === 0 && <tr><td colSpan={section.head.length} className="dash-table-empty">No data.</td></tr>}
                    {section.rows.map((row) => (
                      <tr key={row[0]}>
                        {row.map((cell, i) => <td key={i}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
