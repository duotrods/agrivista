import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Select } from '../../components/common/Select'
import { PageHeader } from '../../components/layout/PageHeader'
import { FIELD_STATUSES, FIELD_STATUS_LABELS, PUROKS } from '../../lib/constants'
import { listAllFields } from '../../services/fieldService'
import { reviewBadge } from '../../lib/reviewBadge'

const VIEWS = [
  ['list', 'List', 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'],
  ['grid', 'Grid', 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'],
  ['table', 'Table', 'M3 5h18v14H3zM3 10h18M9 5v14'],
]
const VIEW_KEY = 'agrivista.riceFieldsView'

function readView() {
  try {
    const saved = localStorage.getItem(VIEW_KEY)
    return VIEWS.some(([id]) => id === saved) ? saved : 'list'
  } catch { return 'list' }
}

const reviewKey = (f) => (f.is_verified ? 'approved' : f.review_status ?? 'pending')

export function RiceFields() {
  const [fields, setFields] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [purok, setPurok] = useState('')
  const [status, setStatus] = useState('')
  const [review, setReview] = useState('')
  const [view, setView] = useState(readView)

  useEffect(() => {
    listAllFields().then(setFields).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [])

  function changeView(next) {
    setView(next)
    try { localStorage.setItem(VIEW_KEY, next) } catch { /* storage unavailable */ }
  }

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
        <div className="ml-auto flex overflow-hidden rounded border border-[#d6ded5] bg-white" role="group" aria-label="View as">
          {VIEWS.map(([id, label, path]) => (
            <button key={id} type="button" onClick={() => changeView(id)} aria-pressed={view === id} title={`${label} view`}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm ${view === id ? 'bg-green-50 font-semibold text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
      {loading && <p className="text-gray-500">Loading fields...</p>}
      {!loading && visible.length === 0 && <p className="text-gray-500">No fields match these filters.</p>}
      {view === 'grid' && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((field) => {
            const [text, tone] = reviewBadge(field)
            return (
              <li key={field.id} className="flex flex-col gap-2 rounded border bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/lgu/fields/${field.id}`} className="min-w-0 truncate font-medium text-green-700 hover:underline">{field.field_name}</Link>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${tone}`}>{text}</span>
                </div>
                <p className="text-sm text-gray-600">{field.farmer?.full_name ?? 'Unknown farmer'}</p>
                <p className="text-xs text-gray-500">{field.purok ?? '—'} · {FIELD_STATUS_LABELS[field.field_status] ?? field.field_status}{field.area_hectares != null && ` · ${field.area_hectares} ha`}</p>
              </li>
            )
          })}
        </ul>
      )}
      {view === 'table' && visible.length > 0 && (
        <div className="overflow-x-auto rounded border">
          <table className="responsive-table w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr><th className="p-2">Field</th><th className="p-2">Farmer</th><th className="p-2">Purok</th><th className="p-2">Crop status</th><th className="p-2">Area</th><th className="p-2">Review</th></tr>
            </thead>
            <tbody>
              {visible.map((field) => {
                const [text, tone] = reviewBadge(field)
                return (
                  <tr key={field.id} className="border-t">
                    <td data-label="Field" className="p-2"><Link to={`/lgu/fields/${field.id}`} className="text-green-700 hover:underline">{field.field_name}</Link></td>
                    <td data-label="Farmer" className="p-2">{field.farmer?.full_name ?? 'Unknown farmer'}</td>
                    <td data-label="Purok" className="p-2">{field.purok ?? '—'}</td>
                    <td data-label="Crop status" className="p-2">{FIELD_STATUS_LABELS[field.field_status] ?? field.field_status}</td>
                    <td data-label="Area" className="p-2">{field.area_hectares != null ? `${field.area_hectares} ha` : '—'}</td>
                    <td data-label="Review" className="p-2"><span className={`rounded px-2 py-0.5 text-xs ${tone}`}>{text}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {view === 'list' && <ul className="flex flex-col gap-2">
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
      </ul>}
    </div>
  )
}
