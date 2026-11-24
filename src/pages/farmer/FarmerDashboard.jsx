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

      <div className="mb-6 grid grid-cols-2 items-stretch gap-4 lg:grid-cols-3" aria-label="Field summary">
        <StatCard icon="fields" label="Total rice fields" description="Fields you have registered." value={fields.length} loading={loading} to="/fields" />
        <StatCard icon="pending" tone="amber" label="Pending verification" description="Waiting for LGU approval." value={pendingCount} loading={loading} pill={pendingCount > 0 ? 'Awaiting LGU' : undefined} />
        <StatCard icon="planted" label="Planted" description="Fields recently planted." value={count('planted')} loading={loading} />
        <StatCard icon="sprout" label="Growing" description="Fields in the growing stage." value={count('growing')} loading={loading} />
        <StatCard icon="harvest" tone="amber" label="Ready to harvest" description="Fields ready for harvest." value={readyCount} loading={loading} pill={readyCount > 0 ? 'Due' : undefined} />
        <StatCard icon="calendar" tone="blue" label="Upcoming harvests" description="Harvest dates still ahead." value={upcoming.length} loading={loading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="dash-card">
          <div className="dash-card-head"><h2>Upcoming harvest</h2><span>Next 5</span></div>
          {upcoming.length === 0 && <p className="dash-empty">No upcoming harvest dates recorded.</p>}
          <ul className="dash-list">
            {upcoming.slice(0, 5).map((f) => (
              <li key={f.id} className="dash-row">
                <Link to={`/fields/${f.id}`} className="dash-list-title">{f.field_name}</Link>
                <span className="dash-list-meta">{new Date(f.expected_harvest).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="dash-card">
          <div className="dash-card-head"><h2>Notifications</h2><Link to="/notifications" className="dash-link">View all</Link></div>
          {notifications.length === 0 && <p className="dash-empty">No notifications yet.</p>}
          <ul className="dash-list">
            {notifications.map((n) => <li key={n.id} className={n.is_read ? 'dash-list-meta' : 'dash-list-title'}>{n.title}</li>)}
          </ul>
        </section>
      </div>
    </div>
  )
}
