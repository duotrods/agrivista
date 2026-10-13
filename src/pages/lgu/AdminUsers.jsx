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
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Purok</th>
              <th className="p-2">Fields</th>
              <th className="p-2">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const own = fields.filter((f) => f.farmer_id === p.id)
              return (
                <Fragment key={p.id}>
                  <tr className="border-t">
                    <td className="p-2">{p.full_name}</td>
                    <td className="p-2">{p.email}</td>
                    <td className="p-2">{p.purok ?? '—'}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        aria-expanded={expanded === p.id}
                        onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                        className="text-green-700 hover:underline"
                      >
                        {own.length} {own.length === 1 ? 'field' : 'fields'}
                      </button>
                    </td>
                    <td className="p-2">
                      {p.is_active ? (
                        <span className="text-green-700">Active</span>
                      ) : (
                        <span className="text-red-600">Disabled</span>
                      )}
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => handleToggle(p)}
                        className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        {p.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                  {expanded === p.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="p-3">
                        {own.length === 0 && <p className="text-gray-500">No registered fields.</p>}
                        <ul className="flex flex-col gap-1">
                          {own.map((f) => (
                            <li key={f.id}>
                              <Link to={`/lgu/fields/${f.id}`} className="text-green-700 hover:underline">{f.field_name}</Link>
                              <span className="text-xs text-gray-500">
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
      </div>
    </div>
  )
}
