import { useMemo } from 'react'
import { StatCard } from '../../components/dashboard/StatCard'
import { STATUS_CARDS } from '../../components/dashboard/statusCards'
import { PageHeader } from '../../components/layout/PageHeader'
import { FIELD_STATUSES, FIELD_STATUS_LABELS } from '../../lib/constants'
import { usePublicStats } from './publicData'

const DESCRIPTIONS = {
  fallow: 'Not currently planted.',
  land_prep: 'The field is being prepared for planting.',
  planted: 'Seedlings or seeds are in the field.',
  growing: 'The crop is growing toward harvest.',
  harvested: 'The crop has been harvested.',
}

export function CropStatusPage() {
  const { rows, loading, error } = usePublicStats()
  const { byStatus, puroks, matrix } = useMemo(() => {
    const byStatus = {}
    const matrix = {}
    for (const row of rows) {
      const n = Number(row.field_count)
      byStatus[row.field_status] = (byStatus[row.field_status] ?? 0) + n
      matrix[row.purok] = { ...matrix[row.purok], [row.field_status]: n }
    }
    return { byStatus, puroks: Object.keys(matrix).sort(), matrix }
  }, [rows])

  return (
    <div className="page-container public-page">
      <PageHeader eyebrow="CROP STATUS" title="Where our rice crops stand." description="Counts of LGU-approved fields at each stage of the crop cycle." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 items-stretch gap-4 md:grid-cols-3 xl:grid-cols-5">
        {FIELD_STATUSES.map((s) => (
          <StatCard key={s} {...STATUS_CARDS[s]} description={DESCRIPTIONS[s]} label={FIELD_STATUS_LABELS[s]} value={byStatus[s] ?? 0} loading={loading || Boolean(error)} />
        ))}
      </div>
      <section className="dash-card mt-4">
        <div className="dash-card-head">
          <h2>Crop status by purok</h2>
          <span>Approved fields</span>
        </div>
        <div className="overflow-x-auto">
          <table className="dash-table">
            <thead>
              <tr><th>Purok</th>{FIELD_STATUSES.map((s) => <th key={s}>{FIELD_STATUS_LABELS[s]}</th>)}</tr>
            </thead>
            <tbody>
              {puroks.length === 0 && <tr><td colSpan={FIELD_STATUSES.length + 1} className="dash-table-empty">No approved fields yet.</td></tr>}
              {puroks.map((p) => (
                <tr key={p}><td>{p}</td>{FIELD_STATUSES.map((s) => <td key={s}>{matrix[p][s] ?? 0}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
