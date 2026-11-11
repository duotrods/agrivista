import { Suspense, useMemo } from 'react'
import { StatCard } from '../../components/dashboard/StatCard'
import { PurokCountChart, StatusCountDonut, chartFallback } from '../../components/dashboard/lazyCharts'
import { PageHeader } from '../../components/layout/PageHeader'
import { usePublicFields, usePublicStats } from './publicData'

export function StatisticsPage() {
  const { rows, loading, error } = usePublicStats()
  const { rows: fields } = usePublicFields()
  const { byPurok, byStatus } = useMemo(() => {
    const purokTotals = {}
    const statusTotals = {}
    for (const row of rows) {
      const n = Number(row.field_count)
      purokTotals[row.purok] = (purokTotals[row.purok] ?? 0) + n
      statusTotals[row.field_status] = (statusTotals[row.field_status] ?? 0) + n
    }
    const toList = (totals) => Object.entries(totals).map(([name, value]) => ({ name, value }))
    return { byPurok: toList(purokTotals), byStatus: toList(statusTotals) }
  }, [rows])
  const totalFields = byPurok.reduce((sum, r) => sum + r.value, 0)
  const totalHectares = fields.reduce((sum, f) => sum + Number(f.area_hectares ?? 0), 0)
  const pending = loading || error

  return (
    <div className="page-container public-page">
      <PageHeader eyebrow="GENERAL STATISTICS · CAGANGANAN" title="Rice farming at a glance." description="Only LGU-approved fields contribute to these summaries; individual farmer records stay private." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-3">
        <StatCard icon="approved" label="Approved rice fields" description="Verified by the LGU." value={totalFields} loading={pending} />
        <StatCard icon="area" label="Hectares of rice land" description="Across approved fields." value={totalHectares.toFixed(1)} loading={pending} />
        <StatCard icon="map" tone="blue" label="Puroks covered" description="With at least one approved field." value={byPurok.length} loading={pending} />
      </div>
      {!pending && totalFields === 0 && <p className="dash-empty">No approved fields yet. Fields will appear here after LGU review.</p>}
      {totalFields > 0 && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Suspense fallback={chartFallback}><PurokCountChart data={byPurok} title="Approved fields by purok" subtitle="Verified fields" /></Suspense>
          <Suspense fallback={chartFallback}><StatusCountDonut data={byStatus} /></Suspense>
        </div>
      )}
    </div>
  )
}
