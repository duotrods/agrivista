import { useEffect, useState } from 'react'
import { Link, useMatch, useNavigate } from 'react-router-dom'
import { AddFieldDrawer } from '../../components/fields/AddFieldDrawer'
import { ToolbarIcon } from '../../components/dashboard/ToolbarIcon'
import { PageHeader } from '../../components/layout/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import { FIELD_STATUS_LABELS } from '../../lib/constants'
import { reviewBadge } from '../../lib/reviewBadge'
import { listFieldsForFarmer } from '../../services/fieldService'

export function MyFields() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const adding = Boolean(useMatch('/fields/new'))
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    listFieldsForFarmer(user.id).then(setFields).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [user])

  const totalHectares = fields.reduce((sum, f) => sum + Number(f.area_hectares ?? 0), 0).toFixed(1)

  return (
    <div className="page-container">
      <PageHeader title="My fields" description="Every rice field you have registered, and where it stands with the LGU.">
        <Link to="/fields/new" className="tb-btn is-primary"><ToolbarIcon name="plus" />Add Field</Link>
      </PageHeader>
      {adding && <AddFieldDrawer onClose={() => navigate('/fields')} />}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <section className="dash-card">
        <div className="dash-card-head">
          <h2>Field directory</h2>
          <span>{fields.length} registered · {totalHectares} ha</span>
        </div>
        {loading && <p className="dash-empty">Loading fields...</p>}
        {!loading && fields.length === 0 && <p className="dash-empty">No fields yet. Add your first one above.</p>}
        {fields.length > 0 && (
          <table className="dash-table is-text responsive-table">
            <thead>
              <tr><th>Field</th><th>Purok</th><th>Crop status</th><th>Area</th><th>Review</th><th className="cell-actions">Actions</th></tr>
            </thead>
            <tbody>
              {fields.map((field) => {
                const [text, tone] = reviewBadge(field)
                return (
                  <tr key={field.id}>
                    <td data-label="Field"><Link to={`/fields/${field.id}`} className="dash-list-title">{field.field_name}</Link></td>
                    <td data-label="Purok">{field.purok ?? 'Not set'}</td>
                    <td data-label="Crop status">{FIELD_STATUS_LABELS[field.field_status] ?? field.field_status}</td>
                    <td data-label="Area">{field.area_hectares != null ? `${field.area_hectares} ha` : '—'}</td>
                    <td data-label="Review"><span className={`rounded px-2 py-0.5 text-xs ${tone}`}>{text}</span></td>
                    <td data-label="Actions" className="cell-actions">
                      <div className="row-actions">
                        <Link to={`/fields/${field.id}`} className="row-btn"><ToolbarIcon name="eye" />View</Link>
                        <Link to={`/fields/${field.id}?edit=1`} className="row-btn is-edit"><ToolbarIcon name="edit" />Edit</Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
