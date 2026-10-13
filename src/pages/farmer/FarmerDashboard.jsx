import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ARFieldView } from '../../components/ar/ARFieldView'
import { PageHeader } from '../../components/layout/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import { isReadyToHarvest } from '../../lib/helpers'
import { listFieldsForFarmer } from '../../services/fieldService'
import { createHarvestReminders, listNotifications } from '../../services/notificationService'

function Stat({ label, value, loading }) {
  return (
    <div className="rounded border bg-white p-4 text-center">
      <p className="text-3xl font-semibold text-green-800">{loading ? '—' : value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  )
}

export function FarmerDashboard() {
  const { user } = useAuth()
  const [fields, setFields] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAR, setShowAR] = useState(false)

  useEffect(() => {
    if (!user) return
    createHarvestReminders()
      .catch(() => {})
      .finally(() => listNotifications(user.id, 5).then(setNotifications).catch(() => {}))
    listFieldsForFarmer(user.id)
      .then(setFields)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  const count = (status) => fields.filter((f) => f.field_status === status).length
  const upcoming = fields
    .filter((f) => f.expected_harvest && new Date(f.expected_harvest) >= new Date(new Date().toDateString()))
    .sort((a, b) => a.expected_harvest.localeCompare(b.expected_harvest))
  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <div className="page-container">
      <div className="dashboard-heading mb-4 flex items-center justify-between">
        <PageHeader title="Dashboard" description="A little care today. A better harvest tomorrow." />
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowAR(true)} className="rounded border border-green-700 px-3 py-2 text-sm text-green-700 hover:bg-green-50">View in AR</button>
          <Link to="/fields/new" className="rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600">+ Add Field</Link>
        </div>
      </div>
      {showAR && <ARFieldView fields={fields} linkBase="/fields" onClose={() => setShowAR(false)} />}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Field summary">
        <Stat label="Total rice fields" value={fields.length} loading={loading} />
        <Stat label="Pending verification" value={fields.filter((f) => !f.is_verified && f.review_status === 'pending').length} loading={loading} />
        <Stat label="Planted" value={count('planted')} loading={loading} />
        <Stat label="Growing" value={count('growing')} loading={loading} />
        <Stat label="Ready to harvest" value={fields.filter(isReadyToHarvest).length} loading={loading} />
        <Stat label="Upcoming harvests" value={upcoming.length} loading={loading} />
        <Stat label="Unread notifications" value={unread} loading={loading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded border p-4">
          <h2 className="mb-2 text-lg font-medium">Upcoming harvest</h2>
          {upcoming.length === 0 && <p className="text-sm text-gray-500">No upcoming harvest dates recorded.</p>}
          <ul className="flex flex-col gap-1 text-sm">
            {upcoming.slice(0, 5).map((f) => (
              <li key={f.id} className="flex justify-between gap-2">
                <Link to={`/fields/${f.id}`} className="text-green-700 hover:underline">{f.field_name}</Link>
                <span className="text-gray-600">{new Date(f.expected_harvest).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded border p-4">
          <h2 className="mb-2 text-lg font-medium">Notifications</h2>
          {notifications.length === 0 && <p className="text-sm text-gray-500">No notifications yet.</p>}
          <ul className="flex flex-col gap-1 text-sm">
            {notifications.map((n) => <li key={n.id} className={n.is_read ? 'text-gray-500' : 'font-medium'}>{n.title}</li>)}
          </ul>
          <Link to="/notifications" className="mt-2 inline-block text-sm text-green-700 hover:underline">View all</Link>
        </section>
      </div>
    </div>
  )
}
