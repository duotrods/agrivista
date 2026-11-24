import { useMemo, useState } from 'react'
import { Select } from '../common/Select'
import { ToolbarIcon } from '../dashboard/ToolbarIcon'
import { FIELD_STATUSES, FIELD_STATUS_LABELS, PUROKS } from '../../lib/constants'
import { MapView } from './MapView'

// A map of fields with search and purok/status filters, shared by the farmer and LGU map pages.
export function FieldFilterMap({ fields, fieldLinkBase }) {
  const [search, setSearch] = useState('')
  const [purok, setPurok] = useState('')
  const [status, setStatus] = useState('')
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return fields.filter((f) => (!purok || f.purok === purok) && (!status || f.field_status === status)
      && (!term || [f.field_name, f.farmer?.full_name, f.purok, f.crop_variety].some((v) => v?.toLowerCase().includes(term))))
  }, [fields, search, purok, status])

  return (
    <div>
      <div className="toolbar toolbar-start">
        <div className="tb-group">
          <span className="tb-icon"><ToolbarIcon name="search" /></span>
          <input type="search" aria-label="Search fields" placeholder="Search name, farmer, purok, variety" value={search} onChange={(e) => setSearch(e.target.value)} className="tb-input" />
        </div>
        <div className="tb-group">
          <span className="tb-icon"><ToolbarIcon name="pin" /></span>
          <Select aria-label="Filter by purok" value={purok} onChange={(e) => setPurok(e.target.value)} className="tb-select">
            <option value="">All puroks</option>
            {PUROKS.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </div>
        <div className="tb-group">
          <Select aria-label="Filter by crop status" value={status} onChange={(e) => setStatus(e.target.value)} className="tb-select">
            <option value="">All crop statuses</option>
            {FIELD_STATUSES.map((s) => <option key={s} value={s}>{FIELD_STATUS_LABELS[s]}</option>)}
          </Select>
        </div>
        {(search || purok || status) && <button type="button" onClick={() => { setSearch(''); setPurok(''); setStatus('') }} className="tb-btn">Clear</button>}
        <span className="tb-count">{visible.length} {visible.length === 1 ? 'field' : 'fields'}</span>
      </div>
      <MapView fields={visible} fieldLinkBase={fieldLinkBase} size="large" />
    </div>
  )
}
