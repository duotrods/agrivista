import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Select } from '../../components/common/Select'
import { PageHeader } from '../../components/layout/PageHeader'
import { FIELD_STATUSES, FIELD_STATUS_LABELS, PUROKS } from '../../lib/constants'
import { listAllFields } from '../../services/fieldService'
import { reviewBadge } from '../../lib/reviewBadge'

const reviewKey = (f) => (f.is_verified ? 'approved' : f.review_status ?? 'pending')

export function RiceFields() {
  const [fields, setFields] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [purok, setPurok] = useState('')
  const [status, setStatus] = useState('')
  const [review, setReview] = useState('')

  useEffect(() => {
    listAllFields().then(setFields).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return fields.filter((f) => (!purok || f.purok === purok) && (!status || f.field_status === status) && (!review || reviewKey(f) === review)
      && (!term || [f.field_name, f.farmer?.full_name].some((v) => v?.toLowerCase().includes(term))))
  }, [fields, search, purok, status, review])

  return (
    <div className="page-container">
      <PageHeader title="Rice fields" description="All registered rice fields in Barangay Caganganan." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="mb-4 flex flex-wrap gap-2">
        <input type="search" aria-label="Search fields" placeholder="Search field or farmer" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <Select aria-label="Filter by purok" value={purok} onChange={(e) => setPurok(e.target.value)} className="rounded border px-3 py-2 text-sm">
          <option value="">All puroks</option>
          {PUROKS.map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
        <Select aria-label="Filter by crop status" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border px-3 py-2 text-sm">
          <option value="">All crop statuses</option>
          {FIELD_STATUSES.map((s) => <option key={s} value={s}>{FIELD_STATUS_LABELS[s]}</option>)}
        </Select>
        <Select aria-label="Filter by review status" value={review} onChange={(e) => setReview(e.target.value)} className="rounded border px-3 py-2 text-sm">
          <option value="">All review statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="needs_correction">Needs correction</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>
      <ul className="flex flex-col gap-2">
        {loading && <li className="text-gray-500">Loading fields...</li>}
        {!loading && visible.length === 0 && <li className="text-gray-500">No fields match these filters.</li>}
        {visible.map((field) => {
          const [text, tone] = reviewBadge(field)
          return (
            <li key={field.id} className="flex items-center justify-between gap-3 rounded border px-3 py-2">
              <div className="min-w-0">
                <Link to={`/lgu/fields/${field.id}`} className="text-green-700 hover:underline">{field.field_name}</Link>
                <p className="text-xs text-gray-500">{field.farmer?.full_name ?? 'Unknown farmer'} · {field.purok ?? '—'} · {FIELD_STATUS_LABELS[field.field_status] ?? field.field_status}</p>
              </div>
              <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${tone}`}>{text}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
