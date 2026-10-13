import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { listNotifications, markAllAsRead, markAsRead } from '../services/notificationService'

const TYPE_STYLES = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-orange-100 text-orange-800',
  reminder: 'bg-blue-100 text-blue-800',
  info: 'bg-gray-100 text-gray-700',
}

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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setUnreadOnly(false)} aria-pressed={!unreadOnly} className={`rounded border px-3 py-2 text-sm ${!unreadOnly ? 'border-green-700 bg-green-50 text-green-800' : ''}`}>All ({notifications.length})</button>
        <button type="button" onClick={() => setUnreadOnly(true)} aria-pressed={unreadOnly} className={`rounded border px-3 py-2 text-sm ${unreadOnly ? 'border-green-700 bg-green-50 text-green-800' : ''}`}>Unread ({unreadCount})</button>
        <button type="button" onClick={handleMarkAll} disabled={unreadCount === 0} className="ml-auto rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">Mark all as read</button>
      </div>
      <ul className="flex flex-col gap-2">
        {loading && <li className="text-gray-500">Loading notifications...</li>}
        {!loading && visible.length === 0 && <li className="text-sm text-gray-500">{unreadOnly ? 'No unread notifications.' : 'No notifications yet.'}</li>}
        {visible.map((n) => (
          <li key={n.id} className={`rounded border p-3 ${n.is_read ? '' : 'border-green-300 bg-green-50/40'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={n.is_read ? 'text-gray-600' : 'font-medium'}>{n.title}</p>
                {n.message && <p className="mt-1 break-words text-sm text-gray-600">{n.message}</p>}
                <p className="mt-1 text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${TYPE_STYLES[n.type] ?? TYPE_STYLES.info}`}>{n.type}</span>
            </div>
            <div className="mt-2 flex gap-3 text-sm">
              {n.link && <Link to={n.link} onClick={() => handleOpen(n)} className="text-green-700 hover:underline">Open</Link>}
              {!n.is_read && <button type="button" onClick={() => handleOpen(n)} className="text-gray-600 hover:underline">Mark as read</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
