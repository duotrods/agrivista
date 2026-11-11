import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ARFieldView } from '../../components/ar/ARFieldView'
import { StatCard } from '../../components/dashboard/StatCard'
import { ToolbarIcon } from '../../components/dashboard/ToolbarIcon'
import { useAuth } from '../../hooks/useAuth'
import { isReadyToHarvest } from '../../lib/helpers'
import { listFieldsForFarmer } from '../../services/fieldService'
import { createHarvestReminders, listNotifications } from '../../services/notificationService'

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
  const pendingCount = fields.filter((f) => !f.is_verified && f.review_status === 'pending').length
  const readyCount = fields.filter(isReadyToHarvest).length
  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <div className="page-container">
      <div className="dash-toolbar">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">A little care today. A better harvest tomorrow.</p>
        </div>
        <div className="toolbar">
          <button type="button" onClick={() => setShowAR(true)} className="tb-btn"><ToolbarIcon name="ar" />View in AR</button>
          <Link to="/fields/new" className="tb-btn"><ToolbarIcon name="plus" />Add Field</Link>
        </div>
      </div>
      {showAR && <ARFieldView fields={fields} linkBase="/fields" onClose={() => setShowAR(false)} />}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Field summary">
        <StatCard icon="fields" label="Total rice fields" description="Fields you have registered." value={fields.length} loading={loading} to="/fields" />
        <StatCard icon="pending" tone="amber" label="Pending verification" description="Waiting for LGU approval." value={pendingCount} loading={loading} pill={pendingCount > 0 ? 'Awaiting LGU' : undefined} />
        <StatCard icon="planted" label="Planted" description="Fields recently planted." value={count('planted')} loading={loading} />
        <StatCard icon="sprout" label="Growing" description="Fields in the growing stage." value={count('growing')} loading={loading} />
        <StatCard icon="harvest" tone="amber" label="Ready to harvest" description="Fields ready for harvest." value={readyCount} loading={loading} pill={readyCount > 0 ? 'Due' : undefined} />
        <StatCard icon="calendar" tone="blue" label="Upcoming harvests" description="Harvest dates still ahead." value={upcoming.length} loading={loading} />
        <StatCard icon="bell" tone="red" label="Unread notifications" description="Messages you haven't opened." value={unread} loading={loading} to="/notifications" />
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
