import { useMemo } from 'react'
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
      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {FIELD_STATUSES.map((s) => (
          <div key={s} className="rounded border bg-white p-4 text-center">
            <p className="text-3xl font-semibold text-green-800">{loading ? '—' : byStatus[s] ?? 0}</p>
            <p className="text-sm font-medium">{FIELD_STATUS_LABELS[s]}</p>
            <p className="mt-1 text-xs text-gray-500">{DESCRIPTIONS[s]}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr><th className="p-2">Purok</th>{FIELD_STATUSES.map((s) => <th key={s} className="p-2">{FIELD_STATUS_LABELS[s]}</th>)}</tr>
          </thead>
          <tbody>
            {puroks.length === 0 && <tr><td colSpan={FIELD_STATUSES.length + 1} className="p-2 text-gray-500">No approved fields yet.</td></tr>}
            {puroks.map((p) => (
              <tr key={p} className="border-t"><td className="p-2">{p}</td>{FIELD_STATUSES.map((s) => <td key={s} className="p-2">{matrix[p][s] ?? 0}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
