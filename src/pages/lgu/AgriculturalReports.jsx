import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { FIELD_STATUSES, FIELD_STATUS_LABELS, HEALTH_STATUSES } from '../../lib/constants'
import { listAllObservations } from '../../services/cropService'
import { listFarmerProfiles } from '../../services/adminService'
import { listAllFields } from '../../services/fieldService'
import { listAllReports } from '../../services/reportService'

const label = (value) => value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())

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

  useEffect(() => {
    Promise.all([listAllFields(), listFarmerProfiles(), listAllReports(), listAllObservations()])
      .then(([fields, farmers, reports, observations]) => setData({ fields, farmers, reports, observations }))
      .catch((err) => setError(err.message))
  }, [])

  const report = useMemo(() => {
    if (!data) return null
    const { fields, farmers, reports, observations } = data
    const statusCounts = tally(fields, (f) => f.field_status)
    const purokRows = [...new Set(fields.map((f) => f.purok ?? 'Unspecified'))].sort().map((purok) => {
      const inPurok = fields.filter((f) => (f.purok ?? 'Unspecified') === purok)
      return [purok, inPurok.length, inPurok.reduce((sum, f) => sum + Number(f.area_hectares ?? 0), 0).toFixed(2)]
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
      const month = f.expected_harvest.slice(0, 7)
      const row = projections.get(month) ?? { count: 0, area: 0 }
      row.count += 1
      row.area += Number(f.area_hectares ?? 0)
      projections.set(month, row)
    }
    const sections = [
      { title: 'Summary', head: ['Measure', 'Total'], rows: [
        ['Rice fields', fields.length],
        ['Approved fields', fields.filter((f) => f.is_verified).length],
        ['Pending review', fields.filter((f) => !f.is_verified && f.review_status === 'pending').length],
        ['Needs correction', fields.filter((f) => !f.is_verified && f.review_status === 'needs_correction').length],
        ['Rejected', fields.filter((f) => !f.is_verified && f.review_status === 'rejected').length],
        ['Total area (ha)', fields.reduce((sum, f) => sum + Number(f.area_hectares ?? 0), 0).toFixed(2)],
        ['Registered farmers', farmers.length],
      ] },
      { title: 'Crop status', head: ['Status', 'Fields'], rows: FIELD_STATUSES.map((s) => [FIELD_STATUS_LABELS[s], statusCounts.get(s) ?? 0]) },
      { title: 'Field distribution by purok', head: ['Purok', 'Fields', 'Hectares'], rows: purokRows },
      { title: 'Field conditions (latest observation)', head: ['Condition', 'Fields'], rows: [
        ...HEALTH_STATUSES.map((h) => [label(h), healthCounts.get(h) ?? 0]),
        ['No observation yet', fields.length - latestHealth.size],
      ] },
      { title: 'Monitoring reports', head: ['Status', 'Reports'], rows: [
        ['Submitted', reports.length],
        ['Reviewed', reports.filter((r) => r.status === 'reviewed').length],
        ['Awaiting review', reports.filter((r) => r.status !== 'reviewed').length],
      ] },
      { title: 'Harvest projections', head: ['Expected month', 'Fields', 'Hectares'], rows: [...projections.entries()].sort().map(([month, v]) => [month, v.count, v.area.toFixed(2)]) },
    ]
    return sections
  }, [data])

  function handleExport() {
    const lines = []
    for (const section of report) {
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <PageHeader title="Agricultural reports" description="A snapshot of rice fields, crops, farmers and harvests in Barangay Caganganan." />
        <div className="flex gap-2 print:hidden">
          <button type="button" onClick={() => window.print()} disabled={!report} className="rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">Print</button>
          <button type="button" onClick={handleExport} disabled={!report} className="rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50">Export CSV</button>
        </div>
      </div>
      <p className="mb-4 hidden text-sm print:block">Generated {new Date().toLocaleDateString()}</p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {!report && !error && <p className="text-gray-500">Loading report...</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {report?.map((section) => (
          <section key={section.title} className="break-inside-avoid rounded border p-4">
            <h2 className="mb-2 text-lg font-medium">{section.title}</h2>
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500">
                <tr>{section.head.map((h) => <th key={h} className="py-1 pr-2 font-normal">{h}</th>)}</tr>
              </thead>
              <tbody>
                {section.rows.length === 0 && <tr><td colSpan={section.head.length} className="py-1 text-gray-500">No data.</td></tr>}
                {section.rows.map((row) => (
                  <tr key={row[0]} className="border-t">
                    {row.map((cell, i) => <td key={i} className="py-1 pr-2">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  )
}
