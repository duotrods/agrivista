import { Suspense, useMemo } from 'react'
import { StatCard } from '../../components/dashboard/StatCard'
import { PurokCountChart, StatusCountDonut, chartFallback } from '../../components/dashboard/lazyCharts'
import { PageHero } from './PageHero'
import { PHOTOS, usePublicFields, usePublicStats } from './publicData'

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
  const activeCrops = (statusTotals(byStatus, 'planted') + statusTotals(byStatus, 'growing'))
  const pending = loading || Boolean(error)

  return (
    <div className="lp">
      <PageHero chip="GENERAL STATISTICS · CAGANGANAN" title="Rice farming at a glance." text="Only LGU-approved fields contribute to these summaries; individual farmer records stay private." photo={PHOTOS.harvest} />
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="lp-block grid grid-cols-2 items-stretch gap-4 lg:grid-cols-4">
        <StatCard icon="approved" label="Approved rice fields" description="Verified by the LGU." value={totalFields} loading={pending} />
        <StatCard icon="area" label="Hectares of rice land" description="Across approved fields." value={totalHectares.toFixed(1)} loading={pending} />
        <StatCard icon="map" tone="blue" label="Puroks covered" description="With an approved field." value={byPurok.length} loading={pending} />
        <StatCard icon="sprout" label="Planted & growing" description="Crops now in the field." value={activeCrops} loading={pending} />
      </div>

      {!pending && totalFields === 0 && <p className="dash-empty">No approved fields yet. Fields will appear here after LGU review.</p>}
      {totalFields > 0 && (
        <div className="lp-block grid gap-4 lg:grid-cols-2">
          <Suspense fallback={chartFallback}><PurokCountChart data={byPurok} title="Approved fields by purok" subtitle="Verified fields" /></Suspense>
          <Suspense fallback={chartFallback}><StatusCountDonut data={byStatus} /></Suspense>
        </div>
      )}
    </div>
  )
}

function statusTotals(list, key) {
  return list.find((item) => item.name === key)?.value ?? 0
}
