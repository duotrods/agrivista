import { useMemo } from 'react'
import { StatCard } from '../../components/dashboard/StatCard'
import { STATUS_CARDS } from '../../components/dashboard/statusCards'
import { FIELD_STATUSES, FIELD_STATUS_COLORS, FIELD_STATUS_LABELS } from '../../lib/constants'
import { PageHero } from './PageHero'
import { PHOTOS, usePublicStats } from './publicData'

const DESCRIPTIONS = {
  fallow: 'Not currently planted.',
  land_prep: 'The field is being prepared for planting.',
  planted: 'Seedlings or seeds are in the field.',
  growing: 'The crop is growing toward harvest.',
  harvested: 'The crop has been harvested.',
}

export function CropStatusPage() {
  const { rows, loading, error } = usePublicStats()
  const { byStatus, puroks, matrix, total } = useMemo(() => {
    const byStatus = {}
    const matrix = {}
    let total = 0
    for (const row of rows) {
      const n = Number(row.field_count)
      total += n
      byStatus[row.field_status] = (byStatus[row.field_status] ?? 0) + n
      matrix[row.purok] = { ...matrix[row.purok], [row.field_status]: n }
    }
    return { byStatus, puroks: Object.keys(matrix).sort(), matrix, total }
  }, [rows])
  const pending = loading || Boolean(error)

  return (
    <div className="lp">
      <PageHero chip="CROP STATUS" title="Where our rice crops stand." text="Counts of LGU-approved fields at each stage of the crop cycle." photo={PHOTOS.paddy} />
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="lp-block grid grid-cols-2 items-stretch gap-4 md:grid-cols-3 xl:grid-cols-5">
        {FIELD_STATUSES.map((s) => (
          <StatCard key={s} {...STATUS_CARDS[s]} description={DESCRIPTIONS[s]} label={FIELD_STATUS_LABELS[s]} value={byStatus[s] ?? 0} loading={pending} />
        ))}
      </div>

      {total > 0 && (
        <section className="dash-card lp-block">
          <div className="dash-card-head">
            <h2>Share of fields by stage</h2>
            <span>{total} approved {total === 1 ? 'field' : 'fields'}</span>
          </div>
          <div className="stage-bar" role="img" aria-label="Share of fields by crop stage">
            {FIELD_STATUSES.filter((s) => byStatus[s]).map((s) => (
              <span key={s} style={{ width: `${(byStatus[s] / total) * 100}%`, background: FIELD_STATUS_COLORS[s] }} title={`${FIELD_STATUS_LABELS[s]}: ${byStatus[s]}`} />
            ))}
          </div>
          <ul className="stage-legend">
            {FIELD_STATUSES.map((s) => (
              <li key={s}><i style={{ background: FIELD_STATUS_COLORS[s] }} />{FIELD_STATUS_LABELS[s]} <b>{Math.round(((byStatus[s] ?? 0) / total) * 100)}%</b></li>
            ))}
          </ul>
        </section>
      )}

      <section className="dash-card lp-block">
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
                <tr key={p}><td>{p}</td>{FIELD_STATUSES.map((s) => <td key={s} className={matrix[p][s] ? undefined : 'is-zero'}>{matrix[p][s] ?? 0}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
