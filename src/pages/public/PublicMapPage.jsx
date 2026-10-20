import { useMemo, useState } from 'react'
import { Select } from '../../components/common/Select'
import { PageHeader } from '../../components/layout/PageHeader'
import { MapView } from '../../components/maps/MapView'
import { FIELD_STATUSES, FIELD_STATUS_LABELS, PUROKS } from '../../lib/constants'
import { usePublicFields } from './publicData'

export function PublicMapPage() {
  const { rows, loading, error } = usePublicFields()
  const [search, setSearch] = useState('')
  const [purok, setPurok] = useState('')
  const [status, setStatus] = useState('')

  const fields = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows
      .filter((r) => (!purok || r.purok === purok) && (!status || r.field_status === status))
      .filter((r) => !term || [r.purok, r.crop_variety, r.irrigation_type, FIELD_STATUS_LABELS[r.field_status]].some((v) => v?.toLowerCase().includes(term)))
      .map((r, i) => ({
        id: i,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        field_name: `Rice field · ${r.purok}`,
        field_status: r.field_status,
        purok: r.purok,
        popup_lines: [
          r.area_hectares != null && `Area: ${r.area_hectares} ha`,
          r.crop_variety && `Variety: ${r.crop_variety}`,
        ].filter(Boolean),
      }))
  }, [rows, search, purok, status])

  return (
    <div className="page-container public-page wide-page">
      <PageHeader eyebrow="RICE FIELD MAP" title="Rice fields across Caganganan." description="LGU-approved fields only. Locations are approximate and no farmer information is shown." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="mb-4 flex flex-wrap gap-2">
        <input type="search" aria-label="Search fields" placeholder="Search purok, variety, status" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <Select aria-label="Filter by purok" value={purok} onChange={(e) => setPurok(e.target.value)} className="rounded border px-3 py-2 text-sm">
          <option value="">All puroks</option>
          {PUROKS.map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
        <Select aria-label="Filter by crop status" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border px-3 py-2 text-sm">
          <option value="">All crop statuses</option>
          {FIELD_STATUSES.map((s) => <option key={s} value={s}>{FIELD_STATUS_LABELS[s]}</option>)}
        </Select>
        <span className="self-center text-sm text-gray-600">{loading ? 'Loading...' : `${fields.length} ${fields.length === 1 ? 'field' : 'fields'}`}</span>
      </div>
      <MapView fields={fields} fieldLinkBase={null} size="large" />
    </div>
  )
}
