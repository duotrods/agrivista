import { PageHeader } from '../../components/layout/PageHeader'
import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FIELD_STATUS_LABELS } from '../../lib/constants'
import { listAllFields } from '../../services/fieldService'
import { listFarmerProfiles, toggleProfileActive } from '../../services/adminService'

export function AdminUsers() {
  const [profiles, setProfiles] = useState([])
  const [fields, setFields] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    listFarmerProfiles().then(setProfiles).catch((err) => setError(err.message))
    listAllFields().then(setFields).catch((err) => setError(err.message))
  }, [])

  async function handleToggle(profile) {
    try {
      const updated = await toggleProfileActive(profile.id, !profile.is_active)
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page-container">
      <PageHeader title="Farmers" description="Registered farmers, their rice fields, and account access." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <section className="dash-card">
        <div className="dash-card-head"><h2>Registered farmers</h2><span>{profiles.length} {profiles.length === 1 ? 'farmer' : 'farmers'}</span></div>
        <table className="dash-table is-text responsive-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Purok</th><th>Fields</th><th>Status</th><th className="cell-actions">Actions</th></tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const own = fields.filter((f) => f.farmer_id === p.id)
              return (
                <Fragment key={p.id}>
                  <tr>
                    <td data-label="Name">{p.full_name}</td>
                    <td data-label="Email" className="break-all">{p.email}</td>
                    <td data-label="Purok">{p.purok ?? '—'}</td>
                    <td data-label="Fields">
                      <button type="button" aria-expanded={expanded === p.id} onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="dash-link">
                        {own.length} {own.length === 1 ? 'field' : 'fields'}
                      </button>
                    </td>
                    <td data-label="Status"><span className={`stat-pill ${p.is_active ? 'tone-green' : 'tone-red'}`}>{p.is_active ? 'Active' : 'Disabled'}</span></td>
                    <td data-label="Actions" className="cell-actions">
                      <div className="row-actions"><button type="button" onClick={() => handleToggle(p)} className="row-btn">{p.is_active ? 'Disable' : 'Enable'}</button></div>
                    </td>
                  </tr>
                  {expanded === p.id && (
                    <tr>
                      <td colSpan={6}>
                        {own.length === 0 && <p className="dash-list-meta">No registered fields.</p>}
                        <ul className="dash-list">
                          {own.map((f) => (
                            <li key={f.id}>
                              <Link to={`/lgu/fields/${f.id}`} className="dash-list-title">{f.field_name}</Link>
                              <span className="dash-list-meta">
                                {' '}· {f.purok ?? '—'} · {FIELD_STATUS_LABELS[f.field_status] ?? f.field_status}
                                {f.area_hectares != null && ` · ${f.area_hectares} ha`} ·{' '}
                                {f.is_verified ? 'Approved' : f.review_status === 'rejected' ? 'Rejected' : f.review_status === 'needs_correction' ? 'Needs correction' : 'Pending'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
