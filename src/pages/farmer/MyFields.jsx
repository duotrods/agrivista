import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import { FIELD_STATUS_LABELS } from '../../lib/constants'
import { reviewBadge } from '../../lib/reviewBadge'
import { listFieldsForFarmer } from '../../services/fieldService'

export function MyFields() {
  const { user } = useAuth()
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    listFieldsForFarmer(user.id).then(setFields).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [user])

  return (
    <div className="page-container">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <PageHeader title="My fields" description="Every rice field you have registered, and where it stands with the LGU." />
        <Link to="/fields/new" className="rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600">+ Add Field</Link>
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="section-heading"><h2>Field directory</h2><span>{fields.length} registered · {fields.reduce((sum, f) => sum + Number(f.area_hectares ?? 0), 0).toFixed(1)} ha</span></div>
      <ul className="mt-4 flex flex-col gap-2">
        {loading && <li className="text-gray-500">Loading fields...</li>}
        {!loading && fields.length === 0 && <li className="text-gray-500">No fields yet. Add your first one above.</li>}
        {fields.map((field) => {
          const [text, tone] = reviewBadge(field)
          return (
            <li key={field.id} className="rounded border px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link to={`/fields/${field.id}`} className="text-green-700 hover:underline">{field.field_name}</Link>
                <span className={`rounded px-2 py-0.5 text-xs ${tone}`}>{text}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{field.purok ?? 'Purok not set'} · {FIELD_STATUS_LABELS[field.field_status] ?? field.field_status}{field.area_hectares != null && ` · ${field.area_hectares} ha`}</p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
