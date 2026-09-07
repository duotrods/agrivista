import { PageHeader } from '../../components/layout/PageHeader'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapView } from '../../components/maps/MapView'
import { useAuth } from '../../hooks/useAuth'
import { listFieldsForFarmer } from '../../services/fieldService'

export function FarmerDashboard() {
  const { user } = useAuth()
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    listFieldsForFarmer(user.id)
      .then(setFields)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="page-container">
      <div className="dashboard-heading mb-4 flex items-center justify-between">
        <PageHeader title="My fields" description="A little care today. A better harvest tomorrow." />
        <Link
          to="/fields/new"
          className="rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600"
        >
          + Add Field
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="farmer-summary" aria-label="Field summary">
        <div><span>Registered fields</span><strong>{loading ? '—' : fields.length}</strong></div>
        <div><span>Verified fields</span><strong>{loading ? '—' : fields.filter((field) => field.is_verified).length}</strong></div>
        <div><span>Total area · hectares</span><strong>{loading ? '—' : fields.reduce((sum, field) => sum + Number(field.area_hectares ?? 0), 0).toFixed(1)}</strong></div>
      </div>
      <div className="section-heading"><h2>Your fields at a glance</h2><span>Explore the map</span></div>
      <MapView fields={fields} />
      <div className="section-heading"><h2>Field directory</h2><span>{fields.length} registered</span></div>

      <ul className="mt-6 flex flex-col gap-2">
        {loading && <li className="text-gray-500">Loading fields...</li>}
        {!loading && fields.length === 0 && (
          <li className="text-gray-500">No fields yet. Add your first one above.</li>
        )}
        {fields.map((field) => (
          <li key={field.id} className="rounded border px-3 py-2">
            <Link to={`/fields/${field.id}`} className="text-green-700 hover:underline">
              {field.field_name}
            </Link>
            <p className="mt-1 text-xs text-gray-500">{field.barangay ?? 'Barangay not set'} · {(field.field_status ?? 'Not set').replace(/_/g, ' ')}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
