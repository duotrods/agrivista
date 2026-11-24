import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { FIELD_STATUS_LABELS } from '../../lib/constants'
import { listAllFields } from '../../services/fieldService'

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'needs_correction', label: 'Needs correction' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'approved', label: 'Approved' },
]

function reviewKey(field) {
  return field.is_verified ? 'approved' : field.review_status ?? 'pending'
}

export function VerifyFields() {
  const [fields, setFields] = useState([])
  const [tab, setTab] = useState('pending')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAllFields()
      .then(setFields)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(() => {
    const totals = { pending: 0, needs_correction: 0, rejected: 0, approved: 0 }
    for (const field of fields) totals[reviewKey(field)] += 1
    return totals
  }, [fields])
  const visible = fields.filter((field) => reviewKey(field) === tab)

  return (
    <div className="page-container">
      <PageHeader title="Verify fields" description="Review newly registered and updated rice fields before they appear in Community." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="toolbar toolbar-start" role="tablist" aria-label="Review status">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`tb-btn${tab === key ? ' is-primary' : ''}`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>
      <section className="dash-card">
        <div className="dash-card-head"><h2>{TABS.find((t) => t.key === tab)?.label}</h2><span>{visible.length} {visible.length === 1 ? 'field' : 'fields'}</span></div>
        {loading && <p className="dash-empty">Loading fields...</p>}
        {!loading && visible.length === 0 && <p className="dash-empty">No fields in this list.</p>}
        <ul className="dash-list">
          {visible.map((field) => (
            <li key={field.id} className="dash-row">
              <div className="min-w-0">
                <Link to={`/lgu/fields/${field.id}`} className="dash-list-title">{field.field_name}</Link>
                <p className="dash-list-meta">
                  {field.farmer?.full_name ?? 'Unknown farmer'} · {field.purok ?? '—'} · {FIELD_STATUS_LABELS[field.field_status] ?? field.field_status}
                  {field.area_hectares != null && ` · ${field.area_hectares} ha`}
                </p>
                {field.review_note && !field.is_verified && <p className="mt-1 text-xs text-orange-700">Note: {field.review_note}</p>}
              </div>
              <Link to={`/lgu/fields/${field.id}`} className={`row-btn shrink-0${tab === 'pending' ? ' is-edit' : ''}`}>
                {tab === 'pending' ? 'Review' : 'View'}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
