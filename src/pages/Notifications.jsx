import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { listNotifications, markAllAsRead, markAsRead } from '../services/notificationService'

export function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    listNotifications(user.id, 100)
      .then(setNotifications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  async function handleOpen(notification) {
    if (notification.is_read) return
    try {
      await markAsRead(notification.id)
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleMarkAll() {
    try {
      await markAllAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      setError(err.message)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const visible = unreadOnly ? notifications.filter((n) => !n.is_read) : notifications

  return (
    <div className="page-container">
      <PageHeader title="Notifications" description="Approvals, reminders, announcements and review updates." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="toolbar toolbar-start">
        <button type="button" onClick={() => setUnreadOnly(false)} aria-pressed={!unreadOnly} className={`tb-btn${!unreadOnly ? ' is-primary' : ''}`}>All ({notifications.length})</button>
        <button type="button" onClick={() => setUnreadOnly(true)} aria-pressed={unreadOnly} className={`tb-btn${unreadOnly ? ' is-primary' : ''}`}>Unread ({unreadCount})</button>
        <button type="button" onClick={handleMarkAll} disabled={unreadCount === 0} className="tb-btn" style={{ marginLeft: 'auto' }}>Mark all as read</button>
      </div>
      <section className="dash-card">
        <div className="dash-card-head"><h2>{unreadOnly ? 'Unread' : 'All notifications'}</h2><span>{visible.length} {visible.length === 1 ? 'notification' : 'notifications'}</span></div>
        {loading && <p className="dash-empty">Loading notifications...</p>}
        {!loading && visible.length === 0 && <p className="dash-empty">{unreadOnly ? 'No unread notifications.' : 'No notifications yet.'}</p>}
        <ul className="dash-list">
          {visible.map((n) => (
            <li key={n.id} className={n.is_read ? '' : 'is-unread'}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={n.is_read ? 'dash-list-meta' : 'dash-list-title'}>{n.title}</p>
                  {n.message && <p className="mt-1 break-words text-sm text-gray-600">{n.message}</p>}
                  <p className="dash-list-meta mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <span className={`stat-pill shrink-0 ${n.type === 'success' ? 'tone-green' : n.type === 'warning' ? 'tone-amber' : n.type === 'reminder' ? 'tone-blue' : 'tone-green'}`}>{n.type}</span>
              </div>
              <div className="mt-2 flex gap-2">
                {n.link && <Link to={n.link} onClick={() => handleOpen(n)} className="row-btn is-edit">Open</Link>}
                {!n.is_read && <button type="button" onClick={() => handleOpen(n)} className="row-btn">Mark as read</button>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
