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
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-green-800">My Fields</h1>
        <Link
          to="/fields/new"
          className="rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600"
        >
          + Add Field
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <MapView fields={fields} />

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
          </li>
        ))}
      </ul>
    </div>
  )
}
